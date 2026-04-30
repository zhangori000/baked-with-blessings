import config from '@/payload.config'
import { getServerSideURL } from '@/utilities/getURL'
import { getPayload } from 'payload'

type ContactInput = Record<string, unknown>

class ContactSubmissionError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ContactSubmissionError'
    this.status = status
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const cleanText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

const cleanMultilineText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, maxLength)
}

const escapeHTML = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getOwnerContactEmail = () =>
  process.env.CONTACT_NOTIFICATION_TO?.trim() || process.env.ORDER_NOTIFICATION_TO?.trim() || ''

export const POST = async (request: Request) => {
  const payload = await getPayload({ config })

  try {
    const input = (await request.json()) as ContactInput
    const honeypot = cleanText(input.company, 160)

    if (honeypot) {
      return Response.json({ success: true })
    }

    const name = cleanText(input.name, 120)
    const email = cleanText(input.email, 180).toLowerCase()
    const phone = cleanText(input.phone, 80)
    const subject = cleanText(input.subject, 160)
    const message = cleanMultilineText(input.message, 3000)
    const ownerEmail = getOwnerContactEmail()

    if (!ownerEmail) {
      throw new ContactSubmissionError(
        'The contact email is not configured yet. Set CONTACT_NOTIFICATION_TO or ORDER_NOTIFICATION_TO.',
        503,
      )
    }

    if (!name) {
      throw new ContactSubmissionError('Enter your name.')
    }

    if (email && !emailPattern.test(email)) {
      throw new ContactSubmissionError('Enter a valid email address.')
    }

    if (!email && !phone) {
      throw new ContactSubmissionError('Enter an email address or phone number.')
    }

    if (!message) {
      throw new ContactSubmissionError('Write a message before sending.')
    }

    const companyName =
      process.env.COMPANY_NAME?.trim() || process.env.SITE_NAME?.trim() || 'Baked with Blessings'
    const safeSubject = subject || 'Website contact message'
    const submittedAt = new Date().toLocaleString('en-US')
    const sourceURL = getServerSideURL()
    const emailSubject = `New ${companyName} contact message - ${safeSubject}`

    const text = [
      `New contact message for ${companyName}`,
      '',
      `Name: ${name}`,
      email ? `Email: ${email}` : null,
      phone ? `Phone: ${phone}` : null,
      `Subject: ${safeSubject}`,
      `Submitted: ${submittedAt}`,
      `Source: ${sourceURL}/contact`,
      '',
      'Message',
      message,
    ]
      .filter((line): line is string => typeof line === 'string')
      .join('\n')

    const html = `
      <h1>New contact message</h1>
      <p><strong>Name:</strong> ${escapeHTML(name)}</p>
      ${email ? `<p><strong>Email:</strong> ${escapeHTML(email)}</p>` : ''}
      ${phone ? `<p><strong>Phone:</strong> ${escapeHTML(phone)}</p>` : ''}
      <p><strong>Subject:</strong> ${escapeHTML(safeSubject)}</p>
      <p><strong>Submitted:</strong> ${escapeHTML(submittedAt)}</p>
      <p><strong>Source:</strong> <a href="${escapeHTML(`${sourceURL}/contact`)}">${escapeHTML(
        `${sourceURL}/contact`,
      )}</a></p>
      <h2>Message</h2>
      <p>${escapeHTML(message).replace(/\n/g, '<br />')}</p>
    `

    await payload.sendEmail({
      html,
      replyTo: email || undefined,
      subject: emailSubject,
      text,
      to: ownerEmail,
    })

    return Response.json({ success: true })
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500
    const message = error instanceof Error ? error.message : 'Unable to send this message.'

    return Response.json({ error: message, success: false }, { status })
  }
}
