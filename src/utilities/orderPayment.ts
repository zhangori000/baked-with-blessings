import type { Order } from '@/payload-types'

export type OrderPaymentKind = 'paid_online' | 'pickup' | 'unknown' | 'venmo'

/**
 * Single source of truth for which checkout path an order is on, so the owner
 * notification and the customer receipt never disagree about the same order.
 *
 * A recorded Stripe PaymentIntent means money was collected online and wins over
 * any manual method the order also carries: a pickup order can later be paid
 * through the online "pay now" flow, which leaves manualPaymentMethod set AND
 * attaches a stripePaymentIntentID.
 */
export const classifyOrderPayment = (
  order: Pick<Order, 'manualPaymentMethod' | 'stripePaymentIntentID'>,
): OrderPaymentKind => {
  if (order.stripePaymentIntentID) {
    return 'paid_online'
  }

  if (order.manualPaymentMethod === 'venmo') {
    return 'venmo'
  }

  if (order.manualPaymentMethod === 'in_person') {
    return 'pickup'
  }

  return 'unknown'
}
