import type { File, Payload } from 'payload'

import { REVIEW_TENANT_ID } from '@/features/reviews/types'
import { getServerSideURL } from '@/utilities/getURL'

type LoosePayload = Payload & {
  create: (args: unknown) => Promise<Record<string, unknown>>
}

const MAX_PHOTOS = 4
const MAX_PHOTO_SIZE = 6 * 1024 * 1024
const ALLOW_PUBLIC_REVIEW_PHOTO_UPLOADS = false

const cleanText = (value: FormDataEntryValue | null, fallback = '') => {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : fallback
}

const cleanLongText = (value: FormDataEntryValue | null) => {
  return typeof value === 'string' ? value.trim() : ''
}

const getRating = (value: FormDataEntryValue | null) => {
  const rating = Number(typeof value === 'string' ? value : 0)
  if (!Number.isFinite(rating)) return 0
  return Math.max(1, Math.min(5, Math.round(rating * 2) / 2))
}

const escapeHTML = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getReviewNotificationEmail = () =>
  process.env.REVIEW_NOTIFICATION_TO?.trim() ||
  process.env.CONTACT_NOTIFICATION_TO?.trim() ||
  process.env.ORDER_NOTIFICATION_TO?.trim() ||
  ''

const toPayloadFile = async (file: globalThis.File): Promise<File> => {
  const data = Buffer.from(await file.arrayBuffer())

  return {
    data,
    mimetype: file.type || 'application/octet-stream',
    name: file.name || 'review-photo',
    size: data.byteLength,
  }
}

const sendOwnerReviewNotification = async ({
  payload,
  review,
}: {
  payload: Payload
  review: Record<string, unknown>
}) => {
  const to = getReviewNotificationEmail()

  if (!to) {
    payload.logger.warn(
      'REVIEW_NOTIFICATION_TO, CONTACT_NOTIFICATION_TO, and ORDER_NOTIFICATION_TO are not configured; skipping review notification.',
    )
    return
  }

  const companyName =
    process.env.COMPANY_NAME?.trim() || process.env.SITE_NAME?.trim() || 'Baked with Blessings'
  const serverURL = getServerSideURL()
  const reviewID = review.id
  const adminURL = `${serverURL}/admin/collections/reviews/${reviewID}`
  const submittedAt =
    typeof review.createdAt === 'string'
      ? new Date(review.createdAt).toLocaleString('en-US')
      : new Date().toLocaleString('en-US')
  const customerName = typeof review.customerName === 'string' ? review.customerName : 'Bakery guest'
  const customerEmail = typeof review.customerEmail === 'string' ? review.customerEmail : ''
  const title = typeof review.title === 'string' ? review.title : 'Untitled review'
  const body = typeof review.body === 'string' ? review.body : ''
  const visitContext = typeof review.visitContext === 'string' ? review.visitContext : ''
  const reviewTone = review.reviewTone === 'suggestion' ? 'Suggestion' : 'Loved it'
  const rating = typeof review.rating === 'number' ? review.rating : 'Not recorded'
  const subject = `New ${companyName} review awaiting approval - ${title}`

  const text = [
    `New review awaiting approval for ${companyName}`,
    '',
    `Title: ${title}`,
    `Rating: ${rating}`,
    `Tone: ${reviewTone}`,
    `Customer: ${customerName}`,
    customerEmail ? `Customer email: ${customerEmail}` : null,
    visitContext ? `Visit context: ${visitContext}` : null,
    `Submitted: ${submittedAt}`,
    '',
    'Review',
    body,
    '',
    `Review in Payload admin: ${adminURL}`,
  ]
    .filter((line): line is string => typeof line === 'string')
    .join('\n')

  const html = `
    <h1>New review awaiting approval</h1>
    <p><strong>Title:</strong> ${escapeHTML(title)}</p>
    <p><strong>Rating:</strong> ${escapeHTML(rating)}</p>
    <p><strong>Tone:</strong> ${escapeHTML(reviewTone)}</p>
    <p><strong>Customer:</strong> ${escapeHTML(customerName)}</p>
    ${customerEmail ? `<p><strong>Customer email:</strong> ${escapeHTML(customerEmail)}</p>` : ''}
    ${visitContext ? `<p><strong>Visit context:</strong> ${escapeHTML(visitContext)}</p>` : ''}
    <p><strong>Submitted:</strong> ${escapeHTML(submittedAt)}</p>
    <h2>Review</h2>
    <p>${escapeHTML(body).replace(/\n/g, '<br />')}</p>
    <p><a href="${escapeHTML(adminURL)}">Open this review in Payload admin</a></p>
  `

  await payload.sendEmail({
    html,
    replyTo: customerEmail || undefined,
    subject,
    text,
    to,
  })
}

export const createReviewSubmission = async ({
  formData,
  payload,
}: {
  formData: FormData
  payload: Payload
}) => {
  const customerName = cleanText(formData.get('customerName'), 'Bakery guest')
  const customerEmail = cleanText(formData.get('customerEmail'))
  const title = cleanText(formData.get('title'))
  const body = cleanLongText(formData.get('body'))
  const visitContext = cleanText(formData.get('visitContext'))
  const reviewTone = cleanText(formData.get('reviewTone')) === 'suggestion' ? 'suggestion' : 'loved_it'
  const rating = getRating(formData.get('rating'))

  if (!title || title.length < 3) {
    throw Object.assign(new Error('Please add a short review title.'), { status: 400 })
  }

  if (!body || body.length < 12) {
    throw Object.assign(new Error('Please write a little more detail in the review.'), {
      status: 400,
    })
  }

  if (!rating) {
    throw Object.assign(new Error('Please choose a rating from 1 to 5.'), { status: 400 })
  }

  const photoFiles = formData
    .getAll('photos')
    .filter((value): value is globalThis.File => value instanceof File && value.size > 0)
    .slice(0, MAX_PHOTOS)

  if (!ALLOW_PUBLIC_REVIEW_PHOTO_UPLOADS && photoFiles.length > 0) {
    throw Object.assign(
      new Error('Photo uploads are not enabled yet. Please submit the review text only.'),
      { status: 400 },
    )
  }

  const photoIds: Array<number | string> = []

  for (const photo of photoFiles) {
    if (!photo.type.startsWith('image/')) {
      throw Object.assign(new Error('Photos must be image files.'), { status: 400 })
    }

    if (photo.size > MAX_PHOTO_SIZE) {
      throw Object.assign(new Error('Each photo must be 6MB or smaller.'), { status: 400 })
    }

    const media = await (payload as LoosePayload).create({
      collection: 'media',
      data: {
        alt: `Review photo from ${customerName}`,
      },
      file: await toPayloadFile(photo),
      overrideAccess: true,
    })

    photoIds.push(media.id as number | string)
  }

  const review = await (payload as LoosePayload).create({
    collection: 'reviews',
    data: {
      body,
      customerEmail: customerEmail || undefined,
      customerName,
      photos: photoIds,
      publicStatus: 'under_review',
      rating,
      reviewTone,
      responseStatus: 'listening',
      tenantId: REVIEW_TENANT_ID,
      title,
      visitContext: visitContext || undefined,
    },
    overrideAccess: true,
  })

  try {
    await sendOwnerReviewNotification({
      payload,
      review,
    })
  } catch (error) {
    payload.logger.error({ err: error, reviewID: review.id }, 'Owner review notification failed')
  }

  return {
    id: review.id,
  }
}
