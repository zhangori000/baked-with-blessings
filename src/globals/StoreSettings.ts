import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'

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
    {
      name: 'mailingAddress',
      label: 'Mailing address for bakery emails',
      type: 'textarea',
      access: {
        read: adminOnlyFieldAccess,
      },
      admin: {
        description:
          'US email law requires a postal address at the bottom of every bakery email. A PO box works if you would rather not share your home address. Bakery emails cannot be sent until this is filled in. It is not shown on the website.',
        placeholder: 'PO Box 123, Plymouth, MN 55441',
        rows: 3,
      },
    },
  ],
}
