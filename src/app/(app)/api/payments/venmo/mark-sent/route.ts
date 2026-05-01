import type { Cart, Order } from '@/payload-types'

import config from '@payload-config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'

import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'

const VENMO_HANDLE = '@bakedwithblessings'

type MarkSentBody = {
  cartID?: number | string
}

const jsonError = (message: string, status = 400) =>
  Response.json(
    {
      error: message,
    },
    { status },
  )

const getRelationshipID = (value: unknown): null | number | string => {
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

const getExistingOrderByReference = async ({
  customerID,
  payload,
  reference,
}: {
  customerID: number | string
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

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const user = await getAuthenticatedCustomer(payload, request.headers)

  if (!user) {
    return jsonError('Log in before reporting a Venmo payment.', 401)
  }

  const customerID =
    typeof user.id === 'number'
      ? user.id
      : typeof user.id === 'string'
        ? Number.parseInt(user.id, 10)
        : Number.NaN

  if (!Number.isFinite(customerID)) {
    return jsonError('Your customer account could not be resolved.', 401)
  }

  let body: MarkSentBody

  try {
    body = (await request.json()) as MarkSentBody
  } catch {
    return jsonError('Cart information was missing from the Venmo payment request.')
  }

  const cartID =
    typeof body.cartID === 'number'
      ? body.cartID
      : typeof body.cartID === 'string'
        ? Number.parseInt(body.cartID, 10)
        : Number.NaN

  if (!Number.isFinite(cartID)) {
    return jsonError('Cart information was missing from the Venmo payment request.')
  }

  const manualPaymentReference = `venmo-cart-${cartID}`
  const existingOrder = await getExistingOrderByReference({
    customerID,
    payload,
    reference: manualPaymentReference,
  })

  if (existingOrder?.id) {
    return Response.json({
      accessToken: existingOrder.accessToken || undefined,
      message: 'We already recorded this Venmo order.',
      orderID: existingOrder.id,
      paymentMethod: 'venmo',
    })
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
    return jsonError('We could not find this cart.', 404)
  }

  const cartCustomerID = getRelationshipID(cart.customer)

  if (cartCustomerID && String(cartCustomerID) !== String(customerID)) {
    return jsonError('This cart belongs to a different account.', 403)
  }

  if (cart.purchasedAt || cart.status === 'purchased') {
    return jsonError('This cart has already been submitted.')
  }

  if (!Array.isArray(cart.items) || cart.items.length === 0) {
    return jsonError('Add items to your cart before reporting a Venmo payment.')
  }

  if (typeof cart.subtotal !== 'number' || cart.subtotal <= 0) {
    return jsonError('This cart does not have a valid total.')
  }

  const now = new Date().toISOString()
  const flattenedCart = flattenCartItems(cart)

  const order = (await payload.create({
    collection: 'orders',
    data: {
      amount: cart.subtotal,
      currency: cart.currency || 'USD',
      customer: customerID,
      items: flattenedCart as never,
      manualPaymentHandle: VENMO_HANDLE,
      manualPaymentMethod: 'venmo',
      manualPaymentReference,
      manualPaymentReportedAt: now,
      manualPaymentStatus: 'reported_sent',
      status: 'processing',
    },
    overrideAccess: true,
  })) as Order

  await payload.update({
    collection: 'carts',
    data: {
      purchasedAt: now,
      status: 'purchased',
    },
    id: cart.id,
    overrideAccess: true,
  })

  payload.logger.info({
    cartID: cart.id,
    msg: 'venmo.manual_payment_reported',
    orderID: order.id,
    userID: customerID,
  })

  return Response.json(
    {
      accessToken: order.accessToken || undefined,
      message:
        'We recorded your Venmo report. The bakery will verify the Venmo payment and contact you through your account contact method.',
      orderID: order.id,
      paymentMethod: 'venmo',
    },
    { status: 201 },
  )
}
