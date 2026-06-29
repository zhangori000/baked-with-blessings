import { afterEach, describe, expect, it } from 'vitest'

import type { Order } from '@/payload-types'

import {
  BAKERY_INBOX,
  getCustomerContactEmails,
  getOwnerNotificationRecipients,
} from '@/utilities/email/contactChannels'
import { buildCustomerOrderConfirmation } from '@/utilities/email/sendCustomerOrderConfirmation'

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
    delete process.env.CUSTOMER_CONTACT_EMAILS
    delete process.env.ORDER_NOTIFICATION_TO
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
})
