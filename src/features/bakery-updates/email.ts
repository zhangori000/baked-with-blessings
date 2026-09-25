import {
  bakeryLightColorTokens,
  bakeryPrimitiveTokens,
  bakerySceneThemes,
} from '@/design-system/bakery/tokens'

import {
  bakeryUpdateEmailFooter,
  type BakeryUpdateMarket,
  escapeHTML,
  formatMarketDate,
  marketDirectionsURL,
  marketWhenLine,
  marketWhereLine,
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

export type BakeryUpdateEmailFlavor = {
  imageURL: null | string
  kind: 'flavor'
  name: string
  priceLabel: null | string
}

export type BakeryUpdateEmailMarket = BakeryUpdateMarket & { kind: 'market' }

/** The block a template adds above the owner's message. A plain note has none. */
export type BakeryUpdateEmailFeature = BakeryUpdateEmailFlavor | BakeryUpdateEmailMarket

export type BakeryUpdateEmailInput = {
  accountURL: string
  companyName: string
  feature?: BakeryUpdateEmailFeature | null
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

const eyebrowStyle = `margin:20px 0 0;font-family:${theme.bodyFont};font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${theme.eyebrow};`

const buttonHTML = (href: string, label: string) =>
  [
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px;">',
    `<tr><td style="border-radius:999px;background-color:${theme.button};">`,
    `<a href="${escapeHTML(href)}" style="display:inline-block;padding:14px 28px;border-radius:999px;font-family:${theme.bodyFont};font-size:16px;font-weight:700;line-height:1;color:${theme.buttonText};text-decoration:none;white-space:nowrap;">${escapeHTML(label)}</a>`,
    '</td></tr></table>',
  ].join('')

const outlineButtonHTML = (href: string, label: string) =>
  `<a href="${escapeHTML(href)}" style="display:inline-block;margin-top:14px;padding:10px 20px;border:2px solid ${theme.button};border-radius:999px;font-family:${theme.bodyFont};font-size:14px;font-weight:700;line-height:1;color:${theme.button};text-decoration:none;white-space:nowrap;">${escapeHTML(label)}</a>`

const flavorHTML = (flavor: BakeryUpdateEmailFlavor) =>
  [
    flavor.imageURL
      ? `<img src="${escapeHTML(flavor.imageURL)}" width="496" alt="${escapeHTML(flavor.name)}" style="display:block;width:100%;max-width:496px;height:auto;margin:8px 0 0;border:0;border-radius:18px;">`
      : '',
    `<p style="${eyebrowStyle}">New flavor</p>`,
    `<h1 style="${headingStyle}${flavor.priceLabel ? 'margin-bottom:4px;' : ''}">${escapeHTML(flavor.name)}</h1>`,
    flavor.priceLabel
      ? `<p style="margin:0 0 16px;font-family:${theme.bodyFont};font-size:15px;font-weight:700;color:${theme.muted};">${escapeHTML(flavor.priceLabel)}</p>`
      : '',
  ].join('')

const marketCardHTML = (market: BakeryUpdateEmailMarket) => {
  const date = formatMarketDate(market.date)
  const directionsURL = marketDirectionsURL(market)
  const detailStyle = `margin:4px 0 0;font-family:${theme.bodyFont};font-size:15px;line-height:1.5;color:${theme.text};`

  const calendar = date
    ? [
        '<td width="76" valign="top" style="width:76px;padding:0 16px 0 0;">',
        `<table role="presentation" width="76" cellpadding="0" cellspacing="0" border="0" style="width:76px;border-radius:14px;overflow:hidden;border:2px solid ${theme.button};">`,
        `<tr><td align="center" style="padding:6px 0;background-color:${theme.button};font-family:${theme.bodyFont};font-size:12px;font-weight:700;letter-spacing:0.12em;color:${theme.buttonText};">${escapeHTML(date.month)}</td></tr>`,
        `<tr><td align="center" style="padding:6px 0 8px;background-color:${theme.tile};font-family:${theme.headingFont};font-size:32px;font-weight:700;line-height:1;color:${theme.heading};">${escapeHTML(date.day)}</td></tr>`,
        '</table>',
        '</td>',
      ].join('')
    : ''

  return [
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:${theme.tile};border-radius:18px;">`,
    '<tr><td style="padding:20px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>',
    calendar,
    '<td valign="top">',
    date
      ? `<p style="margin:0;font-family:${theme.headingFont};font-size:19px;font-weight:700;line-height:1.3;color:${theme.heading};">${escapeHTML(date.long)}</p>`
      : '',
    market.hours.trim() ? `<p style="${detailStyle}">${escapeHTML(market.hours.trim())}</p>` : '',
    `<p style="${detailStyle}font-weight:700;">${escapeHTML(market.place.trim())}</p>`,
    market.address.trim()
      ? `<p style="${detailStyle}color:${theme.muted};">${escapeHTML(market.address.trim())}</p>`
      : '',
    '</td>',
    '</tr>',
    // Its own row, so the button never squeezes next to the date block on a narrow phone.
    directionsURL
      ? `<tr><td${date ? ' colspan="2"' : ''}>${outlineButtonHTML(directionsURL, 'Get directions')}</td></tr>`
      : '',
    '</table>',
    '</td></tr></table>',
  ].join('')
}

const featureTextLines = (feature: BakeryUpdateEmailFeature | null | undefined): string[] => {
  if (feature?.kind === 'flavor') {
    return [
      `New flavor: ${feature.name}${feature.priceLabel ? ` (${feature.priceLabel})` : ''}`,
      '',
    ]
  }

  if (feature?.kind === 'market') {
    const when = marketWhenLine(feature)
    const directionsURL = marketDirectionsURL(feature)

    return [
      ...(when ? [`When: ${when}`] : []),
      `Where: ${marketWhereLine(feature)}`,
      ...(directionsURL ? [`Directions: ${directionsURL}`] : []),
      '',
    ]
  }

  return []
}

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
  feature,
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
    ...featureTextLines(feature),
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
    feature?.kind === 'flavor'
      ? flavorHTML(feature)
      : [
          feature?.kind === 'market' ? `<p style="${eyebrowStyle}">Market date</p>` : '',
          `<h1 style="${headingStyle}">${escapeHTML(trimmedSubject)}</h1>`,
          feature?.kind === 'market' ? marketCardHTML(feature) : '',
        ].join(''),
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
