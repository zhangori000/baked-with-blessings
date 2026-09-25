import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { ALLOW_CUSTOMER_PHONE_IDENTITY_WRITE } from '@/collections/Customers/hooks/customerPhoneIdentity'
import {
  buildBakeryUpdateEmail,
  buildBakeryUpdateSms,
  formatMailingAddress,
  measureSms,
  validateBakeryUpdateDraft,
} from '@/features/bakery-updates/content'
import {
  type BakeryUpdateSenders,
  continueBakeryUpdate,
  sendBakeryUpdateTestEmail,
  startBakeryUpdate,
} from '@/features/bakery-updates/service'
import { claimQueuedDeliveries, interruptedDeliveryError } from '@/features/bakery-updates/store'
import { POST as oneClickUnsubscribe } from '@/app/api/customer-auth/email-unsubscribe/route'
import config from '@/payload.config'
import { createEmailUnsubscribeToken } from '@/utilities/email/emailUnsubscribeToken'
import { normalizePhoneNumber } from '@/utilities/phone'
import { setCustomerMessageConsent } from '@/utilities/setCustomerMessageConsent'

describe('bakery update content', () => {
  it('brands the text, keeps it plain, and says how to stop', () => {
    const body = buildBakeryUpdateSms({
      companyName: 'Baked with Blessings',
      message: '  Lemon drop is back \u2014 we\u2019re at the \u201Cmarket\u201D Saturday\u2026  ',
    })

    expect(body).toBe(
      `Baked with Blessings: Lemon drop is back - we're at the "market" Saturday...\n\nReply STOP to opt out.`,
    )
    expect(measureSms(body).encoding).toBe('gsm')
  })

  it('counts text parts the way carriers bill them', () => {
    expect(measureSms('a'.repeat(160))).toEqual({ characters: 160, encoding: 'gsm', parts: 1 })
    expect(measureSms('a'.repeat(161)).parts).toBe(2)
    expect(measureSms('a'.repeat(306)).parts).toBe(2)
    expect(measureSms('a'.repeat(307)).parts).toBe(3)
    expect(measureSms('[]').characters).toBe(4)
    expect(measureSms(`cookies \u{1F36A}`)).toMatchObject({ encoding: 'unicode', parts: 1 })
    expect(measureSms(`${'a'.repeat(70)}\u{1F36A}`).parts).toBe(2)
  })

  it('escapes the owner message, links bare URLs, and carries the unsubscribe footer', () => {
    const { html, subject, text } = buildBakeryUpdateEmail({
      accountURL: 'https://example.test/account',
      companyName: 'Baked with Blessings',
      mailingAddress: 'PO Box 1 & Co, Plymouth, MN 55441',
      message: 'New flavor <b>today</b>!\nSee https://example.test/menu.\n\nSecond paragraph',
      subject: '  Flavor drop  ',
      unsubscribeURL: 'https://example.test/api/customer-auth/email-unsubscribe?token=1.abc',
    })

    expect(subject).toBe('Flavor drop')
    expect(html).toContain('New flavor &lt;b&gt;today&lt;/b&gt;!<br/>')
    expect(html).toContain('<a href="https://example.test/menu">https://example.test/menu</a>.')
    expect(html).toContain('<p>Second paragraph</p>')
    expect(html).toContain(
      '<a href="https://example.test/api/customer-auth/email-unsubscribe?token=1.abc">Unsubscribe</a>',
    )
    expect(text).toContain('Unsubscribe: https://example.test/api/customer-auth/email-unsubscribe')
    expect(text).toContain('Manage texts and emails: https://example.test/account')
    expect(text).toContain('Order receipts and login codes still arrive')
    expect(text).toContain('Baked with Blessings, PO Box 1 & Co, Plymouth, MN 55441')
    expect(html).toContain('Baked with Blessings, PO Box 1 &amp; Co, Plymouth, MN 55441')
    expect(text).not.toContain('\u2014')
  })

  it('puts a multi-line mailing address on one line, and treats blank as missing', () => {
    expect(formatMailingAddress('  PO Box 1\r\n Plymouth, MN 55441 \n\n')).toBe(
      'PO Box 1, Plymouth, MN 55441',
    )
    expect(formatMailingAddress(' \n ')).toBeNull()
    expect(formatMailingAddress(null)).toBeNull()
  })

  it('refuses drafts the owner cannot send yet', () => {
    const draft = { message: 'Hi', sendEmail: true, sendText: false, subject: 'News' }

    expect(validateBakeryUpdateDraft(draft, { emailsReady: true, textsReady: false })).toBeNull()
    expect(
      validateBakeryUpdateDraft(
        { ...draft, sendEmail: false },
        { emailsReady: true, textsReady: false },
      ),
    ).toMatch(/Choose texts, emails/)
    expect(
      validateBakeryUpdateDraft(
        { ...draft, sendText: true },
        { emailsReady: true, textsReady: false },
      ),
    ).toMatch(/Texts are not set up/)
    expect(
      validateBakeryUpdateDraft(
        { ...draft, message: '  ' },
        { emailsReady: true, textsReady: false },
      ),
    ).toMatch(/Write a message/)
    expect(
      validateBakeryUpdateDraft(
        { ...draft, subject: '' },
        { emailsReady: true, textsReady: false },
      ),
    ).toMatch(/subject/)
    expect(
      validateBakeryUpdateDraft(
        { ...draft, sendEmail: false, sendText: true, subject: '' },
        { emailsReady: true, textsReady: true },
      ),
    ).toBeNull()
    expect(validateBakeryUpdateDraft(draft, { emailsReady: false, textsReady: false })).toMatch(
      /mailing address in Store Settings/,
    )
    expect(
      validateBakeryUpdateDraft(
        { ...draft, sendEmail: false, sendText: true, subject: '' },
        { emailsReady: false, textsReady: true },
      ),
    ).toBeNull()
  })
})

const twilioKeys = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'] as const

const randomPhone = () => {
  for (;;) {
    const exchange = 200 + Math.floor(Math.random() * 700)
    const line = String(Math.floor(Math.random() * 10_000)).padStart(4, '0')
    const phone = normalizePhoneNumber(`+1612${exchange}${line}`)

    if (phone) {
      return phone
    }
  }
}

describe('sending a bakery update', () => {
  let payload: Payload
  const savedEnv: Partial<Record<(typeof twilioKeys)[number], string | undefined>> = {}
  const createdCustomerIDs: number[] = []
  const createdUpdateIDs: number[] = []
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const testMailingAddress = 'PO Box 1\nPlymouth, MN 55441'
  let savedMailingAddress: null | string | undefined

  const setMailingAddress = (mailingAddress: null | string) =>
    payload.updateGlobal({
      data: { mailingAddress },
      depth: 0,
      overrideAccess: true,
      slug: 'store-settings',
    })

  const both = { email: `bakery-update-both-${stamp}@example.test`, phone: randomPhone() }
  const emailOnly = `bakery-update-email-${stamp}@example.test`
  const neither = `bakery-update-neither-${stamp}@example.test`
  const optsOut = `bakery-update-optout-${stamp}@example.test`

  const createCustomer = async (data: { email: string; phone?: string }) => {
    const customer = await payload.create({
      collection: 'customers',
      context: { [ALLOW_CUSTOMER_PHONE_IDENTITY_WRITE]: Boolean(data.phone) },
      data: {
        email: data.email,
        password: `pw-${stamp}`,
        ...(data.phone ? { phone: data.phone, username: data.phone } : {}),
      },
      draft: false,
      overrideAccess: true,
    })

    createdCustomerIDs.push(customer.id)
    return customer
  }

  // Records every address a message was handed to, with a small delay so two
  // overlapping continue calls really do overlap.
  const recordingSenders = () => {
    const sent: string[] = []
    const senders: BakeryUpdateSenders = {
      email: async ({ to }) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        sent.push(`email:${to}`)
        return { ok: true, providerMessageId: `re_${sent.length}` }
      },
      sms: async ({ to }) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        sent.push(`sms:${to}`)
        return { ok: true, providerMessageId: `SM${sent.length}` }
      },
    }

    return { senders, sent }
  }

  const deliveriesFor = async (updateID: number) =>
    (
      await payload.find({
        collection: 'bakery-update-deliveries',
        depth: 0,
        overrideAccess: true,
        pagination: false,
        where: { bakeryUpdate: { equals: updateID } },
      })
    ).docs

  beforeAll(async () => {
    for (const key of twilioKeys) {
      savedEnv[key] = process.env[key]
    }

    // Texts count as "set up" only when these exist. Sends use fake senders.
    process.env.TWILIO_ACCOUNT_SID = 'AC-test'
    process.env.TWILIO_AUTH_TOKEN = 'test-token'
    process.env.TWILIO_FROM_NUMBER = '+16125550100'

    payload = await getPayload({ config: await config })

    savedMailingAddress = (
      await payload.findGlobal({ depth: 0, overrideAccess: true, slug: 'store-settings' })
    ).mailingAddress
    await setMailingAddress(testMailingAddress)

    const bothCustomer = await createCustomer(both)
    await setCustomerMessageConsent({
      channel: 'sms',
      customerID: bothCustomer.id,
      ok: true,
      payload,
      source: 'inbound_yes',
    })
    await setCustomerMessageConsent({
      channel: 'email',
      customerID: bothCustomer.id,
      ok: true,
      payload,
      source: 'signup_email',
    })

    for (const email of [emailOnly, optsOut]) {
      const customer = await createCustomer({ email })
      await setCustomerMessageConsent({
        channel: 'email',
        customerID: customer.id,
        ok: true,
        payload,
        source: 'signup_email',
      })
    }

    await createCustomer({ email: neither })
  })

  afterAll(async () => {
    for (const key of twilioKeys) {
      if (savedEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = savedEnv[key]
      }
    }

    if (!payload) {
      return
    }

    await setMailingAddress(savedMailingAddress ?? null)

    for (const id of createdUpdateIDs) {
      await payload.delete({ collection: 'bakery-updates', id, overrideAccess: true })
    }

    await payload.delete({
      collection: 'message-consent-events',
      overrideAccess: true,
      where: { customer: { in: createdCustomerIDs } },
    })

    for (const id of createdCustomerIDs) {
      await payload.delete({ collection: 'customers', id, overrideAccess: true })
    }
  })

  it('reaches only people who said yes, once each, even with a retry and overlapping calls', async () => {
    const requestKey = `test-${stamp}`
    const draft = {
      message: 'Lemon drop is back Saturday.',
      sendEmail: true,
      sendText: true,
      subject: 'Lemon drop is back',
    }

    const first = await startBakeryUpdate({ draft, payload, requestKey })
    createdUpdateIDs.push(first.id)

    const retried = await startBakeryUpdate({ draft, payload, requestKey })
    expect(retried.id).toBe(first.id)

    const queued = await deliveriesFor(first.id)
    const addresses = queued.map((delivery) => `${delivery.channel}:${delivery.address}`)

    expect(addresses).toContain(`sms:${both.phone}`)
    expect(addresses).toContain(`email:${both.email}`)
    expect(addresses).toContain(`email:${emailOnly}`)
    expect(addresses).toContain(`email:${optsOut}`)
    expect(addresses.some((address) => address.includes(neither))).toBe(false)
    expect(new Set(addresses).size).toBe(addresses.length)

    // Unsubscribing after Send was pressed still wins.
    const optsOutCustomer = queued.find((delivery) => delivery.address === optsOut)
    await setCustomerMessageConsent({
      channel: 'email',
      customerID: Number(optsOutCustomer?.customer),
      ok: false,
      payload,
      source: 'unsubscribe_link',
    })

    const { senders, sent } = recordingSenders()
    const [a, b] = await Promise.all([
      continueBakeryUpdate({ batchSize: 2, payload, senders, updateID: first.id }),
      continueBakeryUpdate({ batchSize: 2, payload, senders, updateID: first.id }),
    ])

    // Whichever call finishes last sees nothing left and closes the update.
    expect(a.done || b.done).toBe(true)

    const again = await continueBakeryUpdate({ payload, senders, updateID: first.id })
    expect(again.done).toBe(true)
    expect(again.sms.queued + again.email.queued).toBe(0)

    expect(sent.filter((entry) => entry === `sms:${both.phone}`)).toHaveLength(1)
    expect(sent.filter((entry) => entry === `email:${both.email}`)).toHaveLength(1)
    expect(sent.filter((entry) => entry === `email:${emailOnly}`)).toHaveLength(1)
    expect(sent).not.toContain(`email:${optsOut}`)
    expect(new Set(sent).size).toBe(sent.length)

    const final = await deliveriesFor(first.id)
    expect(final.find((delivery) => delivery.address === optsOut)?.status).toBe('skipped')
    expect(final.find((delivery) => delivery.address === emailOnly)).toMatchObject({
      providerMessageId: expect.stringMatching(/^re_/),
      status: 'sent',
    })
  })

  it('records a failed send without stopping the rest', async () => {
    const progress = await startBakeryUpdate({
      draft: {
        message: 'Market moved to Sunday.',
        sendEmail: true,
        sendText: false,
        subject: 'Market',
      },
      payload,
      requestKey: `test-fail-${stamp}`,
    })
    createdUpdateIDs.push(progress.id)

    const sent: string[] = []
    const result = await continueBakeryUpdate({
      payload,
      senders: {
        email: async ({ to }) => {
          if (to === emailOnly) {
            throw new Error('Mailbox full')
          }
          sent.push(to)
          return { ok: true }
        },
        sms: async () => ({ error: 'not used', ok: false }),
      },
      updateID: progress.id,
    })

    expect(result.done).toBe(true)
    expect(result.email.failed).toBeGreaterThanOrEqual(1)
    expect(sent).toContain(both.email)

    const deliveries = await deliveriesFor(progress.id)
    expect(deliveries.find((delivery) => delivery.address === emailOnly)).toMatchObject({
      error: 'Mailbox full',
      status: 'failed',
    })
  })

  it('never resends a message that a crashed request may already have sent', async () => {
    const progress = await startBakeryUpdate({
      draft: {
        message: 'Pickup window moved.',
        sendEmail: true,
        sendText: false,
        subject: 'Pickup',
      },
      payload,
      requestKey: `test-crash-${stamp}`,
    })
    createdUpdateIDs.push(progress.id)

    // A request claims everything, then dies before sending.
    const claimed = await claimQueuedDeliveries({ limit: 10_000, payload, updateID: progress.id })
    expect(claimed.length).toBeGreaterThan(0)

    const { senders, sent } = recordingSenders()
    const whileRecent = await continueBakeryUpdate({ payload, senders, updateID: progress.id })
    expect(whileRecent.done).toBe(false)
    expect(sent).toHaveLength(0)

    await (payload.db as unknown as PostgresAdapter).drizzle.execute(sql`
      UPDATE "bakery_update_deliveries" SET "updated_at" = now() - interval '10 minutes'
      WHERE "bakery_update_id" = ${progress.id}
    `)

    const afterCrash = await continueBakeryUpdate({ payload, senders, updateID: progress.id })
    expect(afterCrash.done).toBe(true)
    expect(afterCrash.email.failed).toBe(claimed.length)
    expect(sent).toHaveLength(0)

    const deliveries = await deliveriesFor(progress.id)
    expect(deliveries.every((delivery) => delivery.error === interruptedDeliveryError)).toBe(true)
  })

  it('refuses texts when Twilio Messaging is not configured', async () => {
    const fromNumber = process.env.TWILIO_FROM_NUMBER
    delete process.env.TWILIO_FROM_NUMBER

    try {
      await expect(
        startBakeryUpdate({
          draft: { message: 'Hi', sendEmail: false, sendText: true, subject: '' },
          payload,
          requestKey: `test-no-twilio-${stamp}`,
        }),
      ).rejects.toThrow(/Texts are not set up/)
    } finally {
      process.env.TWILIO_FROM_NUMBER = fromNumber
    }
  })

  it('holds emails until Store Settings has a mailing address, then finishes the send', async () => {
    await setMailingAddress(null)

    try {
      await expect(
        startBakeryUpdate({
          draft: { message: 'Hi', sendEmail: true, sendText: false, subject: 'News' },
          payload,
          requestKey: `test-no-address-${stamp}`,
        }),
      ).rejects.toThrow(/mailing address in Store Settings/)

      await expect(
        sendBakeryUpdateTestEmail({
          draft: { message: 'Hi', subject: 'News' },
          payload,
          to: 'owner@example.test',
        }),
      ).rejects.toThrow(/mailing address in Store Settings/)

      await setMailingAddress(testMailingAddress)
      const progress = await startBakeryUpdate({
        draft: { message: 'Address test', sendEmail: true, sendText: false, subject: 'News' },
        payload,
        requestKey: `test-address-cleared-${stamp}`,
      })
      createdUpdateIDs.push(progress.id)

      // The owner clears the address after pressing Send: nothing goes out,
      // and the queue waits for "Finish sending".
      await setMailingAddress(null)
      const { senders, sent } = recordingSenders()
      await expect(
        continueBakeryUpdate({ payload, senders, updateID: progress.id }),
      ).rejects.toThrow(/mailing address in Store Settings/)
      expect(sent).toHaveLength(0)

      await setMailingAddress(testMailingAddress)
      const finished = await continueBakeryUpdate({ payload, senders, updateID: progress.id })
      expect(finished.done).toBe(true)
      expect(sent).toContain(`email:${emailOnly}`)
    } finally {
      await setMailingAddress(testMailingAddress)
    }
  })

  it('lets mail apps unsubscribe in one click from the email header', async () => {
    const customer = await createCustomer({ email: `bakery-update-oneclick-${stamp}@example.test` })
    await setCustomerMessageConsent({
      channel: 'email',
      customerID: customer.id,
      ok: true,
      payload,
      source: 'signup_email',
    })

    const url = `http://localhost/api/customer-auth/email-unsubscribe?token=${createEmailUnsubscribeToken(customer.id)}`
    const response = await oneClickUnsubscribe(
      new Request(url, { body: 'List-Unsubscribe=One-Click', method: 'POST' }),
    )

    expect(response.status).toBe(200)
    expect(
      (await payload.findByID({ collection: 'customers', id: customer.id, overrideAccess: true }))
        .emailOk,
    ).toBe(false)

    const forged = await oneClickUnsubscribe(
      new Request('http://localhost/api/customer-auth/email-unsubscribe?token=1.forged', {
        method: 'POST',
      }),
    )
    expect(forged.status).toBe(400)
  })

  it('sends a test only to the admin, with a test subject and no customer unsubscribe link', async () => {
    const emails: Array<{ subject: string; text: string; to: string }> = []

    await sendBakeryUpdateTestEmail({
      draft: { message: 'Preview me', subject: 'Flavor drop' },
      payload,
      senders: {
        email: async (email) => {
          emails.push(email)
          return { ok: true }
        },
        sms: async () => ({ error: 'not used', ok: false }),
      },
      to: 'owner@example.test',
    })

    expect(emails).toHaveLength(1)
    expect(emails[0]).toMatchObject({ subject: '[Test] Flavor drop', to: 'owner@example.test' })
    expect(emails[0]?.text).not.toContain('email-unsubscribe?token=')
    expect(emails[0]?.text).toContain('Baked with Blessings, PO Box 1, Plymouth, MN 55441')
  })
})
