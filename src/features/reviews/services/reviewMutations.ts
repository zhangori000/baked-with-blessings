import type { File, Payload } from 'payload'

import { REVIEW_TENANT_ID } from '@/features/reviews/types'
import { decorateEmailEnvelope } from '@/utilities/email/decorateEmailEnvelope'
import { getFirstConfiguredEmailRecipients } from '@/utilities/email/recipients'
import { getServerSideURL } from '@/utilities/getURL'

type LoosePayload = Payload & {
  create: (args: unknown) => Promise<Record<string, unknown>>
}

const MAX_PHOTOS = 4
const MAX_PHOTO_SIZE = 6 * 1024 * 1024
const MAX_OTHER_CONTACT_LENGTH = 800
const ALLOW_PUBLIC_REVIEW_PHOTO_UPLOADS = false

const cleanText = (value: FormDataEntryValue | null, fallback = '', maxLength = 240) => {
  const text = typeof value === 'string' ? value : fallback
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

const cleanLongText = (value: FormDataEntryValue | null) => {
  return typeof value === 'string' ? value.trim() : ''
}

const cleanOptionalUrl = (value: FormDataEntryValue | null) => {
  const text = cleanText(value, '', 500)
  if (!text) return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

const cleanInstagramHandle = (value: FormDataEntryValue | null) => {
  const text = cleanText(value, '', 80)
  if (!text) return ''
  return text.startsWith('@') ? text : `@${text.replace(/^@+/, '')}`
}

const cleanOptionalSocialID = (value: FormDataEntryValue | null) => cleanText(value, '', 120)

const cleanCheckbox = (value: FormDataEntryValue | null) => value === 'on' || value === 'true'

const escapeHTML = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getReviewNotificationEmail = () =>
  getFirstConfiguredEmailRecipients(
    process.env.REVIEW_NOTIFICATION_TO,
    process.env.CONTACT_NOTIFICATION_TO,
    process.env.ORDER_NOTIFICATION_TO,
  )

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

  if (!to.length) {
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
  const customerName =
    typeof review.customerName === 'string' ? review.customerName : 'Bakery guest'
  const customerEmail = typeof review.customerEmail === 'string' ? review.customerEmail : ''
  const instagramHandle =
    typeof review.instagramHandle === 'string' ? review.instagramHandle.trim() : ''
  const linkedinUrl = typeof review.linkedinUrl === 'string' ? review.linkedinUrl.trim() : ''
  const discordUsername =
    typeof review.discordUsername === 'string' ? review.discordUsername.trim() : ''
  const leagueUsername =
    typeof review.leagueUsername === 'string' ? review.leagueUsername.trim() : ''
  const nintendoId = typeof review.nintendoId === 'string' ? review.nintendoId.trim() : ''
  const ptcgId = typeof review.ptcgId === 'string' ? review.ptcgId.trim() : ''
  const otherContact = typeof review.otherContact === 'string' ? review.otherContact.trim() : ''
  const instagramVisibility = review.instagramHandlePublic ? 'public' : 'private'
  const linkedinVisibility = review.linkedinUrlPublic ? 'public' : 'private'
  const discordVisibility = review.discordUsernamePublic ? 'public' : 'private'
  const leagueVisibility = review.leagueUsernamePublic ? 'public' : 'private'
  const nintendoVisibility = review.nintendoIdPublic ? 'public' : 'private'
  const ptcgVisibility = review.ptcgIdPublic ? 'public' : 'private'
  const otherContactVisibility = review.otherContactPublic ? 'public' : 'private'
  const title = typeof review.title === 'string' ? review.title : 'Untitled review'
  const body = typeof review.body === 'string' ? review.body : ''
  const visitContext = typeof review.visitContext === 'string' ? review.visitContext : ''
  const reviewTone = review.reviewTone === 'suggestion' ? 'Suggestion' : 'Loved it'
  const subject = `New published ${companyName} review - ${title}`

  const contactLines = [
    customerEmail ? `Customer email: ${customerEmail}` : null,
    instagramHandle ? `Instagram (${instagramVisibility}): ${instagramHandle}` : null,
    linkedinUrl ? `LinkedIn (${linkedinVisibility}): ${linkedinUrl}` : null,
    discordUsername ? `Discord (${discordVisibility}): ${discordUsername}` : null,
    leagueUsername ? `League (${leagueVisibility}): ${leagueUsername}` : null,
    nintendoId ? `Nintendo ID (${nintendoVisibility}): ${nintendoId}` : null,
    ptcgId ? `PTCG ID (${ptcgVisibility}): ${ptcgId}` : null,
    otherContact ? `Other contact (${otherContactVisibility}): ${otherContact}` : null,
  ].filter((line): line is string => typeof line === 'string')

  const text = [
    `New published review for ${companyName}`,
    '',
    `Title: ${title}`,
    `Tone: ${reviewTone}`,
    `Customer: ${customerName}`,
    ...contactLines,
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
    <h1>New published review</h1>
    <p><strong>Title:</strong> ${escapeHTML(title)}</p>
    <p><strong>Tone:</strong> ${escapeHTML(reviewTone)}</p>
    <p><strong>Customer:</strong> ${escapeHTML(customerName)}</p>
    ${customerEmail ? `<p><strong>Customer email:</strong> ${escapeHTML(customerEmail)}</p>` : ''}
    ${instagramHandle ? `<p><strong>Instagram (${escapeHTML(instagramVisibility)}):</strong> ${escapeHTML(instagramHandle)}</p>` : ''}
    ${linkedinUrl ? `<p><strong>LinkedIn (${escapeHTML(linkedinVisibility)}):</strong> ${escapeHTML(linkedinUrl)}</p>` : ''}
    ${discordUsername ? `<p><strong>Discord (${escapeHTML(discordVisibility)}):</strong> ${escapeHTML(discordUsername)}</p>` : ''}
    ${leagueUsername ? `<p><strong>League (${escapeHTML(leagueVisibility)}):</strong> ${escapeHTML(leagueUsername)}</p>` : ''}
    ${nintendoId ? `<p><strong>Nintendo ID (${escapeHTML(nintendoVisibility)}):</strong> ${escapeHTML(nintendoId)}</p>` : ''}
    ${ptcgId ? `<p><strong>PTCG ID (${escapeHTML(ptcgVisibility)}):</strong> ${escapeHTML(ptcgId)}</p>` : ''}
    ${otherContact ? `<p><strong>Other contact (${escapeHTML(otherContactVisibility)}):</strong> ${escapeHTML(otherContact).replace(/\n/g, '<br />')}</p>` : ''}
    ${visitContext ? `<p><strong>Visit context:</strong> ${escapeHTML(visitContext)}</p>` : ''}
    <p><strong>Submitted:</strong> ${escapeHTML(submittedAt)}</p>
    <h2>Review</h2>
    <p>${escapeHTML(body).replace(/\n/g, '<br />')}</p>
    <p><a href="${escapeHTML(adminURL)}">Open this review in Payload admin</a></p>
  `

  await payload.sendEmail(
    decorateEmailEnvelope({
      html,
      replyTo: customerEmail || undefined,
      subject,
      text,
      to,
    }),
  )
}

export const createReviewSubmission = async ({
  formData,
  payload,
}: {
  formData: FormData
  payload: Payload
}) => {
  const customerName = cleanText(formData.get('customerName')) || 'Bakery guest'
  const customerEmail = cleanText(formData.get('customerEmail'))
  const instagramHandle = cleanInstagramHandle(formData.get('instagramHandle'))
  const instagramHandlePublic = Boolean(
    instagramHandle && cleanCheckbox(formData.get('instagramHandlePublic')),
  )
  const linkedinUrl = cleanOptionalUrl(formData.get('linkedinUrl'))
  const linkedinUrlPublic = Boolean(linkedinUrl && cleanCheckbox(formData.get('linkedinUrlPublic')))
  const discordUsername = cleanOptionalSocialID(formData.get('discordUsername'))
  const discordUsernamePublic = Boolean(
    discordUsername && cleanCheckbox(formData.get('discordUsernamePublic')),
  )
  const leagueUsername = cleanOptionalSocialID(formData.get('leagueUsername'))
  const leagueUsernamePublic = Boolean(
    leagueUsername && cleanCheckbox(formData.get('leagueUsernamePublic')),
  )
  const nintendoId = cleanOptionalSocialID(formData.get('nintendoId'))
  const nintendoIdPublic = Boolean(nintendoId && cleanCheckbox(formData.get('nintendoIdPublic')))
  const ptcgId = cleanOptionalSocialID(formData.get('ptcgId'))
  const ptcgIdPublic = Boolean(ptcgId && cleanCheckbox(formData.get('ptcgIdPublic')))
  const otherContact = cleanLongText(formData.get('otherContact')).slice(
    0,
    MAX_OTHER_CONTACT_LENGTH,
  )
  const otherContactPublic = Boolean(
    otherContact && cleanCheckbox(formData.get('otherContactPublic')),
  )
  const title = cleanText(formData.get('title'))
  const body = cleanLongText(formData.get('body'))
  const visitContext = cleanText(formData.get('visitContext'))
  const reviewTone =
    cleanText(formData.get('reviewTone')) === 'suggestion' ? 'suggestion' : 'loved_it'

  if (!title) {
    throw Object.assign(new Error('Please add a review title.'), { status: 400 })
  }

  if (!body) {
    throw Object.assign(new Error('Please write your review.'), { status: 400 })
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
      instagramHandle: instagramHandle || undefined,
      instagramHandlePublic,
      linkedinUrl: linkedinUrl || undefined,
      linkedinUrlPublic,
      discordUsername: discordUsername || undefined,
      discordUsernamePublic,
      leagueUsername: leagueUsername || undefined,
      leagueUsernamePublic,
      nintendoId: nintendoId || undefined,
      nintendoIdPublic,
      ptcgId: ptcgId || undefined,
      ptcgIdPublic,
      otherContact: otherContact || undefined,
      otherContactPublic,
      photos: photoIds,
      publicStatus: 'published',
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
