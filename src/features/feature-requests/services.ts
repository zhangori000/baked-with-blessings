import type { Payload, Where } from 'payload'

import {
  FEATURE_REQUEST_BODY_MAX_LENGTH,
  FEATURE_REQUEST_PSEUDONYM_MAX_LENGTH,
  FEATURE_REQUEST_TITLE_MAX_LENGTH,
} from '@/collections/FeatureRequests'
import {
  FEATURE_REQUEST_COMMENT_BODY_MAX_LENGTH,
  FEATURE_REQUEST_COMMENT_PSEUDONYM_MAX_LENGTH,
} from '@/collections/FeatureRequestComments'
import type { Customer, FeatureRequest, FeatureRequestComment } from '@/payload-types'

import {
  FEATURE_REQUESTS_PAGE_SIZE,
  type FeatureRequestCommentPublic,
  type FeatureRequestPublic,
  type FeatureRequestSortMode,
  type FeatureRequestsPage,
} from './types'

export class FeatureRequestServiceError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const isObjectLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const computeDisplayName = (
  request: Pick<FeatureRequest, 'displayMode' | 'pseudonym' | 'customer'>,
): { displayName: string; isAnonymous: boolean } => {
  if (request.displayMode === 'anonymous') {
    const trimmedPseudonym =
      typeof request.pseudonym === 'string' ? request.pseudonym.trim() : ''
    return { displayName: trimmedPseudonym || 'Anonymous', isAnonymous: true }
  }

  if (isObjectLike(request.customer)) {
    const name = (request.customer as Customer).name
    const trimmedAccountName = typeof name === 'string' ? name.trim() : ''
    if (trimmedAccountName) {
      return { displayName: trimmedAccountName, isAnonymous: false }
    }
  }

  return { displayName: 'Anonymous', isAnonymous: false }
}

const computeCommentDisplayName = (
  comment: Pick<FeatureRequestComment, 'displayMode' | 'pseudonym' | 'customer'>,
): { displayName: string; isAnonymous: boolean } => {
  if (comment.displayMode === 'anonymous') {
    const trimmedPseudonym =
      typeof comment.pseudonym === 'string' ? comment.pseudonym.trim() : ''
    return { displayName: trimmedPseudonym || 'Anonymous', isAnonymous: true }
  }

  if (isObjectLike(comment.customer)) {
    const name = (comment.customer as Customer).name
    const trimmedAccountName = typeof name === 'string' ? name.trim() : ''
    if (trimmedAccountName) {
      return { displayName: trimmedAccountName, isAnonymous: false }
    }
  }

  return { displayName: 'Anonymous', isAnonymous: false }
}

const extractRatingCustomerId = (
  rating: NonNullable<FeatureRequest['ratings']>[number],
): number | string | null => {
  const ref = rating.customer
  if (typeof ref === 'string' || typeof ref === 'number') return ref
  if (isObjectLike(ref) && (typeof ref.id === 'string' || typeof ref.id === 'number')) {
    return ref.id
  }
  return null
}

export const toPublicRequest = (
  request: FeatureRequest,
  viewer: Pick<Customer, 'id'> | null,
  commentCount: number,
): FeatureRequestPublic => {
  const { displayName, isAnonymous } = computeDisplayName(request)
  const ratingCount = typeof request.ratingCount === 'number' ? request.ratingCount : 0
  const ratingSum = typeof request.ratingSum === 'number' ? request.ratingSum : 0
  const averageRating = ratingCount > 0 ? ratingSum / ratingCount : 0
  const myRating =
    viewer && Array.isArray(request.ratings)
      ? request.ratings.find((rating) => extractRatingCustomerId(rating) === viewer.id)?.value ??
        null
      : null

  return {
    id: String(request.id),
    averageRating,
    body: typeof request.body === 'string' ? request.body : '',
    commentCount,
    createdAt: request.createdAt,
    displayName,
    isAnonymous,
    myRating: typeof myRating === 'number' ? myRating : null,
    ratingCount,
    title: typeof request.title === 'string' ? request.title : '',
  }
}

export const toPublicComment = (
  comment: FeatureRequestComment,
): FeatureRequestCommentPublic => {
  const { displayName, isAnonymous } = computeCommentDisplayName(comment)
  return {
    id: String(comment.id),
    body: typeof comment.body === 'string' ? comment.body : '',
    createdAt: comment.createdAt,
    displayName,
    isAnonymous,
  }
}

const countCommentsForRequests = async (
  payload: Payload,
  requestIds: number[],
): Promise<Map<number, number>> => {
  const counts = new Map<number, number>()
  if (requestIds.length === 0) return counts

  for (const id of requestIds) counts.set(id, 0)

  const { docs } = await payload.find({
    collection: 'feature-request-comments',
    depth: 0,
    limit: 0,
    pagination: false,
    where: {
      and: [
        { request: { in: requestIds } },
        { isHidden: { not_equals: true } },
      ],
    },
  })

  for (const doc of docs) {
    const ref = (doc as FeatureRequestComment).request
    const id =
      typeof ref === 'number'
        ? ref
        : isObjectLike(ref) && typeof (ref as { id: unknown }).id === 'number'
          ? ((ref as { id: number }).id)
          : null
    if (id != null) counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return counts
}

export const fetchRequestsPage = async ({
  payload,
  viewer,
  cursor,
  limit = FEATURE_REQUESTS_PAGE_SIZE,
  sort = 'newest',
}: {
  payload: Payload
  viewer: Pick<Customer, 'id'> | null
  cursor?: string | null
  limit?: number
  sort?: FeatureRequestSortMode
}): Promise<FeatureRequestsPage> => {
  const where: Where = {
    and: [
      { visibility: { equals: 'public' } },
      { isHidden: { not_equals: true } },
    ],
  }

  if (cursor) {
    if (sort === 'newest') {
      ;(where.and as Where[]).push({ createdAt: { less_than: cursor } })
    } else {
      const parts = cursor.split('|')
      const ratingCursor = Number(parts[0])
      const dateCursor = parts[1]
      if (Number.isFinite(ratingCursor) && dateCursor) {
        ;(where.and as Where[]).push({
          or: [
            { ratingSum: { less_than: ratingCursor } },
            {
              and: [
                { ratingSum: { equals: ratingCursor } },
                { createdAt: { less_than: dateCursor } },
              ],
            },
          ],
        })
      }
    }
  }

  const sortOrder = sort === 'top-rated' ? '-ratingSum,-createdAt' : '-createdAt'

  const { docs } = await payload.find({
    collection: 'feature-requests',
    depth: 1,
    limit,
    sort: sortOrder,
    where,
  })

  const requestIds = docs.map((doc) => Number(doc.id)).filter((id) => Number.isFinite(id))
  const commentCounts = await countCommentsForRequests(payload, requestIds)

  const requests = docs.map((doc) => {
    const typed = doc as FeatureRequest
    return toPublicRequest(
      typed,
      viewer,
      commentCounts.get(Number(typed.id)) ?? 0,
    )
  })

  const hasMore = docs.length === limit
  let nextCursor: string | null = null
  if (hasMore) {
    const last = docs[docs.length - 1] as FeatureRequest
    if (sort === 'newest') {
      nextCursor = last.createdAt
    } else {
      nextCursor = `${last.ratingSum ?? 0}|${last.createdAt}`
    }
  }

  return { hasMore, nextCursor, requests, sort }
}

type CreateRequestInput = {
  body: string
  displayMode?: 'self' | 'anonymous'
  pseudonym?: string | null
  title: string
  visibility: 'public' | 'private'
}

export const createRequest = async ({
  customer,
  input,
  payload,
}: {
  customer: Customer
  input: CreateRequestInput
  payload: Payload
}): Promise<FeatureRequest> => {
  const trimmedTitle = typeof input.title === 'string' ? input.title.trim() : ''
  const trimmedBody = typeof input.body === 'string' ? input.body.trim() : ''
  const trimmedPseudonym =
    typeof input.pseudonym === 'string'
      ? input.pseudonym.trim().slice(0, FEATURE_REQUEST_PSEUDONYM_MAX_LENGTH)
      : ''

  if (!trimmedTitle) {
    throw new FeatureRequestServiceError('Title is required.', 400)
  }
  if (trimmedTitle.length > FEATURE_REQUEST_TITLE_MAX_LENGTH) {
    throw new FeatureRequestServiceError(
      `Title is too long (max ${FEATURE_REQUEST_TITLE_MAX_LENGTH} characters).`,
      400,
    )
  }
  if (!trimmedBody) {
    throw new FeatureRequestServiceError('Request body is required.', 400)
  }
  if (trimmedBody.length > FEATURE_REQUEST_BODY_MAX_LENGTH) {
    throw new FeatureRequestServiceError(
      `Request is too long (max ${FEATURE_REQUEST_BODY_MAX_LENGTH} characters).`,
      400,
    )
  }

  const isPublic = input.visibility === 'public'
  const displayMode = isPublic && input.displayMode === 'anonymous' ? 'anonymous' : 'self'

  const created = await payload.create({
    collection: 'feature-requests',
    data: {
      body: trimmedBody.slice(0, FEATURE_REQUEST_BODY_MAX_LENGTH),
      customer: customer.id as never,
      displayMode,
      isHidden: false,
      pseudonym:
        isPublic && displayMode === 'anonymous' && trimmedPseudonym ? trimmedPseudonym : null,
      ratingCount: 0,
      ratingSum: 0,
      ratings: [],
      title: trimmedTitle.slice(0, FEATURE_REQUEST_TITLE_MAX_LENGTH),
      visibility: isPublic ? 'public' : 'private',
    } as never,
  })

  return created as FeatureRequest
}

export const rateRequest = async ({
  customer,
  payload,
  requestId,
  value,
}: {
  customer: Customer
  payload: Payload
  requestId: string | number
  value: number
}): Promise<FeatureRequest> => {
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    throw new FeatureRequestServiceError('Rating must be between 1 and 5.', 400)
  }
  const intValue = Math.round(value)

  const request = (await payload
    .findByID({ collection: 'feature-requests', depth: 0, id: requestId as string | number })
    .catch(() => null)) as FeatureRequest | null

  if (!request) {
    throw new FeatureRequestServiceError('Feature request not found.', 404)
  }
  if (request.visibility !== 'public') {
    throw new FeatureRequestServiceError('Cannot rate a private request.', 403)
  }
  if (request.isHidden) {
    throw new FeatureRequestServiceError('This request is no longer accepting ratings.', 403)
  }

  const existingRatings = Array.isArray(request.ratings) ? request.ratings : []
  const customerId = customer.id as number
  const existingIndex = existingRatings.findIndex(
    (rating) => extractRatingCustomerId(rating) === customerId,
  )

  const nextRatings =
    existingIndex >= 0
      ? existingRatings.map((rating, idx) =>
          idx === existingIndex ? { ...rating, value: intValue } : rating,
        )
      : [...existingRatings, { customer: customerId as never, value: intValue }]

  const ratingCount = nextRatings.length
  const ratingSum = nextRatings.reduce(
    (acc, rating) => acc + (typeof rating.value === 'number' ? rating.value : 0),
    0,
  )

  const updated = await payload.update({
    collection: 'feature-requests',
    id: request.id,
    data: { ratingCount, ratingSum, ratings: nextRatings as never },
  })

  return updated as FeatureRequest
}

type CreateCommentInput = {
  body: string
  displayMode?: 'self' | 'anonymous'
  pseudonym?: string | null
}

export const createComment = async ({
  customer,
  input,
  payload,
  requestId,
}: {
  customer: Customer
  input: CreateCommentInput
  payload: Payload
  requestId: string | number
}): Promise<FeatureRequestComment> => {
  const trimmedBody = typeof input.body === 'string' ? input.body.trim() : ''
  const trimmedPseudonym =
    typeof input.pseudonym === 'string'
      ? input.pseudonym.trim().slice(0, FEATURE_REQUEST_COMMENT_PSEUDONYM_MAX_LENGTH)
      : ''

  if (!trimmedBody) {
    throw new FeatureRequestServiceError('Comment body is required.', 400)
  }
  if (trimmedBody.length > FEATURE_REQUEST_COMMENT_BODY_MAX_LENGTH) {
    throw new FeatureRequestServiceError(
      `Comment is too long (max ${FEATURE_REQUEST_COMMENT_BODY_MAX_LENGTH} characters).`,
      400,
    )
  }

  const request = (await payload
    .findByID({ collection: 'feature-requests', depth: 0, id: requestId as string | number })
    .catch(() => null)) as FeatureRequest | null

  if (!request) {
    throw new FeatureRequestServiceError('Feature request not found.', 404)
  }
  if (request.visibility !== 'public') {
    throw new FeatureRequestServiceError('Cannot comment on a private request.', 403)
  }
  if (request.isHidden) {
    throw new FeatureRequestServiceError(
      'This request is no longer accepting comments.',
      403,
    )
  }

  const displayMode = input.displayMode === 'anonymous' ? 'anonymous' : 'self'

  const created = await payload.create({
    collection: 'feature-request-comments',
    data: {
      body: trimmedBody.slice(0, FEATURE_REQUEST_COMMENT_BODY_MAX_LENGTH),
      customer: customer.id as never,
      displayMode,
      isHidden: false,
      pseudonym: displayMode === 'anonymous' && trimmedPseudonym ? trimmedPseudonym : null,
      request: request.id as never,
    } as never,
  })

  return created as FeatureRequestComment
}

export const fetchComments = async ({
  payload,
  requestId,
}: {
  payload: Payload
  requestId: string | number
}): Promise<FeatureRequestCommentPublic[]> => {
  const { docs } = await payload.find({
    collection: 'feature-request-comments',
    depth: 1,
    limit: 200,
    sort: 'createdAt',
    where: {
      and: [
        { request: { equals: requestId } },
        { isHidden: { not_equals: true } },
      ],
    },
  })

  return docs.map((doc) => toPublicComment(doc as FeatureRequestComment))
}
