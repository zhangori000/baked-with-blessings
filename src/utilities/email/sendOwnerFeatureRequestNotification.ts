import type { Payload } from 'payload'

import type { Customer, FeatureRequest } from '@/payload-types'
import { decorateEmailEnvelope } from '@/utilities/email/decorateEmailEnvelope'
import { parseEmailRecipients } from '@/utilities/email/recipients'
import { getServerSideURL } from '@/utilities/getURL'

const escapeHTML = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const isObjectLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getSubmitterLines = (request: FeatureRequest) => {
  const lines: string[] = []
  const customer = isObjectLike(request.customer) ? (request.customer as Customer) : null

  if (customer?.name) lines.push(`Customer: ${customer.name}`)
  if (customer?.email) lines.push(`Email: ${customer.email}`)
  if (customer?.phone) lines.push(`Account phone: ${customer.phone}`)
  if (!lines.length) lines.push('Customer details not recorded.')

  return lines
}

export const sendOwnerFeatureRequestNotification = async ({
  payload,
  request,
}: {
  payload: Payload
  request: FeatureRequest
}): Promise<boolean> => {
  const to = parseEmailRecipients(
    process.env.FEATURE_REQUEST_NOTIFICATION_TO || process.env.ORDER_NOTIFICATION_TO,
  )

  if (!to.length) {
    payload.logger.warn(
      'FEATURE_REQUEST_NOTIFICATION_TO / ORDER_NOTIFICATION_TO is not configured; skipping owner feature-request notification.',
    )
    return false
  }

  const companyName =
    process.env.COMPANY_NAME?.trim() || process.env.SITE_NAME?.trim() || 'Baked with Blessings'
  const serverURL = getServerSideURL()
  const adminURL = `${serverURL}/admin/collections/feature-requests/${request.id}`
  const isPrivate = request.visibility === 'private'
  const visibilityLabel = isPrivate ? 'PRIVATE DM' : 'public'
  const subject = `${companyName} feature request (${visibilityLabel}): ${request.title || 'Untitled'}`
  const submitterLines = getSubmitterLines(request)
  const createdAt = request.createdAt
    ? new Date(request.createdAt).toLocaleString('en-US')
    : 'Unknown'

  const text = [
    `New ${visibilityLabel} feature request`,
    '',
    `Title: ${request.title || 'Untitled'}`,
    `Created: ${createdAt}`,
    `Visibility: ${request.visibility}`,
    '',
    'Submitter',
    ...submitterLines,
    '',
    'Body',
    request.body || '',
    '',
    `Open in Payload admin: ${adminURL}`,
  ].join('\n')

  const html = `
    <h1>New ${escapeHTML(visibilityLabel)} feature request</h1>
    <p><strong>Title:</strong> ${escapeHTML(request.title || 'Untitled')}</p>
    <p><strong>Created:</strong> ${escapeHTML(createdAt)}</p>
    <p><strong>Visibility:</strong> ${escapeHTML(request.visibility)}</p>

    <h2>Submitter</h2>
    <ul>${submitterLines.map((line) => `<li>${escapeHTML(line)}</li>`).join('')}</ul>

    <h2>Body</h2>
    <p style="white-space:pre-wrap">${escapeHTML(request.body || '')}</p>

    <p><a href="${escapeHTML(adminURL)}">Open this request in Payload admin</a></p>
  `

  await payload.sendEmail(
    decorateEmailEnvelope({
      html,
      subject,
      text,
      to,
    }),
  )

  return true
}
