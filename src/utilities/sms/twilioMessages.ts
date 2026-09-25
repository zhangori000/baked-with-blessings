import { createHmac, timingSafeEqual } from 'crypto'

const messagingBaseURL = 'https://api.twilio.com/2010-04-01'

type TwilioMessagingConfig = {
  accountSID: string
  authToken: string
  fromNumber: string
}

export const getTwilioMessagingConfig = (): TwilioMessagingConfig | null => {
  const accountSID = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim()

  if (!accountSID || !authToken || !fromNumber) {
    return null
  }

  return { accountSID, authToken, fromNumber }
}

export const sendTwilioSms = async ({
  body,
  to,
}: {
  body: string
  to: string
}): Promise<{ sent: boolean; sid?: string }> => {
  const config = getTwilioMessagingConfig()

  if (!config) {
    return { sent: false }
  }

  const authHeader = Buffer.from(`${config.accountSID}:${config.authToken}`).toString('base64')
  const params = new URLSearchParams({
    Body: body,
    From: config.fromNumber,
    To: to,
  })

  const response = await fetch(
    `${messagingBaseURL}/Accounts/${config.accountSID}/Messages.json`,
    {
      body: params,
      cache: 'no-store',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    },
  )

  const payload = (await response.json()) as { message?: string; sid?: string }

  if (!response.ok) {
    throw new Error(payload.message || 'Twilio Messaging request failed.')
  }

  return { sent: true, sid: payload.sid }
}

export const buildTwilioMessagingSignature = ({
  authToken,
  params,
  url,
}: {
  authToken: string
  params: Record<string, string>
  url: string
}) => {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url)

  return createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64')
}

export const isTwilioMessagingSignatureValid = ({
  authToken,
  params,
  signature,
  url,
}: {
  authToken: string
  params: Record<string, string>
  signature: string
  url: string
}) => {
  const expected = Buffer.from(buildTwilioMessagingSignature({ authToken, params, url }))
  const actual = Buffer.from(signature)

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}

export const buildTwilioMessagingTwiml = (message = '') => {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`
}
