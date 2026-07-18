import { afterEach, describe, expect, it } from 'vitest'

import type { Order } from '@/payload-types'

import {
  BAKERY_INBOX,
  getCustomerContactEmails,
  getOwnerContactNotificationRecipients,
  getOwnerNotificationRecipients,
  getOwnerReviewNotificationRecipients,
} from '@/utilities/email/contactChannels'
import { buildCustomerOrderConfirmation } from '@/utilities/email/sendCustomerOrderConfirmation'
import { classifyOrderPayment } from '@/utilities/orderPayment'

const makeOrder = (overrides: Partial<Order>): Order =>
  ({ amount: 700, id: 2, ...overrides }) as Partial<Order> as Order

const build = (order: Order) =>
  buildCustomerOrderConfirmation({
    companyName: 'Baked with Blessings',
    contactEmails: [BAKERY_INBOX],
    order,
    orderURL: 'https://example.test/orders/2',
  })

describe('contactChannels', () => {
  afterEach(() => {
    delete process.env.CONTACT_NOTIFICATION_TO
    delete process.env.CUSTOMER_CONTACT_EMAILS
    delete process.env.ORDER_NOTIFICATION_TO
    delete process.env.REVIEW_NOTIFICATION_TO
  })

  it('defaults the customer contact to the bakery inbox', () => {
    delete process.env.CUSTOMER_CONTACT_EMAILS
    expect(getCustomerContactEmails()).toEqual([BAKERY_INBOX])
  })

  it('always includes the bakery inbox in owner alerts (deduped) when ORDER_NOTIFICATION_TO is set', () => {
    process.env.ORDER_NOTIFICATION_TO = 'owner@example.com, bakedwithblessings@gmail.com'
    const recipients = getOwnerNotificationRecipients()

    expect(recipients).toContain('owner@example.com')
    expect(recipients.filter((email) => email === BAKERY_INBOX)).toHaveLength(1)
  })

  it('stays empty when ORDER_NOTIFICATION_TO is unset, preserving the local-dev skip', () => {
    delete process.env.ORDER_NOTIFICATION_TO
    expect(getOwnerNotificationRecipients()).toEqual([])
  })

  it('always includes the bakery inbox in contact alerts when a recipient list is configured', () => {
    process.env.CONTACT_NOTIFICATION_TO = 'zhangorienspam@gmail.com, adultkaylaluo@gmail.com'

    expect(getOwnerContactNotificationRecipients()).toEqual([
      'zhangorienspam@gmail.com',
      'adultkaylaluo@gmail.com',
      BAKERY_INBOX,
    ])
  })

  it('falls back to order recipients for contact alerts and still includes the bakery inbox', () => {
    process.env.ORDER_NOTIFICATION_TO = 'owner@example.com'

    expect(getOwnerContactNotificationRecipients()).toEqual(['owner@example.com', BAKERY_INBOX])
  })

  it('deduplicates the bakery inbox in contact alerts', () => {
    process.env.CONTACT_NOTIFICATION_TO = `owner@example.com, ${BAKERY_INBOX.toUpperCase()}`

    const recipients = getOwnerContactNotificationRecipients()

    expect(recipients).toHaveLength(2)
    expect(recipients.map((email) => email.toLowerCase())).toContain(BAKERY_INBOX)
  })

  it('stays empty when contact and order notification lists are unset', () => {
    expect(getOwnerContactNotificationRecipients()).toEqual([])
  })

  it('always includes the bakery inbox in review alerts when a recipient list is configured', () => {
    process.env.REVIEW_NOTIFICATION_TO = 'reviewer@example.com, owner@example.com'

    expect(getOwnerReviewNotificationRecipients()).toEqual([
      'reviewer@example.com',
      'owner@example.com',
      BAKERY_INBOX,
    ])
  })

  it('deduplicates the bakery inbox in review alerts', () => {
    process.env.REVIEW_NOTIFICATION_TO = `reviewer@example.com, ${BAKERY_INBOX.toUpperCase()}`

    const recipients = getOwnerReviewNotificationRecipients()

    expect(recipients).toHaveLength(2)
    expect(recipients.map((email) => email.toLowerCase())).toContain(BAKERY_INBOX)
  })

  it('falls back to contact recipients for review alerts and still includes the bakery inbox', () => {
    process.env.CONTACT_NOTIFICATION_TO = 'contact-owner@example.com'

    expect(getOwnerReviewNotificationRecipients()).toEqual([
      'contact-owner@example.com',
      BAKERY_INBOX,
    ])
  })

  it('defaults review alerts to the bakery inbox when every optional source is unset', () => {
    expect(getOwnerReviewNotificationRecipients()).toEqual([BAKERY_INBOX])
  })
})

describe('buildCustomerOrderConfirmation', () => {
  it('points the customer at the bakery inbox and stays em-dash-free', () => {
    const { html, subject, text } = build(makeOrder({ manualPaymentMethod: 'in_person' }))

    expect(subject).toContain('order #2')
    expect(subject).not.toContain('—')
    expect(text).toContain(BAKERY_INBOX)
    expect(text).not.toContain('—')
    expect(html).toContain(`mailto:${BAKERY_INBOX}`)
    expect(html).not.toContain('—')
  })

  it('keeps the pay-at-pickup reassurance for unpaid pickup orders', () => {
    const { text } = build(makeOrder({ manualPaymentMethod: 'in_person' }))

    expect(text).toMatch(/nothing has been charged/i)
    expect(text).toMatch(/pick up your order/i)
  })

  it('tells a pickup order paid online that payment went through, not "pay at pickup"', () => {
    // A pickup order later paid via the online "pay now" flow carries both
    // manualPaymentMethod and a Stripe intent; the receipt must agree with the
    // owner email (paid), not contradict it.
    const { text } = build(
      makeOrder({ manualPaymentMethod: 'in_person', stripePaymentIntentID: 'pi_9' }),
    )

    expect(text).toMatch(/payment went through/i)
    expect(text).not.toMatch(/nothing has been charged/i)
  })
})

describe('classifyOrderPayment', () => {
  it('treats a recorded Stripe intent as paid online, even with a manual method set', () => {
    const paid = classifyOrderPayment({
      manualPaymentMethod: 'in_person',
      stripePaymentIntentID: 'pi_1',
    })

    expect(paid).toBe('paid_online')
  })

  it('falls back to the manual method when there is no Stripe intent', () => {
    const venmo = classifyOrderPayment({
      manualPaymentMethod: 'venmo',
      stripePaymentIntentID: null,
    })
    const pickup = classifyOrderPayment({
      manualPaymentMethod: 'in_person',
      stripePaymentIntentID: null,
    })
    const unknown = classifyOrderPayment({
      manualPaymentMethod: null,
      stripePaymentIntentID: null,
    })

    expect(venmo).toBe('venmo')
    expect(pickup).toBe('pickup')
    expect(unknown).toBe('unknown')
  })
})
