export type InboundSmsIntent = 'help' | 'no' | 'start' | 'stop' | 'unknown' | 'yes'

export type MessageConsentChannel = 'email' | 'sms'

export type MessageConsentSource =
  | 'account'
  | 'inbound_no'
  | 'inbound_start'
  | 'inbound_stop'
  | 'inbound_yes'
  | 'signup_email'
  | 'signup_sms'
  | 'unsubscribe_link'

export const bakeryTextsDisclosure =
  'Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to cancel.'

// Twilio's built-in keywords. Twilio answers these itself and updates its own
// block list before forwarding them to us, so we record the change and send no
// second reply. https://help.twilio.com/articles/223134027
const twilioOptOutKeywords = new Set([
  'cancel',
  'end',
  'optout',
  'quit',
  'revoke',
  'stop',
  'stopall',
  'unsubscribe',
])
const twilioOptInKeywords = new Set(['start', 'unstop', 'yes'])
const twilioHelpKeywords = new Set(['help', 'info'])

const normalizeInboundSmsBody = (body = '') => body.trim().toLowerCase()

export const parseInboundSmsBody = (body = ''): InboundSmsIntent => {
  const normalized = normalizeInboundSmsBody(body)

  if (normalized === 'y' || normalized === 'yes') {
    return 'yes'
  }

  if (normalized === 'n' || normalized === 'no') {
    return 'no'
  }

  if (twilioOptOutKeywords.has(normalized)) {
    return 'stop'
  }

  if (twilioOptInKeywords.has(normalized)) {
    return 'start'
  }

  if (twilioHelpKeywords.has(normalized)) {
    return 'help'
  }

  return 'unknown'
}

export const isTwilioHandledKeyword = (body = '') => {
  const normalized = normalizeInboundSmsBody(body)

  return (
    twilioOptOutKeywords.has(normalized) ||
    twilioOptInKeywords.has(normalized) ||
    twilioHelpKeywords.has(normalized)
  )
}

// Advanced Opt-Out adds OptOutType to the webhook when a custom keyword matched.
export const intentFromTwilioOptOutType = (optOutType = ''): InboundSmsIntent | null => {
  switch (optOutType.trim().toUpperCase()) {
    case 'HELP':
      return 'help'
    case 'START':
      return 'start'
    case 'STOP':
      return 'stop'
    default:
      return null
  }
}

export const smsConsentFromIntent = (
  intent: InboundSmsIntent,
): {
  ok: boolean
  source: Extract<
    MessageConsentSource,
    'inbound_no' | 'inbound_start' | 'inbound_stop' | 'inbound_yes'
  >
} | null => {
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
    return 'Baked with Blessings: This number is not on a bakery account yet. Create one at bakedwithblessings.com/create-account'
  }

  if (intent === 'yes' || intent === 'start') {
    return `Baked with Blessings: You're signed up for flavor-drop and market-date texts. ${bakeryTextsDisclosure}`
  }

  if (intent === 'no' || intent === 'stop') {
    return 'Baked with Blessings: You will not get bakery texts. Reply Y if you change your mind.'
  }

  return 'Baked with Blessings: Reply Y for flavor-drop and market-date texts, N to skip, or STOP to cancel.'
}
