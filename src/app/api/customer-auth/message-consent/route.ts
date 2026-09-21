import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'

import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import type { MessageConsentChannel } from '@/utilities/messageConsent'
import { setCustomerMessageConsent } from '@/utilities/setCustomerMessageConsent'

const jsonError = (message: string, status = 400) =>
  Response.json(
    {
      error: message,
    },
    { status },
  )

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const user = await getAuthenticatedCustomer(payload, headers)

  if (!user?.id) {
    return jsonError('Please log in to change bakery updates.', 401)
  }

  const body = (await request.json()) as {
    channel?: string
    ok?: boolean
  }

  const channel = body.channel
  if (channel !== 'email' && channel !== 'sms') {
    return jsonError('Choose texts or email.')
  }

  if (typeof body.ok !== 'boolean') {
    return jsonError('Choose on or off.')
  }

  try {
    const customer = await setCustomerMessageConsent({
      channel: channel as MessageConsentChannel,
      customerID: user.id,
      ok: body.ok,
      payload,
      source: 'account',
    })

    return Response.json({
      doc: customer,
      success: true,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'There was a problem saving bakery updates.'
    return jsonError(message, 400)
  }
}
