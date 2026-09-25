import type { Payload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'
import { sendTwilioSms } from '@/utilities/sms/twilioMessages'

type BuildCustomerWelcomeSmsArgs = {
  accountURL: string
  companyName: string
}

export const buildCustomerWelcomeSms = ({
  accountURL = 'https://bakedwithblessings.com/account',
  companyName = 'Baked with Blessings',
}: BuildCustomerWelcomeSmsArgs) =>
  `Welcome to ${companyName}. Reply Y to get texts when we drop a flavor or post a market date. Reply N if not. Reply STOP anytime. Change this later at ${accountURL}`

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
