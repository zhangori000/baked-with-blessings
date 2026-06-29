import { describe, expect, it, vi } from 'vitest'

import { retireSiblingCartsOnPurchase } from '@/plugins/ecommerce/cartLifecycle'

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
