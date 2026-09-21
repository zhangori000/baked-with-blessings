export type InboundSmsIntent = 'no' | 'start' | 'stop' | 'unknown' | 'yes'

export type MessageConsentChannel = 'email' | 'sms'

export type MessageConsentSource =
  | 'account'
  | 'inbound_no'
  | 'inbound_start'
  | 'inbound_stop'
  | 'inbound_yes'
  | 'signup_email'
  | 'unsubscribe_link'

export const parseInboundSmsBody = (body = ''): InboundSmsIntent => {
  const normalized = body.trim().toLowerCase()

  if (normalized === 'y' || normalized === 'yes') {
    return 'yes'
  }

  if (normalized === 'n' || normalized === 'no') {
    return 'no'
  }

  if (normalized === 'stop') {
    return 'stop'
  }

  if (normalized === 'start') {
    return 'start'
  }

  return 'unknown'
}

export const smsConsentFromIntent = (
  intent: InboundSmsIntent,
): { ok: boolean; source: Extract<MessageConsentSource, 'inbound_no' | 'inbound_start' | 'inbound_stop' | 'inbound_yes'> } | null => {
  if (intent === 'yes') {
    return { ok: true, source: 'inbound_yes' }
  }

  if (intent === 'start') {
    return { ok: true, source: 'inbound_start' }
  }

  if (intent === 'no') {
    return { ok: false, source: 'inbound_no' }
  }

  if (intent === 'stop') {
    return { ok: false, source: 'inbound_stop' }
  }

  return null
}

export const inboundSmsReply = ({
  foundCustomer = false,
  intent = 'unknown',
}: {
  foundCustomer?: boolean
  intent?: InboundSmsIntent
} = {}): string => {
  if (!foundCustomer) {
    return 'This number is not on a bakery account yet. Create one at bakedwithblessings.com/create-account'
  }

  if (intent === 'yes' || intent === 'start') {
    return "You're signed up for bakery texts. Reply STOP anytime."
  }

  if (intent === 'no' || intent === 'stop') {
    return "You will not get bakery texts. Reply Y if you change your mind."
  }

  return 'Reply Y to get flavor and market texts, N to skip, or STOP to cancel.'
}
