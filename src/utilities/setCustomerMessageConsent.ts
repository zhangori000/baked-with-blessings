import { APIError } from 'payload'
import type { Payload, PayloadRequest } from 'payload'

import type { MessageConsentChannel, MessageConsentSource } from '@/utilities/messageConsent'

type SetCustomerMessageConsentArgs = {
  channel: MessageConsentChannel
  customerID: number | string
  ok: boolean
  payload: Payload
  rawBody?: null | string
  req?: PayloadRequest
  source: MessageConsentSource
}

export async function setCustomerMessageConsent({
  channel,
  customerID,
  ok,
  payload,
  rawBody,
  req,
  source,
}: SetCustomerMessageConsentArgs) {
  const customer = await payload.findByID({
    collection: 'customers',
    id: customerID,
    overrideAccess: true,
    req,
  })

  if (channel === 'sms' && ok && !customer.phone) {
    throw new APIError('A phone number is required before bakery texts can be turned on.', 400)
  }

  if (channel === 'email' && ok && !customer.email) {
    throw new APIError('An email address is required before bakery emails can be turned on.', 400)
  }

  const now = new Date().toISOString()
  const data =
    channel === 'sms'
      ? { smsOk: ok, smsOkAt: now, smsOkSource: source }
      : { emailOk: ok, emailOkAt: now, emailOkSource: source }

  const updated = await payload.update({
    collection: 'customers',
    data,
    id: customerID,
    overrideAccess: true,
    req,
  })

  await payload.create({
    collection: 'message-consent-events',
    data: {
      channel,
      customer: customerID,
      ok,
      rawBody: rawBody || undefined,
      source,
    },
    overrideAccess: true,
    req,
  })

  return updated
}
