import config from '@payload-config'
import { getPayload } from 'payload'
import Stripe from 'stripe'

import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import { isPayNowAllowed } from '@/utilities/storeSettings'

const jsonError = (message: string, status = 400) => Response.json({ error: message }, { status })

const relationshipID = (value: unknown): number | string | undefined => {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id?: number | string }).id
  }
  return typeof value === 'number' || typeof value === 'string' ? value : undefined
}

/**
 * Phase 3 — let a customer pay online (card / Apple Pay) for a pay-at-pickup
 * order they already placed. Creates a Stripe PaymentIntent for the order amount
 * with `orderID` metadata + a pending Transaction; the Stripe webhook
 * (finalizeExistingOrderPayment) marks the order paid once the charge succeeds.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })

  if (!(await isPayNowAllowed(payload))) {
    return jsonError('Online payment is turned off right now.', 409)
  }

  const user = await getAuthenticatedCustomer(payload, request.headers)
  if (!user) {
    return jsonError('Log in to pay for your order.', 401)
  }
  const customerID = typeof user.id === 'number' ? user.id : Number.parseInt(String(user.id), 10)
  if (!Number.isFinite(customerID)) {
    return jsonError('Your account could not be resolved.', 401)
  }

  const { id } = await params
  const orderID = Number.parseInt(id, 10)
  if (!Number.isFinite(orderID)) {
    return jsonError('That order could not be found.', 404)
  }

  const order = await payload
    .findByID({ collection: 'orders', depth: 0, id: orderID, overrideAccess: true })
    .catch(() => null)

  if (!order) {
    return jsonError('That order could not be found.', 404)
  }
  if (relationshipID(order.customer) !== customerID) {
    return jsonError('This is not your order.', 403)
  }
  if (order.manualPaymentMethod !== 'in_person') {
    return jsonError('This order cannot be paid online.', 409)
  }
  if (order.stripePaymentIntentID) {
    return jsonError('This order has already been paid online.', 409)
  }
  if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded') {
    return jsonError('This order is already closed.', 409)
  }

  const amount = typeof order.amount === 'number' ? order.amount : 0
  if (amount <= 0) {
    return jsonError('This order has no amount to charge.', 409)
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return jsonError('Online payment is unavailable right now.', 503)
  }
  const stripe = new Stripe(secretKey)

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      automatic_payment_methods: { enabled: true },
      currency: (order.currency ?? 'USD').toLowerCase(),
      metadata: { orderID: String(order.id) },
    })

    // Pending Transaction; the webhook flips it to succeeded + links the order.
    await payload.create({
      collection: 'transactions',
      data: {
        amount,
        currency: (order.currency ?? 'USD') as 'USD',
        customer: customerID,
        items: (Array.isArray(order.items) ? order.items : []) as never,
        paymentMethod: 'stripe',
        status: 'pending',
        stripe: { paymentIntentID: paymentIntent.id },
      },
      overrideAccess: true,
    })

    return Response.json({
      clientSecret: paymentIntent.client_secret ?? '',
      paymentIntentID: paymentIntent.id,
    })
  } catch (error) {
    payload.logger.error({ err: error, msg: 'order-pay.initiate.error', orderID: order.id })
    return jsonError(error instanceof Error ? error.message : 'Could not start payment.', 502)
  }
}
