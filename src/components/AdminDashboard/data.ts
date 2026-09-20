import type { Payload, PayloadRequest } from 'payload'

import {
  bakerOrdersSort,
  getBakerCustomerIdentity,
  getBakerPaymentLabel,
  summarizeOrderItems,
} from '@/utilities/bakerOrderDisplay'

import { attentionOrderStatuses } from './orderQueue'

export type AttentionOrder = {
  amount: number | null
  createdAt: string
  customerEmail: string | null
  customerName: string | null
  id: number
  itemsSummary: string
  paymentLabel: string
  primaryCustomer: string
  secondaryCustomer: string | null
  status: (typeof attentionOrderStatuses)[number]
}

export type AttentionOrdersState =
  | {
      docs: AttentionOrder[]
      kind: 'ready'
      totalDocs: number
    }
  | { kind: 'unavailable' }

export type ActiveRotationState =
  | { kind: 'active'; rotation: { id: number; title: string } }
  | { kind: 'multiple'; totalDocs: number }
  | { kind: 'none' }
  | { kind: 'unavailable' }

export type AdminDashboardData = {
  activeRotation: ActiveRotationState
  attentionOrders: AttentionOrdersState
}

type DashboardDataSource = Pick<Payload, 'find'>

export const loadAdminDashboardData = async ({
  payload,
  req,
}: {
  payload: DashboardDataSource
  req: PayloadRequest
}): Promise<AdminDashboardData> => {
  const [ordersResult, rotationResult] = await Promise.allSettled([
    payload.find({
      collection: 'orders',
      depth: 2,
      limit: 5,
      overrideAccess: false,
      req,
      select: {
        amount: true,
        createdAt: true,
        customerEmail: true,
        customerName: true,
        guestContactValue: true,
        items: true,
        manualPaymentMethod: true,
        status: true,
        stripePaymentIntentID: true,
      },
      sort: bakerOrdersSort,
      where: {
        status: {
          in: [...attentionOrderStatuses],
        },
      },
    }),
    payload.find({
      collection: 'flavor-rotations',
      depth: 0,
      limit: 2,
      overrideAccess: false,
      req,
      select: {
        title: true,
      },
      where: {
        status: {
          equals: 'active',
        },
      },
    }),
  ])

  const attentionOrders: AttentionOrdersState =
    ordersResult.status === 'fulfilled'
      ? {
          docs: ordersResult.value.docs.flatMap((order) => {
            if (
              !order.status ||
              !attentionOrderStatuses.includes(
                order.status as (typeof attentionOrderStatuses)[number],
              )
            ) {
              return []
            }

            const identity = getBakerCustomerIdentity({
              customerEmail: order.customerEmail,
              customerName: order.customerName,
              guestContactValue: order.guestContactValue,
              id: order.id,
            })

            return [
              {
                amount: order.amount ?? null,
                createdAt: order.createdAt,
                customerEmail: order.customerEmail ?? null,
                customerName: order.customerName ?? null,
                id: order.id,
                itemsSummary: summarizeOrderItems(order.items),
                paymentLabel: getBakerPaymentLabel(order),
                primaryCustomer: identity.primary,
                secondaryCustomer: identity.secondary,
                status: order.status as (typeof attentionOrderStatuses)[number],
              },
            ]
          }),
          kind: 'ready',
          totalDocs: ordersResult.value.totalDocs,
        }
      : { kind: 'unavailable' }

  let activeRotation: ActiveRotationState

  if (rotationResult.status === 'rejected') {
    activeRotation = { kind: 'unavailable' }
  } else if (rotationResult.value.totalDocs === 0) {
    activeRotation = { kind: 'none' }
  } else if (rotationResult.value.totalDocs > 1) {
    activeRotation = { kind: 'multiple', totalDocs: rotationResult.value.totalDocs }
  } else {
    const rotation = rotationResult.value.docs[0]
    activeRotation = rotation
      ? {
          kind: 'active',
          rotation: {
            id: rotation.id,
            title: rotation.title,
          },
        }
      : { kind: 'unavailable' }
  }

  return {
    activeRotation,
    attentionOrders,
  }
}
