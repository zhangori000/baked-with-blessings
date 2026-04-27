import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export const REVIEW_TENANT_ID = 'baked-with-blessings'

export const reviewStatuses = ['under_review', 'published', 'declined'] as const
export const reviewResponseStatuses = [
  'listening',
  'investigating',
  'changed',
  'stood_firm',
  'closed',
] as const
export const reviewTones = ['loved_it', 'suggestion'] as const

export type ReviewStatus = (typeof reviewStatuses)[number]
export type ReviewResponseStatus = (typeof reviewResponseStatuses)[number]
export type ReviewTone = (typeof reviewTones)[number]

export type PublicReviewPhoto = {
  alt: string
  height?: number | null
  id: string
  url: string
  width?: number | null
}

export type PublicReviewAction = {
  date: string
  title: string
  detail: string
}

export type PublicReview = {
  actionLog: PublicReviewAction[]
  businessResponse?: string
  businessResponseRichText?: SerializedEditorState
  createdAt: string
  customerName: string
  fairnessNote?: string
  id: string
  photos: PublicReviewPhoto[]
  rating: number
  reviewTone: ReviewTone
  responseStatus: ReviewResponseStatus
  title: string
  visitContext?: string
  body: string
}

export type ReviewsPageData = {
  reviews: PublicReview[]
  stats: {
    averageRating: number
    changedCount: number
    publishedCount: number
    stoodFirmCount: number
  }
}
