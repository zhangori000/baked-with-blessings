export type BakeryUpdateChannel = 'email' | 'sms'

export const BAKERY_UPDATE_SUBJECT_MAX = 120
export const BAKERY_UPDATE_MESSAGE_MAX = 1000

export type BakeryUpdateDraft = {
  message: string
  sendEmail: boolean
  sendText: boolean
  subject: string
}

/**
 * Same rules on the client (to disable Send) and the server (to refuse the
 * request). Returns the first problem in owner-facing words, or null.
 */
export const validateBakeryUpdateDraft = (
  draft: BakeryUpdateDraft,
  { textsReady }: { textsReady: boolean },
): null | string => {
  const message = draft.message.trim()
  const subject = draft.subject.trim()

  if (!draft.sendText && !draft.sendEmail) {
    return 'Choose texts, emails, or both.'
  }

  if (draft.sendText && !textsReady) {
    return 'Texts are not set up yet. Send this as an email for now.'
  }

  if (!message) {
    return 'Write a message first.'
  }

  if (message.length > BAKERY_UPDATE_MESSAGE_MAX) {
    return `Keep the message under ${BAKERY_UPDATE_MESSAGE_MAX} characters.`
  }

  if (draft.sendEmail && !subject) {
    return 'Add an email subject.'
  }

  if (subject.length > BAKERY_UPDATE_SUBJECT_MAX) {
    return `Keep the subject under ${BAKERY_UPDATE_SUBJECT_MAX} characters.`
  }

  return null
}

// Phones auto-insert curly quotes and long dashes. One of those forces the
// whole text into Unicode, which fits 70 characters per part instead of 160.
const smsReplacements: Array<[RegExp, string]> = [
  [/[\u2018\u2019\u201A\u2032]/g, "'"],
  [/[\u201C\u201D\u201E\u2033]/g, '"'],
  [/[\u2013\u2014\u2212]/g, '-'],
  [/\u2026/g, '...'],
  [/[\u00A0\u2009\u202F]/g, ' '],
]

export const toSmsFriendlyText = (text: string): string =>
  smsReplacements.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  )

export const buildBakeryUpdateSms = ({
  companyName,
  message,
}: {
  companyName: string
  message: string
}): string => `${companyName}: ${toSmsFriendlyText(message.trim())}\n\nReply STOP to opt out.`

const gsmBasic = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà',
)
const gsmExtended = new Set('^{}\\[~]|€\f')

export type SmsSize = {
  characters: number
  encoding: 'gsm' | 'unicode'
  parts: number
}

/**
 * How many billable parts a text becomes. Plain text fits 160 characters in
 * one part and 153 per part after that. Emoji and other symbols switch the
 * whole text to Unicode: 70 in one part, 67 per part after that.
 */
export const measureSms = (text: string): SmsSize => {
  let gsmLength = 0

  for (const character of text) {
    if (gsmBasic.has(character)) {
      gsmLength += 1
    } else if (gsmExtended.has(character)) {
      gsmLength += 2
    } else {
      const unicodeLength = text.length
      return {
        characters: unicodeLength,
        encoding: 'unicode',
        parts: unicodeLength <= 70 ? 1 : Math.ceil(unicodeLength / 67),
      }
    }
  }

  return {
    characters: gsmLength,
    encoding: 'gsm',
    parts: gsmLength <= 160 ? 1 : Math.ceil(gsmLength / 153),
  }
}

const escapeHTML = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const urlPattern = /https?:\/\/[^\s<>"']+/g

// Escapes the owner's words and turns bare http(s) links into anchors. Links
// are found on the raw text so a trailing period or quote stays outside them.
const toParagraphHTML = (raw: string) => {
  let html = ''
  let cursor = 0

  for (const match of raw.matchAll(urlPattern)) {
    const url = match[0].replace(/[.,:;!?)]+$/, '')
    const start = match.index ?? 0

    html += escapeHTML(raw.slice(cursor, start))
    html += `<a href="${escapeHTML(url)}">${escapeHTML(url)}</a>`
    cursor = start + url.length
  }

  html += escapeHTML(raw.slice(cursor))

  return html.replace(/\n/g, '<br/>')
}

export const splitMessageParagraphs = (message: string): string[] =>
  message
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

export const bakeryUpdateEmailFooter = (companyName: string) => ({
  reason: `You're getting this because you signed up for bakery emails from ${companyName}.`,
  receipts: 'Order receipts and login codes still arrive even if you unsubscribe.',
})

export const buildBakeryUpdateEmail = ({
  accountURL,
  companyName,
  message,
  subject,
  unsubscribeURL,
}: {
  accountURL: string
  companyName: string
  message: string
  subject: string
  unsubscribeURL: string
}) => {
  const paragraphs = splitMessageParagraphs(message)
  const footer = bakeryUpdateEmailFooter(companyName)

  const text = [
    paragraphs.join('\n\n'),
    '',
    '--',
    footer.reason,
    `Unsubscribe: ${unsubscribeURL}`,
    `Manage texts and emails: ${accountURL}`,
    footer.receipts,
  ].join('\n')

  const html = [
    ...paragraphs.map((paragraph) => `<p>${toParagraphHTML(paragraph)}</p>`),
    '<hr/>',
    `<p><small>${escapeHTML(footer.reason)} <a href="${escapeHTML(unsubscribeURL)}">Unsubscribe</a> or <a href="${escapeHTML(accountURL)}">manage texts and emails</a>. ${escapeHTML(footer.receipts)}</small></p>`,
  ].join('\n')

  return { html, subject: subject.trim(), text }
}
