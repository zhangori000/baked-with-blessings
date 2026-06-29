import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  Payload,
  PayloadRequest,
} from 'payload'
import { ValidationError } from 'payload'

type CartLifecycleData = {
  items?: unknown
}

type CartLifecycleDocument = {
  purchasedAt?: null | string
}

export const preventPurchasedCartItemChanges: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !data || !originalDoc) {
    return data
  }

  const purchasedAt = (originalDoc as CartLifecycleDocument).purchasedAt
  const itemsWereTouched = 'items' in (data as CartLifecycleData)

  if (!purchasedAt || !itemsWereTouched) {
    return data
  }

  throw new ValidationError(
    {
      collection: 'carts',
      errors: [
        {
          message: 'This cart has already been purchased. Start a new cart before changing items.',
          path: 'items',
        },
      ],
    },
    req.t,
  )
}

type CartDocLike = {
  createdAt?: null | string
  customer?: unknown
  id: number | string
  items?: unknown
  purchasedAt?: null | string
}

/** Coerce a numeric-string cart id to a number; leave a non-numeric (future UUID) id as-is. */
const coerceCartID = (id: number | string): number | string =>
  typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id

/** Pull the id out of a relationship value (number, string, or populated doc). */
const relationshipID = (value: unknown): null | number | string => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' || typeof id === 'string' ? id : null
  }
  return null
}

const cartHasItems = (cart: { items?: unknown } | null | undefined): boolean => {
  const items = cart?.items
  return Array.isArray(items) && items.length > 0
}

type RetireSiblingCartsArgs = {
  customerID: null | number | string | undefined
  keepCartID: number | string
  payload: Payload
  req?: PayloadRequest
}

/**
 * Enforce "one active cart per customer" at purchase time. When a cart is
 * bought, mark every OTHER non-purchased cart belonging to the same customer as
 * abandoned and stamp purchasedAt, so the storefront's `customers.cart` join
 * (which filters purchasedAt:exists:false) stops returning it.
 *
 * Without this, finalizing a purchase only marks the purchased cart, leaving
 * sibling abandoned carts alive. Right after a purchase clears the active cart,
 * the "resume my saved cart" join re-surfaces a stale abandoned cart — a
 * different, unwanted product reappears in the cart. The legitimate resume case
 * is untouched because it involves no purchase event.
 *
 * Never throws: a failure to tidy sibling carts must not undo an order the
 * customer already paid for.
 */
export const retireSiblingCartsOnPurchase = async ({
  customerID,
  keepCartID,
  payload,
  req,
}: RetireSiblingCartsArgs): Promise<void> => {
  if (customerID === null || customerID === undefined || customerID === '') {
    // Guest carts have no customer relationship, so nothing can resurface.
    return
  }

  // The Stripe path carries the cart id as a PaymentIntent metadata string;
  // normalise it so the not_equals filter compares against the numeric cart id.
  const keep = coerceCartID(keepCartID)

  try {
    await payload.update({
      collection: 'carts',
      data: {
        purchasedAt: new Date().toISOString(),
        status: 'abandoned',
      },
      overrideAccess: true,
      req,
      where: {
        and: [
          { customer: { equals: customerID } },
          { id: { not_equals: keep } },
          { purchasedAt: { exists: false } },
        ],
      },
    })
  } catch (error) {
    payload.logger.warn({
      customerID,
      err: error,
      keepCartID,
      msg: 'cart.retire_siblings_failed',
    })
  }
}

/**
 * Content- and recency-aware sibling retirement used when a cart is ACQUIRED by
 * a customer (created, or a customer assigned to it). Unlike the purchase-time
 * retire — which abandons every sibling because the kept cart was just bought —
 * this must never wipe a legitimately saved cart, so it:
 *   - only considers siblings created at-or-before the kept cart, so two
 *     concurrent creates can never mutually abandon each other, and
 *   - retires ONLY empty siblings. A cart that still holds items is never
 *     abandoned here — that would risk wiping the customer's real saved cart
 *     during the mount-adoption race (a race-born cart with one tapped item must
 *     not retire a 5-item saved cart). Non-empty duplicates stay intact and
 *     converge to one at the next purchase via retireSiblingCartsOnPurchase.
 * Never throws.
 */
const retireSiblingCartsOnAcquire = async ({
  customerID,
  keptCart,
  payload,
}: {
  customerID: number | string
  keptCart: CartDocLike
  payload: Payload
}): Promise<void> => {
  const keep = coerceCartID(keptCart.id)

  try {
    // Deliberately run OUTSIDE the caller's create transaction (no `req`). This
    // hook fires inside the create's open transaction; if a sibling update here
    // were joined to it and failed, Payload would kill that transaction, and the
    // swallowed error below would let `create` return a phantom (rolled-back)
    // cart id that 404s forever. Isolating the cleanup keeps a failure here from
    // ever breaking the cart create. `limit` caps the work on a messy account.
    const { docs: siblings } = await payload.find({
      collection: 'carts',
      depth: 0,
      limit: 50,
      overrideAccess: true,
      where: {
        and: [
          { customer: { equals: customerID } },
          { id: { not_equals: keep } },
          { purchasedAt: { exists: false } },
          // Strictly older, or an equal createdAt with a smaller id, so two carts
          // sharing a millisecond timestamp can never abandon each other.
          ...(keptCart.createdAt
            ? [
                {
                  or: [
                    { createdAt: { less_than: keptCart.createdAt } },
                    {
                      and: [
                        { createdAt: { equals: keptCart.createdAt } },
                        { id: { less_than: keep } },
                      ],
                    },
                  ],
                },
              ]
            : []),
        ],
      },
    })

    // Retire ONLY empty siblings (race-born or abandoned-empty carts). Never
    // abandon a sibling that still holds items — preserving saved items strictly
    // dominates aggressive dedup, and it makes the mount-adoption race safe.
    const toRetire = siblings.filter((sibling) => !cartHasItems(sibling))

    for (const sibling of toRetire) {
      await payload.update({
        collection: 'carts',
        data: {
          purchasedAt: new Date().toISOString(),
          status: 'abandoned',
        },
        id: sibling.id,
        overrideAccess: true,
      })
    }
  } catch (error) {
    payload.logger.warn({
      customerID,
      err: error,
      keepCartID: keptCart.id,
      msg: 'cart.retire_siblings_on_acquire_failed',
    })
  }
}

/**
 * Enforce "one active (non-purchased) cart per customer" at the moment a cart
 * becomes owned — on create, or when a customer is first assigned to it. This
 * stops carts accumulating in the first place; retireSiblingCartsOnPurchase only
 * tidies up at purchase.
 *
 * Fires ONLY at ownership acquisition, so it never runs on item add/update/remove
 * (those write only `items` to an already-owned cart) or the guest-cart merge
 * (which never sets `customer`). The req.context flag breaks the cascade: each
 * sibling-retire write re-fires this same hook with the shared req, and the guard
 * makes those re-entries no-ops.
 */
export const enforceOneActiveCartPerCustomer: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (req.context.enforcingOneActiveCart) {
    return doc
  }

  const cart = doc as CartDocLike
  const customerID = relationshipID(cart.customer)

  if (!customerID || cart.purchasedAt) {
    return doc
  }

  const customerJustAssigned =
    operation === 'update' && !relationshipID((previousDoc as CartDocLike | undefined)?.customer)

  if (operation !== 'create' && !customerJustAssigned) {
    return doc
  }

  req.context.enforcingOneActiveCart = true

  try {
    await retireSiblingCartsOnAcquire({
      customerID,
      keptCart: cart,
      payload: req.payload,
    })
  } finally {
    req.context.enforcingOneActiveCart = false
  }

  return doc
}
