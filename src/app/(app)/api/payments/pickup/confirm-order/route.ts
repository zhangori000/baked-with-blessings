import config from '@payload-config'
import { getPayload } from 'payload'

import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import { createManualOrderFromCart } from '@/utilities/manualOrders'
import { isPayAtPickupMode } from '@/utilities/storeSettings'

type ConfirmOrderBody = {
  cartID?: number | string
}

const jsonError = (message: string, status = 400) =>
  Response.json(
    {
      error: message,
    },
    { status },
  )

export async function POST(request: Request) {
  const payload = await getPayload({ config })

  // Mirror image of the Venmo route's guard: pickup ordering only exists
  // while the owner has the store in pay-at-pickup mode.
  if (!(await isPayAtPickupMode(payload))) {
    return jsonError(
      'Pay-at-pickup ordering is not active right now. Pay online at checkout instead.',
      409,
    )
  }

  const user = await getAuthenticatedCustomer(payload, request.headers)

  if (!user) {
    return jsonError('Log in before confirming your order.', 401)
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

  let body: ConfirmOrderBody

  try {
    body = (await request.json()) as ConfirmOrderBody
  } catch {
    return jsonError('Cart information was missing from the order request.')
  }

  const cartID =
    typeof body.cartID === 'number'
      ? body.cartID
      : typeof body.cartID === 'string'
        ? Number.parseInt(body.cartID, 10)
        : Number.NaN

  if (!Number.isFinite(cartID)) {
    return jsonError('Cart information was missing from the order request.')
  }

  const result = await createManualOrderFromCart({
    cartID,
    customerID,
    method: 'in_person',
    payload,
    reference: `pickup-cart-${cartID}`,
  })

  if (result.type === 'error') {
    return jsonError(result.message, result.status)
  }

  if (result.type === 'existing') {
    return Response.json({
      accessToken: result.order.accessToken || undefined,
      message: 'We already recorded this order.',
      orderID: result.order.id,
      paymentMethod: 'in_person',
    })
  }

  return Response.json(
    {
      accessToken: result.order.accessToken || undefined,
      message:
        'Order received. Nothing was charged - you pay when you pick it up, and the bakery will contact you through your account contact method.',
      orderID: result.order.id,
      paymentMethod: 'in_person',
    },
    { status: 201 },
  )
}
