import { describe, expect, it, vi } from 'vitest'

import {
  enforceOneActiveCartPerCustomer,
  retireSiblingCartsOnPurchase,
} from '@/plugins/ecommerce/cartLifecycle'

const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() })

describe('retireSiblingCartsOnPurchase', () => {
  it("abandons the customer's OTHER non-purchased carts, keeping the purchased one", async () => {
    const update = vi.fn().mockResolvedValue({ docs: [], errors: [] })
    const payload = { logger: makeLogger(), update }

    await retireSiblingCartsOnPurchase({ customerID: 3, keepCartID: 9, payload: payload as never })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'carts',
        data: expect.objectContaining({ purchasedAt: expect.any(String), status: 'abandoned' }),
        where: {
          and: [
            { customer: { equals: 3 } },
            { id: { not_equals: 9 } },
            { purchasedAt: { exists: false } },
          ],
        },
      }),
    )
  })

  it('coerces a string cart id (Stripe metadata) to a number for the not_equals filter', async () => {
    const update = vi.fn().mockResolvedValue({ docs: [], errors: [] })
    const payload = { logger: makeLogger(), update }

    await retireSiblingCartsOnPurchase({ customerID: 3, keepCartID: '9', payload: payload as never })

    const arg = update.mock.calls[0][0] as { where: { and: unknown[] } }
    expect(arg.where.and).toContainEqual({ id: { not_equals: 9 } })
  })

  it('does nothing for a guest (no customer id)', async () => {
    const update = vi.fn()
    const payload = { logger: makeLogger(), update }

    await retireSiblingCartsOnPurchase({ customerID: null, keepCartID: 9, payload: payload as never })

    expect(update).not.toHaveBeenCalled()
  })

  it('never throws when the update fails; it logs a warning instead', async () => {
    const logger = makeLogger()
    const update = vi.fn().mockRejectedValue(new Error('db down'))
    const payload = { logger, update }

    await expect(
      retireSiblingCartsOnPurchase({ customerID: 3, keepCartID: 9, payload: payload as never }),
    ).resolves.toBeUndefined()
    expect(logger.warn).toHaveBeenCalled()
  })
})

describe('enforceOneActiveCartPerCustomer (one active cart at acquisition)', () => {
  const makeReq = (siblings: unknown[] = []) => {
    const find = vi.fn().mockResolvedValue({ docs: siblings })
    const update = vi.fn().mockResolvedValue({})
    const req = {
      context: {} as Record<string, unknown>,
      payload: { find, logger: makeLogger(), update },
    }
    return { find, req, update }
  }

  const withItems = (id: number, customer: number) => ({
    createdAt: '2026-06-01T00:00:00.000Z',
    customer,
    id,
    items: [{ product: 5, quantity: 1 }],
  })
  const empty = (id: number, customer: number) => ({
    createdAt: '2026-06-01T00:00:00.000Z',
    customer,
    id,
    items: [],
  })

  it('NEVER abandons a sibling that has items when the new (kept) cart is empty', async () => {
    // The mount-adoption race: an empty cart C2 is born while the real saved
    // cart C1 (with items) exists. C1 must survive.
    const { find, req, update } = makeReq([withItems(1, 3)])

    await enforceOneActiveCartPerCustomer({ doc: empty(2, 3), operation: 'create', req } as never)

    expect(find).toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('abandons an empty sibling when a new owned cart appears', async () => {
    const { req, update } = makeReq([empty(1, 3)])

    await enforceOneActiveCartPerCustomer({ doc: withItems(2, 3), operation: 'create', req } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'carts',
        data: expect.objectContaining({ status: 'abandoned' }),
        id: 1,
      }),
    )
  })

  it('NEVER abandons a sibling that has items, even when the kept cart also has items', async () => {
    // Preserving saved items strictly dominates dedup: two non-empty carts are
    // left to converge at purchase, never silently abandoned at acquisition.
    const { req, update } = makeReq([withItems(1, 3)])

    await enforceOneActiveCartPerCustomer({ doc: withItems(2, 3), operation: 'create', req } as never)

    expect(update).not.toHaveBeenCalled()
  })

  it('does NOT fire on an item-add (customer already set on an owned cart)', async () => {
    const { find, req } = makeReq([empty(1, 3)])

    await enforceOneActiveCartPerCustomer({
      doc: withItems(2, 3),
      operation: 'update',
      previousDoc: withItems(2, 3),
      req,
    } as never)

    expect(find).not.toHaveBeenCalled()
  })

  it('DOES fire when a customer is first assigned to a cart', async () => {
    const { find, req } = makeReq([])

    await enforceOneActiveCartPerCustomer({
      doc: empty(2, 3),
      operation: 'update',
      previousDoc: { ...empty(2, 3), customer: null },
      req,
    } as never)

    expect(find).toHaveBeenCalled()
  })

  it('does nothing for a guest cart (no customer)', async () => {
    const { find, req } = makeReq([])

    await enforceOneActiveCartPerCustomer({
      doc: { ...empty(2, 3), customer: null },
      operation: 'create',
      req,
    } as never)

    expect(find).not.toHaveBeenCalled()
  })

  it('does nothing once the cart is purchased', async () => {
    const { find, req } = makeReq([])

    await enforceOneActiveCartPerCustomer({
      doc: { ...withItems(2, 3), purchasedAt: '2026-06-02T00:00:00.000Z' },
      operation: 'create',
      req,
    } as never)

    expect(find).not.toHaveBeenCalled()
  })

  it('no-ops on re-entry so the sibling-retire writes cannot recurse', async () => {
    const { find, req } = makeReq([empty(1, 3)])
    req.context.enforcingOneActiveCart = true

    await enforceOneActiveCartPerCustomer({ doc: withItems(2, 3), operation: 'create', req } as never)

    expect(find).not.toHaveBeenCalled()
  })

  it('never throws when a sibling update fails; logs a warning and returns the doc', async () => {
    const logger = makeLogger()
    const find = vi.fn().mockResolvedValue({ docs: [empty(1, 3)] })
    const update = vi.fn().mockRejectedValue(new Error('deadlock'))
    const req = { context: {} as Record<string, unknown>, payload: { find, logger, update } }
    const doc = withItems(2, 3)

    await expect(
      enforceOneActiveCartPerCustomer({ doc, operation: 'create', req } as never),
    ).resolves.toBe(doc)
    expect(logger.warn).toHaveBeenCalled()
  })
})
