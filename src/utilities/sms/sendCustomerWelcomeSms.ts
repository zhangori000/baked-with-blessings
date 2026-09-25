import type { Payload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'
import { bakeryTextsDisclosure } from '@/utilities/messageConsent'
import { sendTwilioSms } from '@/utilities/sms/twilioMessages'

type BuildCustomerWelcomeSmsArgs = {
  accountURL: string
  companyName: string
}

// Carriers want one confirmation text right after someone opts in. We never
// text a number to ask for consent, so this only goes out after a yes.
export const buildCustomerWelcomeSms = ({ accountURL, companyName }: BuildCustomerWelcomeSmsArgs) =>
  `${companyName}: You're signed up for texts when we drop a flavor or post a market date. ${bakeryTextsDisclosure} Manage texts at ${accountURL}`

type SendCustomerWelcomeSmsArgs = {
  payload: Payload
  phone: string
}

export async function sendCustomerWelcomeSms({ payload, phone }: SendCustomerWelcomeSmsArgs) {
  const companyName =
    process.env.COMPANY_NAME?.trim() || process.env.SITE_NAME?.trim() || 'Baked with Blessings'
  const accountURL = `${getServerSideURL()}/account`
  const body = buildCustomerWelcomeSms({ accountURL, companyName })

  try {
    return await sendTwilioSms({ body, to: phone })
  } catch (error) {
    payload.logger.error({ err: error, phone }, 'Customer welcome SMS failed')
    return { sent: false }
  }
}
