import { getPayload } from 'payload'

import config from '@payload-config'

import { readEmailUnsubscribeToken } from '@/utilities/email/emailUnsubscribeToken'
import { getServerSideURL } from '@/utilities/getURL'
import { setCustomerMessageConsent } from '@/utilities/setCustomerMessageConsent'

const unsubscribeRedirect = (query = '') =>
  Response.redirect(`${getServerSideURL()}/email-unsubscribed${query}`, 302)

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || ''
  const customerID = readEmailUnsubscribeToken(token)

  if (!customerID) {
    return unsubscribeRedirect('?invalid=1')
  }

  const payload = await getPayload({ config })

  try {
    await payload.findByID({
      collection: 'customers',
      id: customerID,
      overrideAccess: true,
    })
  } catch {
    return unsubscribeRedirect('?invalid=1')
  }

  await setCustomerMessageConsent({
    channel: 'email',
    customerID,
    ok: false,
    payload,
    source: 'unsubscribe_link',
  })

  return unsubscribeRedirect()
}
