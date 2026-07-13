import type { Payload, PayloadRequest } from 'payload'

const attentionStatuses = ['processing', 'confirmed', 'ready'] as const

export type AttentionOrder = {
  amount: number | null
  createdAt: string
  customerName: string | null
  id: number
  status: (typeof attentionStatuses)[number]
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
          in: [...attentionStatuses],
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
              !attentionStatuses.includes(order.status as (typeof attentionStatuses)[number])
            ) {
              return []
            }

            return [
              {
                amount: order.amount ?? null,
                createdAt: order.createdAt,
                customerName: order.customerName ?? null,
                id: order.id,
                status: order.status as (typeof attentionStatuses)[number],
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
