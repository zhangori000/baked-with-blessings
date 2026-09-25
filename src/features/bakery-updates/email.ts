import {
  bakeryLightColorTokens,
  bakeryPrimitiveTokens,
  bakerySceneThemes,
} from '@/design-system/bakery/tokens'

import {
  bakeryUpdateEmailFooter,
  escapeHTML,
  splitMessageParagraphs,
  toParagraphHTML,
} from './content'

/** A public file production already serves, so every inbox can load it. */
export const BAKERY_EMAIL_LOGO_PATH = '/baked-with-blessings-social.png'

const classic = bakerySceneThemes.classic.color

/**
 * Email apps ignore CSS variables and most web fonts, so the email copies the
 * site's color tokens as plain values and uses fonts every inbox already has.
 */
export const bakeryEmailTheme = {
  bodyFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  button: classic.heroTitle,
  buttonText: bakeryPrimitiveTokens.color.cream50,
  eyebrow: classic.meadowShadow,
  heading: classic.heroTitle,
  headingFont: "Georgia, 'Times New Roman', serif",
  muted: bakeryPrimitiveTokens.color.cocoa700,
  page: bakeryPrimitiveTokens.color.cream200,
  // The logo PNG has this background baked in. Matching it hides the image edge.
  paper: '#fff8ef',
  rule: bakeryPrimitiveTokens.color.cream200,
  text: classic.text,
  tile: bakeryLightColorTokens.actionFg,
} as const

export type BakeryUpdateEmailInput = {
  accountURL: string
  companyName: string
  logoURL: string
  mailingAddress: string
  message: string
  siteURL: string
  subject: string
  unsubscribeURL: string
}

const theme = bakeryEmailTheme

const paragraphStyle = `margin:0 0 16px;font-family:${theme.bodyFont};font-size:16px;line-height:1.6;color:${theme.text};`
const linkStyle = `color:${theme.heading};text-decoration:underline;`
const footerLinkStyle = `color:${theme.muted};text-decoration:underline;`
const headingStyle = `margin:8px 0 16px;font-family:${theme.headingFont};font-size:28px;font-weight:700;line-height:1.25;color:${theme.heading};`

const buttonHTML = (href: string, label: string) =>
  [
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px;">',
    `<tr><td style="border-radius:999px;background-color:${theme.button};">`,
    `<a href="${escapeHTML(href)}" style="display:inline-block;padding:14px 28px;border-radius:999px;font-family:${theme.bodyFont};font-size:16px;font-weight:700;line-height:1;color:${theme.buttonText};text-decoration:none;">${escapeHTML(label)}</a>`,
    '</td></tr></table>',
  ].join('')

// Inbox apps show this line next to the subject. It stays hidden in the email.
const preheaderHTML = (paragraphs: string[]) => {
  const preview = (paragraphs[0] ?? '').replace(/\s+/g, ' ').slice(0, 110)

  return preview
    ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHTML(preview)}</div>`
    : ''
}

export const bakeryUpdateSignOff = (companyName: string) => ({
  closing: 'With love,',
  from: `the ${companyName} family`,
})

export const buildBakeryUpdateEmail = ({
  accountURL,
  companyName,
  logoURL,
  mailingAddress,
  message,
  siteURL,
  subject,
  unsubscribeURL,
}: BakeryUpdateEmailInput) => {
  const paragraphs = splitMessageParagraphs(message)
  const footer = bakeryUpdateEmailFooter(companyName, mailingAddress)
  const signOff = bakeryUpdateSignOff(companyName)
  const trimmedSubject = subject.trim()

  const text = [
    paragraphs.join('\n\n'),
    '',
    `Visit our site: ${siteURL}`,
    '',
    signOff.closing,
    signOff.from,
    '',
    '--',
    footer.reason,
    `Unsubscribe: ${unsubscribeURL}`,
    `Manage texts and emails: ${accountURL}`,
    footer.receipts,
    ...(footer.address ? [footer.address] : []),
  ].join('\n')

  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="x-apple-disable-message-reformatting">',
    '<meta name="color-scheme" content="light">',
    '<meta name="supported-color-schemes" content="light">',
    `<title>${escapeHTML(trimmedSubject)}</title>`,
    '</head>',
    `<body style="margin:0;padding:0;background-color:${theme.page};">`,
    preheaderHTML(paragraphs),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${theme.page};">`,
    '<tr><td align="center" style="padding:32px 12px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">',
    `<tr><td style="background-color:${theme.paper};border-radius:24px;padding:8px 32px 36px;">`,
    `<a href="${escapeHTML(siteURL)}" style="display:block;text-align:center;"><img src="${escapeHTML(logoURL)}" width="300" alt="${escapeHTML(companyName)}" style="display:inline-block;width:300px;max-width:100%;height:auto;border:0;"></a>`,
    `<h1 style="${headingStyle}">${escapeHTML(trimmedSubject)}</h1>`,
    ...paragraphs.map(
      (paragraph) => `<p style="${paragraphStyle}">${toParagraphHTML(paragraph, linkStyle)}</p>`,
    ),
    buttonHTML(siteURL, 'Visit our site'),
    `<p style="margin:0;font-family:${theme.headingFont};font-size:17px;font-style:italic;line-height:1.5;color:${theme.heading};">${escapeHTML(signOff.closing)}<br>${escapeHTML(signOff.from)}</p>`,
    '</td></tr>',
    `<tr><td style="padding:24px 16px 0;text-align:center;font-family:${theme.bodyFont};font-size:12px;line-height:1.6;color:${theme.muted};">`,
    `<p style="margin:0 0 8px;">${escapeHTML(footer.reason)} <a href="${escapeHTML(unsubscribeURL)}" style="${footerLinkStyle}">Unsubscribe</a> or <a href="${escapeHTML(accountURL)}" style="${footerLinkStyle}">manage texts and emails</a>.</p>`,
    `<p style="margin:0 0 8px;">${escapeHTML(footer.receipts)}</p>`,
    footer.address ? `<p style="margin:0;">${escapeHTML(footer.address)}</p>` : '',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body>',
    '</html>',
  ]
    .filter(Boolean)
    .join('\n')

  return { html, subject: trimmedSubject, text }
}
