import { describe, expect, it, vi } from 'vitest'

import type { Cart } from '@/payload-types'

import { createManualOrderFromCart } from '@/utilities/manualOrders'
import { getPaymentCollectionMode } from '@/utilities/storeSettings'

const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() })

const makeActiveCart = (overrides: Partial<Cart> = {}): Cart =>
  ({
    id: 9,
    currency: 'USD',
    customer: 3,
    items: [
      {
        product: 5,
        quantity: 2,
      },
    ],
    purchasedAt: null,
    subtotal: 1400,
    ...overrides,
  }) as Cart

describe('createManualOrderFromCart (pay-at-pickup and Venmo order engine)', () => {
  it('creates a pickup order from an active cart and marks the cart purchased', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const findByID = vi.fn().mockResolvedValue(makeActiveCart())
    const create = vi.fn().mockResolvedValue({ accessToken: 'order-token', id: 21 })
    const update = vi.fn().mockResolvedValue({})
    const payload = { create, find, findByID, logger: makeLogger(), update }

    const result = await createManualOrderFromCart({
      cartID: 9,
      customerID: 3,
      method: 'in_person',
      payload: payload as never,
      reference: 'pickup-cart-9',
    })

    expect(result.type).toBe('created')
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        data: expect.objectContaining({
          amount: 1400,
          currency: 'USD',
          customer: 3,
          items: [expect.objectContaining({ product: 5, quantity: 2 })],
          manualPaymentMethod: 'in_person',
          manualPaymentReference: 'pickup-cart-9',
          status: 'processing',
        }),
      }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'carts',
        data: expect.objectContaining({
          purchasedAt: expect.any(String),
          status: 'purchased',
        }),
        id: 9,
      }),
    )
  })

  it('returns the existing order when the same reference is submitted again', async () => {
    const existingOrder = { accessToken: 'order-token', id: 21 }
    const find = vi.fn().mockResolvedValue({ docs: [existingOrder] })
    const findByID = vi.fn()
    const create = vi.fn()
    const payload = { create, find, findByID, logger: makeLogger(), update: vi.fn() }

    const result = await createManualOrderFromCart({
      cartID: 9,
      customerID: 3,
      method: 'in_person',
      payload: payload as never,
      reference: 'pickup-cart-9',
    })

    expect(result).toMatchObject({ order: existingOrder, type: 'existing' })
    expect(create).not.toHaveBeenCalled()
    expect(findByID).not.toHaveBeenCalled()
  })

  it('recovers the winner when two simultaneous submits race on the unique reference', async () => {
    const existingOrder = { accessToken: 'order-token', id: 21 }
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [existingOrder] })
    const findByID = vi.fn().mockResolvedValue(makeActiveCart())
    const create = vi.fn().mockRejectedValue({ code: '23505' })
    const update = vi.fn()
    const payload = { create, find, findByID, logger: makeLogger(), update }

    const result = await createManualOrderFromCart({
      cartID: 9,
      customerID: 3,
      method: 'in_person',
      payload: payload as never,
      reference: 'pickup-cart-9',
    })

    expect(result).toMatchObject({ order: existingOrder, type: 'existing' })
    // The race loser must not stamp the cart again; the winner already did.
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses a cart that belongs to a different account', async () => {
    const payload = {
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn().mockResolvedValue(makeActiveCart({ customer: 99 })),
      logger: makeLogger(),
      update: vi.fn(),
    }

    const result = await createManualOrderFromCart({
      cartID: 9,
      customerID: 3,
      method: 'in_person',
      payload: payload as never,
      reference: 'pickup-cart-9',
    })

    expect(result).toMatchObject({ status: 403, type: 'error' })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('refuses a cart that was already submitted', async () => {
    const payload = {
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi
        .fn()
        .mockResolvedValue(makeActiveCart({ purchasedAt: '2026-06-12T00:00:00.000Z' })),
      logger: makeLogger(),
      update: vi.fn(),
    }

    const result = await createManualOrderFromCart({
      cartID: 9,
      customerID: 3,
      method: 'in_person',
      payload: payload as never,
      reference: 'pickup-cart-9',
    })

    expect(result).toMatchObject({ status: 400, type: 'error' })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('refuses an empty cart and a cart without a valid total', async () => {
    const basePayload = () => ({
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      logger: makeLogger(),
      update: vi.fn(),
    })

    const emptyPayload = {
      ...basePayload(),
      findByID: vi.fn().mockResolvedValue(makeActiveCart({ items: [] })),
    }
    const emptyResult = await createManualOrderFromCart({
      cartID: 9,
      customerID: 3,
      method: 'in_person',
      payload: emptyPayload as never,
      reference: 'pickup-cart-9',
    })
    expect(emptyResult).toMatchObject({ status: 400, type: 'error' })

    const freePayload = {
      ...basePayload(),
      findByID: vi.fn().mockResolvedValue(makeActiveCart({ subtotal: 0 })),
    }
    const freeResult = await createManualOrderFromCart({
      cartID: 9,
      customerID: 3,
      method: 'in_person',
      payload: freePayload as never,
      reference: 'pickup-cart-9',
    })
    expect(freeResult).toMatchObject({ status: 400, type: 'error' })
  })

  it('keeps the size variant on order items so receipts stay unambiguous', async () => {
    const create = vi.fn().mockResolvedValue({ accessToken: 'order-token', id: 23 })
    const payload = {
      create,
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn().mockResolvedValue(
        makeActiveCart({
          items: [
            {
              product: 5,
              quantity: 2,
              variant: 41,
            },
            {
              product: { id: 6 } as never,
              quantity: 1,
              variant: { id: 52 } as never,
            },
          ],
          subtotal: 1825,
        }),
      ),
      logger: makeLogger(),
      update: vi.fn().mockResolvedValue({}),
    }

    await createManualOrderFromCart({
      cartID: 9,
      customerID: 3,
      method: 'in_person',
      payload: payload as never,
      reference: 'pickup-cart-9-sized',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 1825,
          items: [
            expect.objectContaining({ product: 5, quantity: 2, variant: 41 }),
            expect.objectContaining({ product: 6, quantity: 1, variant: 52 }),
          ],
        }),
      }),
    )
  })

  it('passes Venmo report extras through to the order', async () => {
    const create = vi.fn().mockResolvedValue({ accessToken: 'order-token', id: 22 })
    const payload = {
      create,
      find: vi.fn().mockResolvedValue({ docs: [] }),
      findByID: vi.fn().mockResolvedValue(makeActiveCart()),
      logger: makeLogger(),
      update: vi.fn().mockResolvedValue({}),
    }

    await createManualOrderFromCart({
      cartID: 9,
      customerID: 3,
      manualPaymentExtras: {
        manualPaymentHandle: '@bakedwithblessings',
        manualPaymentReportedAt: '2026-06-12T00:00:00.000Z',
        manualPaymentStatus: 'reported_sent',
      },
      method: 'venmo',
      payload: payload as never,
      reference: 'venmo-cart-9',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          manualPaymentHandle: '@bakedwithblessings',
          manualPaymentMethod: 'venmo',
          manualPaymentReference: 'venmo-cart-9',
          manualPaymentReportedAt: '2026-06-12T00:00:00.000Z',
          manualPaymentStatus: 'reported_sent',
        }),
      }),
    )
  })
})

describe('getPaymentCollectionMode (the owner payment flag)', () => {
  it('reads pay-at-pickup mode from the store settings global', async () => {
    const payload = {
      findGlobal: vi.fn().mockResolvedValue({ paymentCollectionMode: 'payAtPickup' }),
      logger: makeLogger(),
    }

    await expect(getPaymentCollectionMode(payload as never)).resolves.toBe('payAtPickup')
  })

  it('treats anything else as pay-now', async () => {
    const payload = {
      findGlobal: vi.fn().mockResolvedValue({ paymentCollectionMode: 'something-unknown' }),
      logger: makeLogger(),
    }

    await expect(getPaymentCollectionMode(payload as never)).resolves.toBe('payNow')
  })

  it('falls back to pay-now when the global cannot be read', async () => {
    const logger = makeLogger()
    const payload = {
      findGlobal: vi.fn().mockRejectedValue(new Error('database offline')),
      logger,
    }

    await expect(getPaymentCollectionMode(payload as never)).resolves.toBe('payNow')
    expect(logger.warn).toHaveBeenCalled()
  })
})
