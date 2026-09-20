import { loadAdminDashboardData } from '@/components/AdminDashboard/data'
import { attentionOrderStatuses } from '@/components/AdminDashboard/orderQueue'
import { bakerOrdersSort } from '@/utilities/bakerOrderDisplay'
import type { Payload, PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

const req = {} as PayloadRequest

const createPayload = (results: unknown[]) => {
  const find = vi.fn()

  for (const result of results) {
    if (result instanceof Error) {
      find.mockRejectedValueOnce(result)
    } else {
      find.mockResolvedValueOnce(result)
    }
  }

  return {
    find,
    payload: { find: find as unknown as Payload['find'] },
  }
}

describe('admin dashboard data', () => {
  it('keeps actionable orders newest-first and returns baker-facing display fields', async () => {
    const { find, payload } = createPayload([
      {
        docs: [
          {
            amount: 1400,
            createdAt: '2026-09-03T19:07:02.000Z',
            customerEmail: 'zoe.haase@gmail.com',
            customerName: 'Zoe Haase',
            id: 3,
            items: [
              {
                batchSelections: [{ product: { title: 'Biscoff' }, quantity: 2 }],
                product: { title: 'Build-Your-Own Mini Box' },
                quantity: 1,
              },
            ],
            status: 'processing',
            stripePaymentIntentID: 'pi_3UBfwdKERhbzQZ7s1q8AuUZS',
          },
          {
            amount: 2400,
            createdAt: '2026-07-02T10:00:00.000Z',
            customerName: 'Second customer',
            id: 11,
            status: 'ready',
          },
        ],
        totalDocs: 7,
      },
      { docs: [], totalDocs: 0 },
    ])

    const result = await loadAdminDashboardData({ payload, req })

    expect(result.attentionOrders).toEqual({
      docs: [
        {
          amount: 1400,
          createdAt: '2026-09-03T19:07:02.000Z',
          customerEmail: 'zoe.haase@gmail.com',
          customerName: 'Zoe Haase',
          id: 3,
          itemsSummary: '1× Build-Your-Own Mini Box — 2× Biscoff',
          paymentLabel: 'Paid online',
          primaryCustomer: 'Zoe Haase',
          secondaryCustomer: 'zoe.haase@gmail.com',
          status: 'processing',
        },
        {
          amount: 2400,
          createdAt: '2026-07-02T10:00:00.000Z',
          customerEmail: null,
          customerName: 'Second customer',
          id: 11,
          itemsSummary: 'Open to see items',
          paymentLabel: 'Check payment',
          primaryCustomer: 'Second customer',
          secondaryCustomer: null,
          status: 'ready',
        },
      ],
      kind: 'ready',
      totalDocs: 7,
    })
    expect(find.mock.calls[0]?.[0]).toMatchObject({
      depth: 2,
      limit: 5,
      overrideAccess: false,
      sort: bakerOrdersSort,
      where: { status: { in: [...attentionOrderStatuses] } },
    })
  })

  it.each([
    [{ docs: [], totalDocs: 0 }, { kind: 'none' }],
    [
      { docs: [{ id: 22, title: 'July cookies' }], totalDocs: 1 },
      { kind: 'active', rotation: { flavors: [], id: 22, title: 'July cookies' } },
    ],
    [
      {
        docs: [
          {
            id: 22,
            individualFlavors: [{ title: "S'mores" }, { title: 'Biscoff' }, 41],
            title: 'July cookies',
          },
        ],
        totalDocs: 1,
      },
      {
        kind: 'active',
        rotation: { flavors: ["S'mores", 'Biscoff'], id: 22, title: 'July cookies' },
      },
    ],
    [
      { docs: [{ id: 22 }, { id: 23 }], totalDocs: 2 },
      { kind: 'multiple', totalDocs: 2 },
    ],
  ])('handles active rotation state %# without guessing', async (rotationResult, expected) => {
    const { payload } = createPayload([{ docs: [], totalDocs: 0 }, rotationResult])

    const result = await loadAdminDashboardData({ payload, req })

    expect(result.activeRotation).toEqual(expected)
  })

  it('degrades each preview independently when a query fails', async () => {
    const { payload } = createPayload([
      new Error('orders unavailable'),
      { docs: [{ id: 22, title: 'July cookies' }], totalDocs: 1 },
    ])

    const result = await loadAdminDashboardData({ payload, req })

    expect(result.attentionOrders).toEqual({ kind: 'unavailable' })
    expect(result.activeRotation).toEqual({
      kind: 'active',
      rotation: { flavors: [], id: 22, title: 'July cookies' },
    })
  })
})
