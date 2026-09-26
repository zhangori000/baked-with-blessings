import type { Payload } from 'payload'

import { BRING_BACK_ADMIN_HREF } from '@/features/flavor-nudges/constants'
import { getOwnerFlavorNudgeNotificationRecipients } from '@/utilities/email/contactChannels'
import { decorateEmailEnvelope } from '@/utilities/email/decorateEmailEnvelope'
import { getServerSideURL } from '@/utilities/getURL'

const escapeHTML = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const askedLine = (count: number) =>
  count === 1 ? 'the first request' : `${count} people have asked`

export const sendOwnerFlavorNudgeNotification = async ({
  email,
  flavors,
  payload,
}: {
  email: string | null
  flavors: { count: number; title: string }[]
  payload: Payload
}): Promise<boolean> => {
  const to = getOwnerFlavorNudgeNotificationRecipients()
  if (!to.length || flavors.length === 0) return false

  const adminURL = `${getServerSideURL()}${BRING_BACK_ADMIN_HREF}`
  const [first, ...rest] = flavors
  const subject = `Bring back request: ${first.title}${rest.length ? ` + ${rest.length} more` : ''}`
  const contactLine = email
    ? `They want an email when it is back: ${email}`
    : 'They did not leave an email.'

  const text = [
    'Someone wants an old flavor back.',
    '',
    ...flavors.map((flavor) => `- ${flavor.title} (${askedLine(flavor.count)})`),
    '',
    contactLine,
    '',
    `See every request, most wanted first: ${adminURL}`,
  ].join('\n')

  const html = `
    <h1>Someone wants an old flavor back</h1>
    <ul>${flavors
      .map(
        (flavor) =>
          `<li><strong>${escapeHTML(flavor.title)}</strong> (${escapeHTML(askedLine(flavor.count))})</li>`,
      )
      .join('')}</ul>
    <p>${escapeHTML(contactLine)}</p>
    <p><a href="${escapeHTML(adminURL)}">See every request, most wanted first</a></p>
  `

  await payload.sendEmail(decorateEmailEnvelope({ html, subject, text, to }))
  return true
}
