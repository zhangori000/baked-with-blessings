import type { Field } from 'payload'

import type { Order } from '@/payload-types'
import {
  bakerOrdersSort,
  getBakerPaymentLabel,
  summarizeOrderItemsForAdmin,
} from '@/utilities/bakerOrderDisplay'

export const ordersBakerDefaultSort = bakerOrdersSort

export const ordersBakerUseAsTitle = 'customerName'

export const ordersBakerDefaultColumns = [
  'customerName',
  'customerEmail',
  'bakerItems',
  'status',
  'bakerPayment',
  'amount',
  'createdAt',
] as const

export const ordersBakerListSearchableFields = [
  'customerName',
  'customerEmail',
  'guestContactValue',
] as const

export const ordersBakerDescription =
  'Orders to bake, newest first. Open one to see the cookies, who it is for, and whether it is paid. Pay-at-pickup orders still need payment when you hand them over.'

const getPaymentSibling = (
  siblingData: Record<string, unknown> | undefined,
): Pick<Order, 'manualPaymentMethod' | 'stripePaymentIntentID'> => ({
  manualPaymentMethod:
    siblingData?.manualPaymentMethod === 'venmo' || siblingData?.manualPaymentMethod === 'in_person'
      ? siblingData.manualPaymentMethod
      : null,
  stripePaymentIntentID:
    typeof siblingData?.stripePaymentIntentID === 'string' ? siblingData.stripePaymentIntentID : null,
})

export const createBakerFacingOrderFields = (): Field[] => [
  {
    name: 'bakerItems',
    type: 'text',
    admin: {
      description: 'A short list of what to bake. Open the order for the full breakdown.',
      position: 'sidebar',
      readOnly: true,
    },
    hooks: {
      afterRead: [
        async ({ req, siblingData }) =>
          summarizeOrderItemsForAdmin({
            items: siblingData?.items as Parameters<typeof summarizeOrderItemsForAdmin>[0]['items'],
            payload: req.payload,
          }),
      ],
    },
    label: 'What they ordered',
    virtual: true,
  },
  {
    name: 'bakerPayment',
    type: 'text',
    admin: {
      description: 'Whether this order is already paid, or still needs collection.',
      position: 'sidebar',
      readOnly: true,
    },
    hooks: {
      afterRead: [
        ({ siblingData }) => getBakerPaymentLabel(getPaymentSibling(siblingData as Record<string, unknown>)),
      ],
    },
    label: 'Payment',
    virtual: true,
  },
]
