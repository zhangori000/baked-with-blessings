import type { Cart, Order } from '@/payload-types'
import type { Payload } from 'payload'

import { retireSiblingCartsOnPurchase } from '@/plugins/ecommerce/cartLifecycle'
import { isUniqueConstraintError } from '@/utilities/idempotency'

export const getRelationshipID = (value: unknown): null | number | string => {
  if (!value) return null

  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id

    return typeof id === 'number' || typeof id === 'string' ? id : null
  }

  return null
}

const stripArrayRowIDs = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return value
  }

  return value.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return stripArrayRowIDs(entry)
    }

    const { id: _id, ...rest } = entry as Record<string, unknown>

    return Object.fromEntries(
      Object.entries(rest).map(([key, nestedValue]) => [key, stripArrayRowIDs(nestedValue)]),
    )
  })
}

const flattenCartItems = (cart: Cart) =>
  (cart.items || []).map((item) => {
    const productID = getRelationshipID(item.product)
    const variantID = getRelationshipID(item.variant)
    const { id: _id, product: _product, variant: _variant, ...customProperties } = item

    return {
      ...Object.fromEntries(
        Object.entries(customProperties).map(([key, value]) => [key, stripArrayRowIDs(value)]),
      ),
      product: productID,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      ...(variantID ? { variant: variantID } : {}),
    }
  })

const findOrderByReference = async ({
  customerID,
  payload,
  reference,
}: {
  customerID: number
  payload: Payload
  reference: string
}) => {
  const {
    docs: [existingOrder],
  } = await payload.find({
    collection: 'orders',
    limit: 1,
    overrideAccess: true,
    select: {
      accessToken: true,
      id: true,
    },
    where: {
      and: [
        {
          manualPaymentReference: {
            equals: reference,
          },
        },
        {
          customer: {
            equals: customerID,
          },
        },
      ],
    },
  })

  return existingOrder as Pick<Order, 'accessToken' | 'id'> | undefined
}

export type ManualOrderMethod = 'in_person' | 'venmo'

export type ManualOrderResult =
  | { message: string; status: number; type: 'error' }
  | { order: Order; type: 'created' }
  | { order: Pick<Order, 'accessToken' | 'id'>; type: 'existing' }

/**
 * Turns an active cart into an order with NO card processor involved
 * (the colored path: cart -> order, no transaction row). Shared by the
 * Venmo report flow and the pay-at-pickup flow. Idempotent per
 * (reference, customer): retries and double-clicks return the existing order.
 */
export const createManualOrderFromCart = async ({
  cartID,
  customerID,
  manualPaymentExtras = {},
  method,
  payload,
  reference,
}: {
  cartID: number
  customerID: number
  manualPaymentExtras?: Partial<
    Pick<Order, 'manualPaymentHandle' | 'manualPaymentReportedAt' | 'manualPaymentStatus'>
  >
  method: ManualOrderMethod
  payload: Payload
  reference: string
}): Promise<ManualOrderResult> => {
  const existingOrder = await findOrderByReference({ customerID, payload, reference })

  if (existingOrder?.id) {
    return { order: existingOrder, type: 'existing' }
  }

  let cart: Cart

  try {
    cart = (await payload.findByID({
      collection: 'carts',
      depth: 2,
      id: cartID,
      overrideAccess: true,
    })) as Cart
  } catch {
    return { message: 'We could not find this cart.', status: 404, type: 'error' }
  }

  const cartCustomerID = getRelationshipID(cart.customer)

  if (cartCustomerID && String(cartCustomerID) !== String(customerID)) {
    return { message: 'This cart belongs to a different account.', status: 403, type: 'error' }
  }

  if (cart.purchasedAt || cart.status === 'purchased') {
    return { message: 'This cart has already been submitted.', status: 400, type: 'error' }
  }

  if (!Array.isArray(cart.items) || cart.items.length === 0) {
    return {
      message: 'Add items to your cart before placing this order.',
      status: 400,
      type: 'error',
    }
  }

  if (typeof cart.subtotal !== 'number' || cart.subtotal <= 0) {
    return { message: 'This cart does not have a valid total.', status: 400, type: 'error' }
  }

  const flattenedCart = flattenCartItems(cart)
  let order: Order

  try {
    order = (await payload.create({
      collection: 'orders',
      data: {
        amount: cart.subtotal,
        currency: cart.currency || 'USD',
        customer: customerID,
        items: flattenedCart as never,
        manualPaymentMethod: method,
        manualPaymentReference: reference,
        status: 'processing',
        ...manualPaymentExtras,
      },
      overrideAccess: true,
    })) as Order
  } catch (error) {
    // Two simultaneous clicks can both pass the pre-check; the unique index
    // on manualPaymentReference turns the loser into a lookup.
    if (isUniqueConstraintError(error)) {
      const duplicateOrder = await findOrderByReference({ customerID, payload, reference })

      if (duplicateOrder?.id) {
        return { order: duplicateOrder, type: 'existing' }
      }
    }

    throw error
  }

  await payload.update({
    collection: 'carts',
    data: {
      purchasedAt: new Date().toISOString(),
      status: 'purchased',
    },
    id: cart.id,
    overrideAccess: true,
  })

  // Retire the customer's other non-purchased carts so an abandoned one cannot
  // resurface after this order clears the active cart (same fix as the card path).
  await retireSiblingCartsOnPurchase({ customerID, keepCartID: cart.id, payload })

  payload.logger.info({
    cartID: cart.id,
    method,
    msg: 'manual_order.created',
    orderID: order.id,
    userID: customerID,
  })

  return { order, type: 'created' }
}
