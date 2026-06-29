import type { CollectionBeforeChangeHook, Payload, PayloadRequest } from 'payload'
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
  const keep = typeof keepCartID === 'string' ? Number(keepCartID) : keepCartID

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
