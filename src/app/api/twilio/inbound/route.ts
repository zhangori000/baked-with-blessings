import { getPayload } from 'payload'

import config from '@payload-config'

import { inboundSmsReply, parseInboundSmsBody, smsConsentFromIntent } from '@/utilities/messageConsent'
import { normalizePhoneNumber } from '@/utilities/phone'
import { setCustomerMessageConsent } from '@/utilities/setCustomerMessageConsent'
import {
  buildTwilioMessagingTwiml,
  isTwilioMessagingSignatureValid,
} from '@/utilities/sms/twilioMessages'
import { getServerSideURL } from '@/utilities/getURL'

const twiml = (message: string, status = 200) =>
  new Response(buildTwilioMessagingTwiml(message), {
    headers: {
      'Content-Type': 'text/xml',
    },
    status,
  })

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const formData = await request.formData()
  const params: Record<string, string> = {}

  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      params[key] = value
    }
  })

  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const signature = request.headers.get('x-twilio-signature') || ''
  const url = `${getServerSideURL()}/api/twilio/inbound`

  if (
    !authToken ||
    !isTwilioMessagingSignatureValid({
      authToken,
      params,
      signature,
      url,
    })
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  const from = normalizePhoneNumber(params.From || '')
  const body = params.Body || ''
  const intent = parseInboundSmsBody(body)

  let foundCustomer = false

  if (from) {
    const customers = await payload.find({
      collection: 'customers',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        phone: {
          equals: from,
        },
      },
    })

    const customer = customers.docs[0]

    if (customer) {
      foundCustomer = true
      const change = smsConsentFromIntent(intent)

      if (change) {
        await setCustomerMessageConsent({
          channel: 'sms',
          customerID: customer.id,
          ok: change.ok,
          payload,
          rawBody: body,
          source: change.source,
        })
      }
    }
  }

  return twiml(inboundSmsReply({ foundCustomer, intent }))
}
