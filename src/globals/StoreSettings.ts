import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export type PaymentCollectionMode = 'payAtPickup' | 'payNow' | 'both'

export const defaultPaymentCollectionMode: PaymentCollectionMode = 'payNow'

export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: 'Store Settings',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Daily work',
    description:
      'Storefront-wide switches the business owner can flip without a code change. Changes apply as soon as you save.',
  },
  fields: [
    {
      name: 'paymentCollectionMode',
      label: 'How do customers pay?',
      type: 'select',
      admin: {
        description:
          'Pay online keeps the current Stripe and Venmo checkout. Pay at pickup turns online payment off: customers place the order and pay in person when you hand it over. Let customers choose offers both, so each person picks at checkout.',
      },
      defaultValue: defaultPaymentCollectionMode,
      options: [
        {
          label: 'Pay online at checkout (card or Venmo)',
          value: 'payNow',
        },
        {
          label: 'Pay at pickup (order first, settle in person)',
          value: 'payAtPickup',
        },
        {
          label: 'Let customers choose (pay online now, or pay at pickup)',
          value: 'both',
        },
      ],
      required: true,
    },
  ],
}
