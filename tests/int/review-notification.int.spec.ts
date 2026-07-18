import type { Payload } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createReviewSubmission } from '@/features/reviews/services/reviewMutations'
import { BAKERY_INBOX, OWNER_MONITOR_INBOX } from '@/utilities/email/contactChannels'

describe('review notification delivery', () => {
  afterEach(() => {
    delete process.env.CONTACT_NOTIFICATION_TO
    delete process.env.ORDER_NOTIFICATION_TO
    delete process.env.REVIEW_NOTIFICATION_TO
    delete process.env.VERCEL_ENV
  })

  it('sends local and test review notifications to bakery + owner monitor without optional env recipients', async () => {
    delete process.env.CONTACT_NOTIFICATION_TO
    delete process.env.ORDER_NOTIFICATION_TO
    delete process.env.REVIEW_NOTIFICATION_TO
    delete process.env.VERCEL_ENV

    const sendEmail = vi.fn().mockResolvedValue(undefined)
    const logger = { error: vi.fn(), warn: vi.fn() }
    const payload = {
      create: vi.fn().mockResolvedValue({
        body: 'Wonderful cookies.',
        createdAt: '2026-07-16T12:00:00.000Z',
        customerName: 'Test Guest',
        id: 'review-1',
        title: 'A lovely visit',
      }),
      logger,
      sendEmail,
    } as unknown as Payload
    const formData = new FormData()
    formData.set('body', 'Wonderful cookies.')
    formData.set('customerName', 'Test Guest')
    formData.set('title', 'A lovely visit')

    await createReviewSubmission({ formData, payload })

    expect(sendEmail).toHaveBeenCalledOnce()
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('[LOCAL DEV]'),
        to: [BAKERY_INBOX, OWNER_MONITOR_INBOX],
      }),
    )
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
