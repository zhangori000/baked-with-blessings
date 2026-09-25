// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { ALLOW_CUSTOMER_PHONE_IDENTITY_WRITE } from '@/collections/Customers/hooks/customerPhoneIdentity'
import config from '@/payload.config'
import { getServerSideURL } from '@/utilities/getURL'
import {
  intentFromTwilioOptOutType,
  isTwilioHandledKeyword,
  parseInboundSmsBody,
} from '@/utilities/messageConsent'
import { normalizePhoneNumber } from '@/utilities/phone'
import {
  buildTwilioMessagingSignature,
  buildTwilioMessagingTwiml,
} from '@/utilities/sms/twilioMessages'

const mocks = vi.hoisted(() => ({
  authenticatedCustomerID: null as null | number,
  welcomeSmsTo: [] as string[],
}))

vi.mock('@/utilities/twilioVerify', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utilities/twilioVerify')>()),
  checkPhoneVerification: vi.fn(async () => true),
}))

vi.mock('@/utilities/emailVerificationStartGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utilities/emailVerificationStartGuard')>()),
  checkEmailVerification: vi.fn(async () => ({ success: true })),
}))

vi.mock('@/utilities/email/sendCustomerWelcomeEmail', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utilities/email/sendCustomerWelcomeEmail')>()),
  sendCustomerWelcomeEmail: vi.fn(async () => ({ sent: true })),
}))

vi.mock('@/utilities/sms/sendCustomerWelcomeSms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utilities/sms/sendCustomerWelcomeSms')>()),
  sendCustomerWelcomeSms: vi.fn(async ({ phone }: { phone: string }) => {
    mocks.welcomeSmsTo.push(phone)
    return { sent: true }
  }),
}))

vi.mock('next/headers.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/headers.js')>()),
  headers: async () => new Headers(),
}))

vi.mock('@/utilities/getAuthenticatedCustomer', () => ({
  getAuthenticatedCustomer: vi.fn(async () =>
    mocks.authenticatedCustomerID
      ? { collection: 'customers', id: mocks.authenticatedCustomerID }
      : null,
  ),
}))

describe('text keywords', () => {
  it('maps every Twilio built-in keyword, trimmed and in any case', () => {
    for (const word of [
      'STOP',
      ' stopall ',
      'Unsubscribe',
      'cancel',
      'END',
      'revoke',
      'OptOut',
      'quit',
    ]) {
      expect(parseInboundSmsBody(word)).toBe('stop')
      expect(isTwilioHandledKeyword(word)).toBe(true)
    }

    for (const word of ['START', 'unstop']) {
      expect(parseInboundSmsBody(word)).toBe('start')
      expect(isTwilioHandledKeyword(word)).toBe(true)
    }

    expect(parseInboundSmsBody(' Yes ')).toBe('yes')
    expect(isTwilioHandledKeyword(' Yes ')).toBe(true)
    expect(parseInboundSmsBody('HELP')).toBe('help')
    expect(parseInboundSmsBody('info')).toBe('help')
  })

  it('leaves Y, N, and no for us to answer, and does not guess sentences', () => {
    for (const word of ['Y', 'n', 'No']) {
      expect(isTwilioHandledKeyword(word)).toBe(false)
    }

    expect(parseInboundSmsBody('stop please')).toBe('unknown')
    expect(parseInboundSmsBody('yes!')).toBe('unknown')
    expect(isTwilioHandledKeyword('stop please')).toBe(false)
  })

  it('reads the OptOutType Twilio adds for custom keywords', () => {
    expect(intentFromTwilioOptOutType('STOP')).toBe('stop')
    expect(intentFromTwilioOptOutType('start')).toBe('start')
    expect(intentFromTwilioOptOutType('HELP')).toBe('help')
    expect(intentFromTwilioOptOutType('')).toBeNull()
    expect(intentFromTwilioOptOutType('OTHER')).toBeNull()
  })

  it('answers with an empty TwiML response when there is nothing to say', () => {
    expect(buildTwilioMessagingTwiml('')).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    )
  })
})

const randomPhone = () => {
  for (;;) {
    const exchange = 200 + Math.floor(Math.random() * 700)
    const line = String(Math.floor(Math.random() * 10_000)).padStart(4, '0')
    const phone = normalizePhoneNumber(`+1763${exchange}${line}`)

    if (phone) {
      return phone
    }
  }
}

describe('text consent routes', () => {
  let payload: Payload
  let savedAuthToken: string | undefined
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const createdCustomerIDs: number[] = []

  const findCustomer = async (id: number) =>
    payload.findByID({ collection: 'customers', depth: 0, id, overrideAccess: true })

  const findCustomerByPhone = async (phone: string) => {
    const result = await payload.find({
      collection: 'customers',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { phone: { equals: phone } },
    })

    return result.docs[0]
  }

  const createCustomer = async (phone: string) => {
    const customer = await payload.create({
      collection: 'customers',
      context: { [ALLOW_CUSTOMER_PHONE_IDENTITY_WRITE]: true },
      data: { password: `pw-${stamp}`, phone, username: phone },
      draft: false,
      overrideAccess: true,
    })

    createdCustomerIDs.push(customer.id)
    return customer
  }

  const inbound = async (params: Record<string, string>, signatureOverride?: string) => {
    const { POST } = await import('@/app/api/twilio/inbound/route')
    const url = `${getServerSideURL()}/api/twilio/inbound`
    const signature =
      signatureOverride ?? buildTwilioMessagingSignature({ authToken: 'test-token', params, url })

    const response = await POST(
      new Request(url, {
        body: new URLSearchParams(params).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': signature,
        },
        method: 'POST',
      }),
    )

    return { body: await response.text(), status: response.status }
  }

  const signup = async (body: Record<string, unknown>) => {
    const { POST } = await import('@/app/api/customer-auth/signup/route')
    const response = await POST(
      new Request('http://localhost/api/customer-auth/signup', {
        body: JSON.stringify({ password: 'pw-123', passwordConfirm: 'pw-123', ...body }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    )

    return { json: (await response.json()) as { doc?: { id: number } }, status: response.status }
  }

  const accountToggle = async (ok: boolean) => {
    const { POST } = await import('@/app/api/customer-auth/message-consent/route')
    const response = await POST(
      new Request('http://localhost/api/customer-auth/message-consent', {
        body: JSON.stringify({ channel: 'sms', ok }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    )

    return response.status
  }

  beforeAll(async () => {
    savedAuthToken = process.env.TWILIO_AUTH_TOKEN
    process.env.TWILIO_AUTH_TOKEN = 'test-token'
    payload = await getPayload({ config: await config })
  })

  beforeEach(() => {
    mocks.welcomeSmsTo.length = 0
    mocks.authenticatedCustomerID = null
  })

  afterAll(async () => {
    if (savedAuthToken === undefined) {
      delete process.env.TWILIO_AUTH_TOKEN
    } else {
      process.env.TWILIO_AUTH_TOKEN = savedAuthToken
    }

    if (!payload) {
      return
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

  it('turns texts on only when the signup box is ticked, and confirms by text', async () => {
    const ticked = randomPhone()
    const unticked = randomPhone()

    const first = await signup({ phone: ticked, smsOptIn: true, verificationCode: '123456' })
    expect(first.status).toBe(200)
    createdCustomerIDs.push(first.json.doc!.id)

    const second = await signup({ phone: unticked, verificationCode: '123456' })
    expect(second.status).toBe(200)
    createdCustomerIDs.push(second.json.doc!.id)

    const tickedCustomer = await findCustomer(first.json.doc!.id)
    expect(tickedCustomer.smsOk).toBe(true)
    expect(tickedCustomer.smsOkSource).toBe('signup_sms')

    const untickedCustomer = await findCustomer(second.json.doc!.id)
    expect(untickedCustomer.smsOk).toBe(false)

    expect(mocks.welcomeSmsTo).toEqual([ticked])
  })

  it('ignores the text box on an email-only signup', async () => {
    const email = `sms-compliance-${stamp}@example.test`
    const result = await signup({ email, smsOptIn: true, verificationCode: '123456' })
    expect(result.status).toBe(200)
    createdCustomerIDs.push(result.json.doc!.id)

    const customer = await findCustomer(result.json.doc!.id)
    expect(customer.smsOk).toBe(false)
    expect(customer.emailOk).toBe(true)
    expect(mocks.welcomeSmsTo).toEqual([])
  })

  it('sends one confirmation text when texts go from off to on in account settings', async () => {
    const phone = randomPhone()
    const customer = await createCustomer(phone)
    mocks.authenticatedCustomerID = customer.id

    expect(await accountToggle(true)).toBe(200)
    expect(await accountToggle(true)).toBe(200)
    expect(await accountToggle(false)).toBe(200)

    expect(mocks.welcomeSmsTo).toEqual([phone])
    expect((await findCustomer(customer.id)).smsOk).toBe(false)
  })

  it('stays quiet on keywords Twilio already answered, and answers the rest', async () => {
    const phone = randomPhone()
    const customer = await createCustomer(phone)
    const emptyReply = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

    const yes = await inbound({ Body: 'YES', From: phone })
    expect(yes.body).toBe(emptyReply)
    expect(await findCustomer(customer.id)).toMatchObject({
      smsOk: true,
      smsOkSource: 'inbound_yes',
    })

    const no = await inbound({ Body: 'n', From: phone })
    expect(no.body).toContain('Baked with Blessings: You will not get bakery texts.')
    expect((await findCustomer(customer.id)).smsOk).toBe(false)

    const y = await inbound({ Body: ' y ', From: phone })
    expect(y.body).toContain("You're signed up for flavor-drop and market-date texts.")
    expect(y.body).toContain('Msg &amp; data rates may apply.')
    expect((await findCustomer(customer.id)).smsOk).toBe(true)

    const cancel = await inbound({ Body: 'Cancel', From: phone })
    expect(cancel.body).toBe(emptyReply)
    expect(await findCustomer(customer.id)).toMatchObject({
      smsOk: false,
      smsOkSource: 'inbound_stop',
    })

    const custom = await inbound({ Body: 'COOKIES', From: phone, OptOutType: 'START' })
    expect(custom.body).toBe(emptyReply)
    expect(await findCustomer(customer.id)).toMatchObject({
      smsOk: true,
      smsOkSource: 'inbound_start',
    })

    const help = await inbound({ Body: 'HELP', From: phone })
    expect(help.body).toBe(emptyReply)

    const chatter = await inbound({ Body: 'thank you!', From: phone })
    expect(chatter.body).toContain('Reply Y for flavor-drop and market-date texts')
    expect((await findCustomer(customer.id)).smsOk).toBe(true)
  })

  it('stays quiet for strangers texting STOP, and rejects unsigned requests', async () => {
    const stranger = randomPhone()

    const stop = await inbound({ Body: 'STOP', From: stranger })
    expect(stop.status).toBe(200)
    expect(stop.body).not.toContain('<Message>')

    const hello = await inbound({ Body: 'hello', From: stranger })
    expect(hello.body).toContain('create-account')

    const forged = await inbound({ Body: 'Y', From: stranger }, 'not-a-signature')
    expect(forged.status).toBe(401)
    expect(await findCustomerByPhone(stranger)).toBeUndefined()
  })
})
