import type { Payload } from 'payload'

import {
  defaultPaymentCollectionMode,
  type PaymentCollectionMode,
} from '@/globals/StoreSettings'

export const getPaymentCollectionMode = async (
  payload: Payload,
): Promise<PaymentCollectionMode> => {
  try {
    const settings = await payload.findGlobal({
      slug: 'store-settings',
      depth: 0,
      overrideAccess: true,
    })

    return settings?.paymentCollectionMode === 'payAtPickup' ? 'payAtPickup' : 'payNow'
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: 'Could not read store settings. Falling back to pay-now mode.',
    })

    return defaultPaymentCollectionMode
  }
}

export const isPayAtPickupMode = async (payload: Payload): Promise<boolean> =>
  (await getPaymentCollectionMode(payload)) === 'payAtPickup'
