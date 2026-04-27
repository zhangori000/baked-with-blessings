import type { Payload } from 'payload'

import {
  REVIEW_TENANT_ID,
  type PublicReview,
  type PublicReviewPhoto,
  type ReviewResponseStatus,
  type ReviewTone,
  type ReviewsPageData,
} from '@/features/reviews/types'

type LoosePayload = Payload & {
  create: (args: unknown) => Promise<Record<string, unknown>>
  find: (args: unknown) => Promise<{ docs: Array<Record<string, unknown>> }>
  update: (args: unknown) => Promise<Record<string, unknown>>
}

type StarterReview = {
  body: string
  businessResponse: string
  createdAtOffsetDays: number
  customerName: string
  publicStatus: 'published'
  rating: number
  reviewTone: ReviewTone
  responseStatus: ReviewResponseStatus
  title: string
  visitContext?: string
}

const toStringId = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) return String(value.id)
  return ''
}

const getPhoto = (value: unknown): PublicReviewPhoto | null => {
  if (!value || typeof value !== 'object') return null

  const media =
    'value' in value && value.value && typeof value.value === 'object'
      ? (value.value as Record<string, unknown>)
      : (value as Record<string, unknown>)

  const url = typeof media.url === 'string' ? media.url : ''
  if (!url) return null

  const alt = typeof media.alt === 'string' && media.alt.trim() ? media.alt.trim() : 'Review photo'

  return {
    alt,
    height: typeof media.height === 'number' ? media.height : null,
    id: toStringId(media.id),
    url,
    width: typeof media.width === 'number' ? media.width : null,
  }
}

const getActionLog = (value: unknown) => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const action = entry as Record<string, unknown>
      const title = typeof action.title === 'string' ? action.title.trim() : ''
      const detail = typeof action.detail === 'string' ? action.detail.trim() : ''
      const date = typeof action.date === 'string' ? action.date : ''
      if (!title || !detail || !date) return null
      return { date, detail, title }
    })
    .filter(Boolean) as PublicReview['actionLog']
}

const isPublicReviewPhoto = (value: PublicReviewPhoto | null): value is PublicReviewPhoto =>
  Boolean(value)

export const serializeReview = (doc: Record<string, unknown>): PublicReview => ({
  actionLog: getActionLog(doc.actionLog),
  body: typeof doc.body === 'string' ? doc.body : '',
  businessResponse:
    typeof doc.businessResponse === 'string' && doc.businessResponse.trim()
      ? doc.businessResponse.trim()
      : undefined,
  businessResponseRichText:
    doc.businessResponseRichText &&
    typeof doc.businessResponseRichText === 'object' &&
    'root' in doc.businessResponseRichText
      ? (doc.businessResponseRichText as PublicReview['businessResponseRichText'])
      : undefined,
  createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
  customerName:
    typeof doc.customerName === 'string' && doc.customerName.trim()
      ? doc.customerName.trim()
      : 'Bakery guest',
  fairnessNote:
    typeof doc.fairnessNote === 'string' && doc.fairnessNote.trim()
      ? doc.fairnessNote.trim()
      : undefined,
  id: toStringId(doc.id),
  photos: Array.isArray(doc.photos) ? doc.photos.map(getPhoto).filter(isPublicReviewPhoto) : [],
  rating: typeof doc.rating === 'number' ? doc.rating : 5,
  reviewTone: doc.reviewTone === 'suggestion' ? 'suggestion' : ('loved_it' as ReviewTone),
  responseStatus:
    typeof doc.responseStatus === 'string'
      ? (doc.responseStatus as ReviewResponseStatus)
      : 'listening',
  title: typeof doc.title === 'string' ? doc.title : 'Review',
  visitContext: undefined,
})

const starterReviews: StarterReview[] = [
  {
    body: 'The cookie tray looked beautiful, tasted fresh, and made the birthday table feel finished without me needing to decorate much.',
    businessResponse: 'Thank you. That is exactly what we want the trays to do.',
    createdAtOffsetDays: 1,
    customerName: 'Marisol P.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'The tray made the table feel special',
    visitContext: 'Catering pickup',
  },
  {
    body: 'The lemon cookies were bright without being too sweet. Everyone asked where they came from.',
    businessResponse: 'Thank you for sharing that. We will pass it to the baking team.',
    createdAtOffsetDays: 2,
    customerName: 'Anonymous guest',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Everyone asked about the lemon cookies',
  },
  {
    body: 'Pickup was quick and the boxes were easy to carry. The labels made it simple to set everything out at the office.',
    businessResponse: 'We appreciate this. Clear labels matter, especially for group orders.',
    createdAtOffsetDays: 3,
    customerName: 'Jordan K.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Office order was organized and easy',
  },
  {
    body: 'The rotating cookie box was a fun surprise. The soft banana cookie was my favorite one in the set.',
    businessResponse: 'Thank you. The banana cookie is meant to be soft-baked, so this is great to hear.',
    createdAtOffsetDays: 4,
    customerName: 'Nadia R.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Loved the rotating cookie box',
  },
  {
    body: 'The cookies arrived neatly packed, none were cracked, and the colors matched the event better than I expected.',
    businessResponse: 'Thank you. Careful packing is part of the order, not an extra.',
    createdAtOffsetDays: 5,
    customerName: 'Priya S.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Packed perfectly for our event',
  },
  {
    body: 'I ordered late and still got a clear answer about what could be done. The final tray was honest, pretty, and delicious.',
    businessResponse: 'Thank you. We would rather be clear than overpromise.',
    createdAtOffsetDays: 6,
    customerName: 'Eli M.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Clear communication and a beautiful tray',
  },
  {
    body: 'The chocolate chip cookies tasted like they were baked that morning. They disappeared before the meeting started.',
    businessResponse: 'That is a good problem. Thank you for ordering with us.',
    createdAtOffsetDays: 7,
    customerName: 'Anonymous guest',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Fresh cookies that disappeared fast',
  },
  {
    body: 'The mini cookies were the right size for kids. They could try a few flavors without wasting anything.',
    businessResponse: 'Thank you. Minis should feel generous without being overwhelming.',
    createdAtOffsetDays: 8,
    customerName: 'Camila T.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Mini cookies were perfect for kids',
  },
  {
    body: 'The menu descriptions helped me pick without guessing. The almond notes were clear and the nut-free items were separated.',
    businessResponse: 'Thank you. Clear descriptions and separation are things we take seriously.',
    createdAtOffsetDays: 9,
    customerName: 'Samira A.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Helpful descriptions and careful labels',
  },
  {
    body: 'The cookies looked handmade in the best way. They were polished but still felt warm and personal.',
    businessResponse: 'Thank you. That balance is important to us.',
    createdAtOffsetDays: 10,
    customerName: 'Victor L.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Polished but still personal',
  },
  {
    body: 'I appreciated that the sweetness was balanced. The cookies tasted rich without being heavy.',
    businessResponse: 'Thank you. Balanced sweetness is one of our goals.',
    createdAtOffsetDays: 11,
    customerName: 'Rachel B.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Sweet without being too much',
  },
  {
    body: 'The cafe pickup was friendly and fast. I was in and out in under two minutes.',
    businessResponse: 'Thank you. Pickup should be simple once the order is ready.',
    createdAtOffsetDays: 12,
    customerName: 'Anonymous guest',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Fast and friendly pickup',
  },
  {
    body: 'The oatmeal cookie had great texture. Chewy center, crisp edge, and not too much spice.',
    businessResponse: 'Thank you. We are glad the texture landed well.',
    createdAtOffsetDays: 13,
    customerName: 'Danielle C.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Best oatmeal cookie texture',
  },
  {
    body: 'The thank-you note in the box was a small detail, but it made the order feel cared for.',
    businessResponse: 'Thank you for noticing. Small details are part of hospitality.',
    createdAtOffsetDays: 14,
    customerName: 'Jonah W.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'The box felt thoughtful',
  },
  {
    body: 'The cookies were a hit after dinner. We had just enough variety for everyone to find something they liked.',
    businessResponse: 'Thank you. Variety should make the tray easier to share.',
    createdAtOffsetDays: 15,
    customerName: 'Mei H.',
    publicStatus: 'published',
    rating: 5,
    reviewTone: 'loved_it',
    responseStatus: 'closed',
    title: 'Great variety for sharing',
  },
]

const legacyStarterTitles = [
  'Beautiful cookies, pickup labels needed work',
  'Soft texture was not what I expected',
]

export const ensureStarterReviews = async (payload: Payload) => {
  const now = new Date()
  const loosePayload = payload as LoosePayload

  for (const title of legacyStarterTitles) {
    const legacy = await loosePayload.find({
      collection: 'reviews',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [{ tenantId: { equals: REVIEW_TENANT_ID } }, { title: { equals: title } }],
      },
    })

    for (const doc of legacy.docs) {
      if (!doc.id) continue

      await loosePayload.update({
        id: doc.id,
        collection: 'reviews',
        data: {
          publicStatus: 'declined',
        },
        overrideAccess: true,
      })
    }
  }

  for (const starterReview of starterReviews) {
    const createdAt = new Date(
      now.getTime() - 1000 * 60 * 60 * 24 * starterReview.createdAtOffsetDays,
    ).toISOString()
    const data = {
      actionLog: [],
      body: starterReview.body,
      businessResponse: starterReview.businessResponse,
      customerName: starterReview.customerName,
      fairnessNote: null,
      publicStatus: starterReview.publicStatus,
      rating: starterReview.rating,
      reviewTone: starterReview.reviewTone,
      responseStatus: starterReview.responseStatus,
      tenantId: REVIEW_TENANT_ID,
      title: starterReview.title,
      visitContext: starterReview.visitContext,
    }

    const existing = await loosePayload.find({
      collection: 'reviews',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { tenantId: { equals: REVIEW_TENANT_ID } },
          { title: { equals: starterReview.title } },
        ],
      },
    })

    if (existing.docs[0]?.id) {
      await loosePayload.update({
        id: existing.docs[0].id,
        collection: 'reviews',
        data,
        overrideAccess: true,
      })
    } else {
      await loosePayload.create({
        collection: 'reviews',
        data: {
          ...data,
          createdAt,
        },
        overrideAccess: true,
      })
    }
  }
}

export const getReviewsPageData = async (payload: Payload): Promise<ReviewsPageData> => {
  await ensureStarterReviews(payload)

  const result = await (payload as LoosePayload).find({
    collection: 'reviews',
    depth: 1,
    limit: 100,
    pagination: false,
    sort: '-createdAt',
    where: {
      and: [
        { tenantId: { equals: REVIEW_TENANT_ID } },
        { publicStatus: { equals: 'published' } },
      ],
    },
  })

  const reviews = result.docs.map(serializeReview)
  const ratingTotal = reviews.reduce((total, review) => total + review.rating, 0)
  const averageRating = reviews.length ? ratingTotal / reviews.length : 0

  return {
    reviews,
    stats: {
      averageRating,
      changedCount: reviews.filter((review) => review.responseStatus === 'changed').length,
      publishedCount: reviews.length,
      stoodFirmCount: reviews.filter((review) => review.responseStatus === 'stood_firm').length,
    },
  }
}
