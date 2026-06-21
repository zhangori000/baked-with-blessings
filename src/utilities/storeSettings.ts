import type { Payload } from 'payload'

import {
  defaultPaymentCollectionMode,
  type PaymentCollectionMode,
} from '@/globals/StoreSettings'

const PAYMENT_COLLECTION_MODES: readonly PaymentCollectionMode[] = [
  'payNow',
  'payAtPickup',
  'both',
]

export const getPaymentCollectionMode = async (
  payload: Payload,
): Promise<PaymentCollectionMode> => {
  try {
    const settings = await payload.findGlobal({
      slug: 'store-settings',
      depth: 0,
      overrideAccess: true,
    })

    const mode = settings?.paymentCollectionMode
    return PAYMENT_COLLECTION_MODES.includes(mode as PaymentCollectionMode)
      ? (mode as PaymentCollectionMode)
      : defaultPaymentCollectionMode
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: 'Could not read store settings. Falling back to pay-now mode.',
    })

    return defaultPaymentCollectionMode
  }
}

// Online payment (Stripe + Venmo) is available in 'payNow' and 'both'.
export const isPayNowAllowed = async (payload: Payload): Promise<boolean> => {
  const mode = await getPaymentCollectionMode(payload)
  return mode === 'payNow' || mode === 'both'
}

// Pay-at-pickup ordering is available in 'payAtPickup' and 'both'.
export const isPayAtPickupAllowed = async (payload: Payload): Promise<boolean> => {
  const mode = await getPaymentCollectionMode(payload)
  return mode === 'payAtPickup' || mode === 'both'
}
