import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

type AdminOrderFixture = {
  completedName: string
  ids: number[]
  openName: string
}

export const seedAdminOrderFixture = async (): Promise<AdminOrderFixture> => {
  const payload = await getPayload({ config })
  const marker = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const openName = `Open queue order ${marker}`
  const completedName = `Completed queue order ${marker}`

  const openOrder = await payload.create({
    collection: 'orders',
    data: {
      amount: 800,
      currency: 'USD',
      customerName: openName,
      status: 'confirmed',
    },
    overrideAccess: true,
  })
  const completedOrder = await payload.create({
    collection: 'orders',
    data: {
      amount: 800,
      currency: 'USD',
      customerName: completedName,
      status: 'completed',
    },
    overrideAccess: true,
  })

  return {
    completedName,
    ids: [openOrder.id, completedOrder.id],
    openName,
  }
}

export const cleanupAdminOrderFixture = async (ids: number[]): Promise<void> => {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'orders',
    overrideAccess: true,
    where: {
      id: {
        in: ids,
      },
    },
  })
}
