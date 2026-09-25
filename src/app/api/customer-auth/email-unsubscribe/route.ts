import { getPayload } from 'payload'

import config from '@payload-config'

import { readEmailUnsubscribeToken } from '@/utilities/email/emailUnsubscribeToken'
import { getServerSideURL } from '@/utilities/getURL'
import { setCustomerMessageConsent } from '@/utilities/setCustomerMessageConsent'

const unsubscribeRedirect = (query = '') =>
  Response.redirect(`${getServerSideURL()}/email-unsubscribed${query}`, 302)

const unsubscribeFromToken = async (token: string): Promise<boolean> => {
  const customerID = readEmailUnsubscribeToken(token)

  if (!customerID) {
    return false
  }

  const payload = await getPayload({ config })

  try {
    await payload.findByID({
      collection: 'customers',
      id: customerID,
      overrideAccess: true,
    })
  } catch {
    return false
  }

  await setCustomerMessageConsent({
    channel: 'email',
    customerID,
    ok: false,
    payload,
    source: 'unsubscribe_link',
  })

  return true
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || ''

  return (await unsubscribeFromToken(token))
    ? unsubscribeRedirect()
    : unsubscribeRedirect('?invalid=1')
}

// One-click unsubscribe (RFC 8058): Gmail and Apple Mail POST to the
// List-Unsubscribe URL on bakery update emails and expect a plain 200.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || ''

  return (await unsubscribeFromToken(token))
    ? new Response('Unsubscribed from bakery emails.', { status: 200 })
    : new Response('That unsubscribe link is not valid.', { status: 400 })
}
