import type { Payload, PayloadRequest } from 'payload'

import { attentionOrderStatuses } from './orderQueue'

export type AttentionOrder = {
  amount: number | null
  createdAt: string
  customerName: string | null
  id: number
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
  | { flavorTitles: string[]; kind: 'active'; rotation: { id: number; title: string } }
  | { kind: 'multiple'; totalDocs: number }
  | { kind: 'none' }
  | { kind: 'unavailable' }

const getFlavorTitle = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const title = 'title' in value ? value.title : null
  return typeof title === 'string' && title.trim() ? title : null
}

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
      depth: 0,
      limit: 5,
      overrideAccess: false,
      req,
      select: {
        amount: true,
        createdAt: true,
        customerName: true,
        status: true,
      },
      sort: 'createdAt',
      where: {
        status: {
          in: [...attentionOrderStatuses],
        },
      },
    }),
    payload.find({
      collection: 'flavor-rotations',
      depth: 1,
      limit: 2,
      overrideAccess: false,
      req,
      select: {
        individualFlavors: true,
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

            return [
              {
                amount: order.amount ?? null,
                createdAt: order.createdAt,
                customerName: order.customerName ?? null,
                id: order.id,
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
          flavorTitles: Array.isArray(rotation.individualFlavors)
            ? rotation.individualFlavors.flatMap((flavor) => {
                const title = getFlavorTitle(flavor)
                return title ? [title] : []
              })
            : [],
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
