import type { Payload } from 'payload'

import { businessCity, businessState } from '@/utilities/businessInfo'
import { BAKERY_INBOX, getCustomerContactEmails } from '@/utilities/email/contactChannels'
import { decorateEmailEnvelope } from '@/utilities/email/decorateEmailEnvelope'
import { getServerSideURL } from '@/utilities/getURL'

const escapeHTML = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

type BuildCustomerWelcomeEmailArgs = {
  accountURL: string
  companyName: string
  name?: string
}

/**
 * Pure builder for the customer welcome email, so it can be unit-tested and
 * previewed without sending. Replaces the old "this is a placeholder welcome
 * email" copy that was going out to every real signup.
 */
export const buildCustomerWelcomeEmail = ({
  accountURL,
  companyName,
  name,
}: BuildCustomerWelcomeEmailArgs) => {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : 'Hi,'
  const subject = `Welcome to ${companyName}!`

  const intro = `Thanks so much for creating an account. We're a small, family-run home bakery in ${businessCity}, ${businessState}, baking small-batch cookies and treats to order for local pickup and friendly meetup hand-offs around the Twin Cities.`
  const how =
    "Here's how it works: browse the menu and place an order, we bake it fresh, and we reach out to arrange your pickup."
  const closing = `Questions? Just reply to this email, or reach us anytime at ${BAKERY_INBOX}. We can't wait to bake for you.`

  const text = [
    `Welcome to ${companyName}!`,
    '',
    greeting,
    '',
    intro,
    '',
    how,
    '',
    `Your account lives here: ${accountURL}`,
    '',
    closing,
    '',
    'Warmly,',
    companyName,
  ].join('\n')

  const html = `
    <h1>Welcome to ${escapeHTML(companyName)}!</h1>
    <p>${escapeHTML(greeting)}</p>
    <p>${escapeHTML(intro)}</p>
    <p>${escapeHTML(how)}</p>
    <p>Your account lives <a href="${escapeHTML(accountURL)}">here</a>.</p>
    <p>Questions? Just reply to this email, or reach us anytime at <a href="mailto:${escapeHTML(BAKERY_INBOX)}">${escapeHTML(BAKERY_INBOX)}</a>. We can't wait to bake for you.</p>
    <p>Warmly,<br/>${escapeHTML(companyName)}</p>
  `

  return { html, subject, text }
}

type SendCustomerWelcomeEmailArgs = {
  email: string
  name?: string
  payload: Payload
}

export async function sendCustomerWelcomeEmail({
  email,
  name,
  payload,
}: SendCustomerWelcomeEmailArgs) {
  const companyName =
    process.env.COMPANY_NAME?.trim() || process.env.SITE_NAME?.trim() || 'Baked with Blessings'
  const serverURL = getServerSideURL()
  const accountURL = `${serverURL}/account`
  const { html, subject, text } = buildCustomerWelcomeEmail({ accountURL, companyName, name })

  await payload.sendEmail(
    decorateEmailEnvelope({
      html,
      replyTo: getCustomerContactEmails(),
      subject,
      text,
      to: email,
    }),
  )
}
