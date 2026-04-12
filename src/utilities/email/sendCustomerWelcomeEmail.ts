import type { Payload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'

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
  const greeting = name?.trim() ? `Hi ${name.trim()},` : 'Hi,'

  const html = `
    <h1>Welcome to ${companyName}</h1>
    <p>${greeting}</p>
    <p>Your account has been created successfully.</p>
    <p>This is a placeholder welcome email while we finish the full ordering and account-notification flow.</p>
    <p>You can review your account here: <a href="${accountURL}">${accountURL}</a></p>
    <p>Thanks for joining ${companyName}.</p>
  `

  const text = [
    `Welcome to ${companyName}`,
    '',
    greeting,
    'Your account has been created successfully.',
    'This is a placeholder welcome email while we finish the full ordering and account-notification flow.',
    `You can review your account here: ${accountURL}`,
    '',
    `Thanks for joining ${companyName}.`,
  ].join('\n')

  await payload.sendEmail({
    to: email,
    subject: `Welcome to ${companyName}`,
    html,
    text,
  })
}
