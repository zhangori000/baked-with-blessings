const baseURL = 'https://verify.twilio.com/v2'

const getTwilioConfig = () => {
  const accountSID = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const serviceSID = process.env.TWILIO_VERIFY_SERVICE_SID?.trim()

  if (!accountSID || !authToken || !serviceSID) {
    throw new Error(
      'Twilio Verify is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID to your .env.',
    )
  }

  return { accountSID, authToken, serviceSID }
}

const twilioRequest = async (path: string, body: URLSearchParams) => {
  const { accountSID, authToken } = getTwilioConfig()
  const authHeader = Buffer.from(`${accountSID}:${authToken}`).toString('base64')

  const response = await fetch(`${baseURL}${path}`, {
    body,
    cache: 'no-store',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  })

  const payload = (await response.json()) as {
    message?: string
    sid?: string
    status?: string
    valid?: boolean
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Twilio verification request failed.')
  }

  return payload
}

export const startPhoneVerification = async (phoneNumber: string) => {
  const { serviceSID } = getTwilioConfig()
  const body = new URLSearchParams({
    Channel: 'sms',
    To: phoneNumber,
  })

  return twilioRequest(`/Services/${serviceSID}/Verifications`, body)
}

export const checkPhoneVerification = async (args: { code: string; phoneNumber: string }) => {
  const { serviceSID } = getTwilioConfig()
  const body = new URLSearchParams({
    Code: args.code.trim(),
    To: args.phoneNumber,
  })

  const payload = await twilioRequest(`/Services/${serviceSID}/VerificationCheck`, body)

  return payload.status === 'approved' || payload.valid === true
}
