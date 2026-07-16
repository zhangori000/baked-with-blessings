import { loadAdminDashboardData } from '@/components/AdminDashboard/data'
import { attentionOrderStatuses } from '@/components/AdminDashboard/orderQueue'
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
  it('keeps actionable orders oldest-first and returns only display-safe fields', async () => {
    const { find, payload } = createPayload([
      {
        docs: [
          {
            amount: 1800,
            createdAt: '2026-07-01T10:00:00.000Z',
            customerEmail: 'not-returned@example.com',
            customerName: 'First customer',
            id: 10,
            status: 'processing',
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
          amount: 1800,
          createdAt: '2026-07-01T10:00:00.000Z',
          customerName: 'First customer',
          id: 10,
          status: 'processing',
        },
        {
          amount: 2400,
          createdAt: '2026-07-02T10:00:00.000Z',
          customerName: 'Second customer',
          id: 11,
          status: 'ready',
        },
      ],
      kind: 'ready',
      totalDocs: 7,
    })
    expect(find.mock.calls[0]?.[0]).toMatchObject({
      limit: 5,
      overrideAccess: false,
      sort: 'createdAt',
      where: { status: { in: [...attentionOrderStatuses] } },
    })
  })

  it.each([
    [{ docs: [], totalDocs: 0 }, { kind: 'none' }],
    [
      { docs: [{ id: 22, title: 'July cookies' }], totalDocs: 1 },
      { kind: 'active', rotation: { id: 22, title: 'July cookies' } },
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
      rotation: { id: 22, title: 'July cookies' },
    })
  })
})
