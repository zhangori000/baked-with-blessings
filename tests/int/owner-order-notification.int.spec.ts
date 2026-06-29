import { describe, expect, it } from 'vitest'

import type { Order } from '@/payload-types'

import {
  buildOwnerOrderEmail,
  getOwnerPaymentSummary,
} from '@/utilities/email/sendOwnerOrderNotification'

const makeOrder = (overrides: Partial<Order>): Order =>
  ({ amount: 700, id: 2, status: 'processing', ...overrides }) as Partial<Order> as Order

describe('getOwnerPaymentSummary (owner email — baker + dev audiences)', () => {
  it('treats pay-at-pickup as not-yet-paid, in plain language with no Stripe jargon', () => {
    const { devNotes, ownerSummary, subjectTag } = getOwnerPaymentSummary(
      makeOrder({ manualPaymentMethod: 'in_person' }),
    )

    expect(subjectTag).toBe('pay at pickup, not paid yet')
    expect(ownerSummary.join(' ')).toMatch(/pay-at-pickup/i)
    expect(ownerSummary.join(' ')).toMatch(/collect payment/i)
    // The baker-facing summary must not leak Stripe/PaymentIntent jargon...
    expect(ownerSummary.join(' ')).not.toMatch(/stripe|paymentintent/i)
    // ...but the dev notes still carry the raw fields.
    expect(devNotes).toContain('manualPaymentMethod: in_person')
  })

  it('marks Stripe orders as paid online', () => {
    const { devNotes, ownerSummary, subjectTag } = getOwnerPaymentSummary(
      makeOrder({ stripePaymentIntentID: 'pi_123' }),
    )

    expect(subjectTag).toBe('paid online')
    expect(ownerSummary.join(' ')).toMatch(/went through|already/i)
    expect(devNotes).toContain('stripePaymentIntentID: pi_123')
  })

  it('lets a recorded Stripe charge win over a manual method on the same order', () => {
    // A pickup order later paid through the online "pay now" flow carries both
    // manualPaymentMethod and a Stripe intent; it must read as paid, not as
    // "pay at pickup, not paid yet".
    const { subjectTag } = getOwnerPaymentSummary(
      makeOrder({ manualPaymentMethod: 'in_person', stripePaymentIntentID: 'pi_456' }),
    )

    expect(subjectTag).toBe('paid online')
  })

  it('keeps Venmo as reported-but-unverified', () => {
    const { ownerSummary, subjectTag } = getOwnerPaymentSummary(
      makeOrder({ manualPaymentMethod: 'venmo', manualPaymentStatus: 'reported_sent' }),
    )

    expect(subjectTag).toMatch(/venmo/i)
    expect(ownerSummary.join(' ')).toMatch(/verify|confirm/i)
  })

  it('falls back to a check-the-order prompt when no payment signal is present', () => {
    const { ownerSummary, subjectTag } = getOwnerPaymentSummary(makeOrder({}))

    expect(subjectTag).toBe('check payment')
    expect(ownerSummary.join(' ')).toMatch(/unknown/i)
  })
})

describe('buildOwnerOrderEmail', () => {
  it('puts the payment headline in the subject and fences dev notes off from the summary', () => {
    const { html, subject, text } = buildOwnerOrderEmail({
      adminURL: 'https://example.test/admin/collections/orders/2',
      companyName: 'Baked with Blessings',
      order: makeOrder({ manualPaymentMethod: 'in_person' }),
    })

    expect(subject).toContain('order #2')
    expect(subject).toContain('pay at pickup, not paid yet')
    // Owner subject must stay em-dash-free (the customer flagged em dashes).
    expect(subject).not.toContain('—')
    expect(text).toContain('What to do:')
    expect(html).toContain('Dev notes')
    expect(text).toContain('manualPaymentMethod: in_person')
  })
})
