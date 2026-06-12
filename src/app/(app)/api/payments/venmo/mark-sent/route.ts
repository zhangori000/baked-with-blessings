import config from '@payload-config'
import { getPayload } from 'payload'

import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import { createManualOrderFromCart } from '@/utilities/manualOrders'
import { isPayAtPickupMode } from '@/utilities/storeSettings'

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

export async function POST(request: Request) {
  const payload = await getPayload({ config })

  if (await isPayAtPickupMode(payload)) {
    return jsonError(
      'Venmo at checkout is turned off right now. Place your order and pay when you pick it up.',
      409,
    )
  }

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

  const result = await createManualOrderFromCart({
    cartID,
    customerID,
    manualPaymentExtras: {
      manualPaymentHandle: VENMO_HANDLE,
      manualPaymentReportedAt: new Date().toISOString(),
      manualPaymentStatus: 'reported_sent',
    },
    method: 'venmo',
    payload,
    reference: `venmo-cart-${cartID}`,
  })

  if (result.type === 'error') {
    return jsonError(result.message, result.status)
  }

  if (result.type === 'existing') {
    return Response.json({
      accessToken: result.order.accessToken || undefined,
      message: 'We already recorded this Venmo order.',
      orderID: result.order.id,
      paymentMethod: 'venmo',
    })
  }

  return Response.json(
    {
      accessToken: result.order.accessToken || undefined,
      message:
        'We recorded your Venmo report. The bakery will verify the Venmo payment and contact you through your account contact method.',
      orderID: result.order.id,
      paymentMethod: 'venmo',
    },
    { status: 201 },
  )
}
