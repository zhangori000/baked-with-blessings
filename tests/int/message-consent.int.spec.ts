import { describe, expect, it } from 'vitest'

import {
  createEmailUnsubscribeToken,
  readEmailUnsubscribeToken,
} from '@/utilities/email/emailUnsubscribeToken'
import {
  inboundSmsReply,
  parseInboundSmsBody,
  smsConsentFromIntent,
} from '@/utilities/messageConsent'
import { buildCustomerWelcomeSms } from '@/utilities/sms/sendCustomerWelcomeSms'
import {
  buildTwilioMessagingSignature,
  isTwilioMessagingSignatureValid,
} from '@/utilities/sms/twilioMessages'

describe('parseInboundSmsBody', () => {
  it('treats y, yes, and padded mixed-case yes as yes', () => {
    expect(parseInboundSmsBody('Y')).toBe('yes')
    expect(parseInboundSmsBody('yes')).toBe('yes')
    expect(parseInboundSmsBody('  YeS  ')).toBe('yes')
  })

  it('treats n and no as no', () => {
    expect(parseInboundSmsBody('N')).toBe('no')
    expect(parseInboundSmsBody('no')).toBe('no')
  })

  it('treats STOP and START as their own answers', () => {
    expect(parseInboundSmsBody('stop')).toBe('stop')
    expect(parseInboundSmsBody('START')).toBe('start')
  })

  it('does not guess other words', () => {
    expect(parseInboundSmsBody('maybe')).toBe('unknown')
    expect(parseInboundSmsBody('')).toBe('unknown')
  })
})

describe('buildCustomerWelcomeSms', () => {
  it('confirms the opt-in with the carrier disclosures and the account page', () => {
    const body = buildCustomerWelcomeSms({
      accountURL: 'https://example.test/account',
      companyName: 'Baked with Blessings',
    })

    expect(body.startsWith('Baked with Blessings: ')).toBe(true)
    expect(body).toContain('Msg frequency varies.')
    expect(body).toContain('Msg & data rates may apply.')
    expect(body).toContain('Reply HELP for help, STOP to cancel.')
    expect(body).not.toContain('Reply Y')
    expect(body).toContain('https://example.test/account')
    expect(body).not.toContain('—')
  })
})

describe('smsConsentFromIntent', () => {
  it('turns yes and START on, and no and STOP off', () => {
    expect(smsConsentFromIntent('yes')).toEqual({ ok: true, source: 'inbound_yes' })
    expect(smsConsentFromIntent('start')).toEqual({ ok: true, source: 'inbound_start' })
    expect(smsConsentFromIntent('no')).toEqual({ ok: false, source: 'inbound_no' })
    expect(smsConsentFromIntent('stop')).toEqual({ ok: false, source: 'inbound_stop' })
    expect(smsConsentFromIntent('unknown')).toBeNull()
  })
})

describe('inboundSmsReply', () => {
  it('asks unknown numbers to create an account', () => {
    expect(inboundSmsReply({ foundCustomer: false, intent: 'yes' })).toContain('create-account')
  })

  it('confirms yes and no for known numbers', () => {
    expect(inboundSmsReply({ foundCustomer: true, intent: 'yes' })).toContain("You're signed up")
    expect(inboundSmsReply({ foundCustomer: true, intent: 'no' })).toContain('will not get bakery texts')
  })
})

describe('email unsubscribe token', () => {
  it('round-trips a customer id and rejects a tampered token', () => {
    const token = createEmailUnsubscribeToken(42)
    expect(readEmailUnsubscribeToken(token)).toBe('42')
    expect(readEmailUnsubscribeToken(`${token}x`)).toBeNull()
  })
})

describe('Twilio Messaging signature', () => {
  it('accepts a signature minted with the same token, url, and params', () => {
    const authToken = 'test-token'
    const url = 'https://example.test/api/twilio/inbound'
    const params = { Body: 'Y', From: '+16125550101' }
    const signature = buildTwilioMessagingSignature({ authToken, params, url })

    expect(isTwilioMessagingSignatureValid({ authToken, params, signature, url })).toBe(true)
    expect(
      isTwilioMessagingSignatureValid({
        authToken: 'other',
        params,
        signature,
        url,
      }),
    ).toBe(false)
  })
})

