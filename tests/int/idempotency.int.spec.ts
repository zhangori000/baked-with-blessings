import { describe, expect, it, vi } from 'vitest'

import { getDiscussionVisitor } from '@/features/discussion-graph/services/discussionIdentity'
import { idempotentStripeAdapter } from '@/plugins/ecommerce/idempotentStripeAdapter'
import {
  PHONE_VERIFICATION_START_WINDOW_MS,
  createPhoneVerificationStartKey,
} from '@/utilities/phoneVerificationStartGuard'

describe('idempotency helpers', () => {
  it('keeps phone verification start keys stable inside a throttle window', () => {
    const phoneNumber = '+15551234567'
    const now = new Date('2026-04-27T12:00:00.000Z')
    const sameWindow = new Date(now.getTime() + PHONE_VERIFICATION_START_WINDOW_MS - 1)
    const nextWindow = new Date(now.getTime() + PHONE_VERIFICATION_START_WINDOW_MS)

    expect(createPhoneVerificationStartKey({ flow: 'signup', now, phoneNumber })).toBe(
      createPhoneVerificationStartKey({ flow: 'signup', now: sameWindow, phoneNumber }),
    )
    expect(createPhoneVerificationStartKey({ flow: 'signup', now, phoneNumber })).not.toBe(
      createPhoneVerificationStartKey({ flow: 'signup', now: nextWindow, phoneNumber }),
    )
  })

  it('derives a stable anonymous discussion visitor key from request headers', () => {
    const headers = new Headers({
      'user-agent': 'vitest-browser',
      'x-forwarded-for': '203.0.113.10',
    })

    expect(getDiscussionVisitor(headers).visitorKey).toBe(getDiscussionVisitor(headers).visitorKey)
    expect(getDiscussionVisitor(headers).setCookieHeader).toContain('bwb_discussion_visitor=')
  })

  it('returns an existing Stripe order without a transaction id on replay', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({
        docs: [
          {
            id: 9,
            order: {
              accessToken: 'guest-token',
              id: 12,
            },
            status: 'succeeded',
          },
        ],
      })
    const findByID = vi.fn()
    const adapter = idempotentStripeAdapter({
      publishableKey: 'pk_test_placeholder',
      secretKey: 'sk_test_placeholder',
      webhookSecret: 'whsec_placeholder',
    })

    const result = await adapter.confirmOrder({
      data: {
        paymentIntentID: 'pi_existing',
      },
      ordersSlug: 'orders',
      req: {
        payload: {
          find,
          findByID,
        },
      } as never,
      transactionsSlug: 'transactions',
    })

    expect(result).toMatchObject({
      accessToken: 'guest-token',
      message: 'Order already confirmed.',
      orderID: 12,
    })
    expect(result.transactionID).toBeUndefined()
    expect(findByID).not.toHaveBeenCalled()
  })
})
