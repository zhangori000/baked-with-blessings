import type { Customer, Order, CommunityNote } from '@/payload-types'
import type { Payload, Where } from 'payload'

import {
  COMMUNITY_NOTES_PAGE_SIZE,
  type CommunityNoteItem,
  type CommunityNotePublic,
  type CommunityNotesPage,
  type CommunityNoteVoteValue,
} from './types'

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

export const computeDisplayName = (
  note: Pick<CommunityNote, 'isAnonymous' | 'pseudonym' | 'customer'>,
): string => {
  if (note.isAnonymous) {
    return 'Anonymous'
  }

  const trimmedPseudonym = typeof note.pseudonym === 'string' ? note.pseudonym.trim() : ''
  if (trimmedPseudonym) {
    return trimmedPseudonym
  }

  if (isObjectLike(note.customer)) {
    const name = (note.customer as Customer).name
    const trimmedAccountName = typeof name === 'string' ? name.trim() : ''
    if (trimmedAccountName) {
      return trimmedAccountName
    }
  }

  return 'Anonymous'
}

const extractCustomerId = (
  vote: NonNullable<CommunityNote['votes']>[number],
): string | number | null => {
  const ref = vote.customer
  if (typeof ref === 'string' || typeof ref === 'number') return ref
  if (isObjectLike(ref) && (typeof ref.id === 'string' || typeof ref.id === 'number')) {
    return ref.id
  }
  return null
}

const extractItems = (note: CommunityNote): CommunityNoteItem[] => {
  if (!Array.isArray(note.orderItemSnapshot)) return []
  return note.orderItemSnapshot
    .map((item) => {
      const productTitle =
        typeof item.productTitle === 'string' ? item.productTitle.trim() : ''
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1
      if (!productTitle) return null
      return { productTitle, quantity }
    })
    .filter((value): value is CommunityNoteItem => value !== null)
}

export const toPublicNote = (
  note: CommunityNote,
  viewer: Pick<Customer, 'id'> | null,
): CommunityNotePublic => {
  const myVote =
    viewer && Array.isArray(note.votes)
      ? note.votes.find((vote) => extractCustomerId(vote) === viewer.id)?.value ?? null
      : null

  const orderCreatedAt =
    isObjectLike(note.order) && typeof (note.order as { createdAt?: unknown }).createdAt === 'string'
      ? ((note.order as { createdAt: string }).createdAt)
      : null

  return {
    id: String(note.id),
    body: typeof note.body === 'string' ? note.body : '',
    createdAt: note.createdAt,
    displayName: computeDisplayName(note),
    isAnonymous: Boolean(note.isAnonymous),
    items: extractItems(note),
    likeCount: typeof note.likeCount === 'number' ? note.likeCount : 0,
    dislikeCount: typeof note.dislikeCount === 'number' ? note.dislikeCount : 0,
    myVote: (myVote as CommunityNoteVoteValue | null) ?? null,
    orderCreatedAt,
  }
}

export const fetchCommunityNotesPage = async ({
  payload,
  viewer,
  cursor,
  limit = COMMUNITY_NOTES_PAGE_SIZE,
}: {
  payload: Payload
  viewer: Pick<Customer, 'id'> | null
  cursor?: string | null
  limit?: number
}): Promise<CommunityNotesPage> => {
  const where: Where = {
    isHidden: { not_equals: true },
  }

  if (cursor) {
    where.createdAt = { less_than: cursor }
  }

  const { docs } = await payload.find({
    collection: 'community-notes',
    depth: 1,
    limit,
    sort: '-createdAt',
    where,
  })

  const notes = docs.map((doc) => toPublicNote(doc as CommunityNote, viewer))
  const hasMore = docs.length === limit
  const nextCursor = hasMore ? notes[notes.length - 1]?.createdAt ?? null : null

  return { hasMore, nextCursor, notes }
}

const summarizeOrderItems = (order: Order): CommunityNoteItem[] => {
  if (!Array.isArray(order.items)) return []
  return order.items
    .map((item) => {
      const product = item.product
      if (!isObjectLike(product)) return null

      const title =
        typeof (product as { title?: unknown }).title === 'string'
          ? ((product as { title: string }).title).trim()
          : ''

      if (!title) return null

      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1

      return { productTitle: title, quantity }
    })
    .filter((value): value is CommunityNoteItem => value !== null)
}

export type CreateNoteInput = {
  orderId: string | number
  body: string
  isAnonymous: boolean
  pseudonym?: string | null
}

export class CommunityNoteServiceError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const createCommunityNote = async ({
  payload,
  customer,
  input,
}: {
  payload: Payload
  customer: Customer
  input: CreateNoteInput
}): Promise<CommunityNote> => {
  const trimmedBody = typeof input.body === 'string' ? input.body.trim() : ''
  if (!trimmedBody) {
    throw new CommunityNoteServiceError('A note needs some words.', 400)
  }
  if (trimmedBody.length > 500) {
    throw new CommunityNoteServiceError('Notes are limited to 500 characters.', 400)
  }

  if (input.orderId === null || input.orderId === undefined || input.orderId === '') {
    throw new CommunityNoteServiceError('Missing order reference.', 400)
  }

  const order = (await payload
    .findByID({ collection: 'orders', depth: 2, id: input.orderId as string | number })
    .catch(() => null)) as Order | null

  if (!order) {
    throw new CommunityNoteServiceError('Order not found.', 404)
  }

  const orderCustomerId =
    typeof order.customer === 'object' && order.customer !== null
      ? (order.customer as Customer).id
      : order.customer
  if (orderCustomerId !== customer.id) {
    throw new CommunityNoteServiceError('You can only post a note for your own order.', 403)
  }

  const existing = await payload.find({
    collection: 'community-notes',
    depth: 0,
    limit: 1,
    where: { order: { equals: order.id } },
  })
  if (existing.docs.length > 0) {
    throw new CommunityNoteServiceError(
      'You already posted a note for this order. Each order gets one.',
      409,
    )
  }

  const items = summarizeOrderItems(order)
  if (items.length === 0) {
    throw new CommunityNoteServiceError(
      'This order has no items to attach to a note.',
      400,
    )
  }

  const trimmedPseudonym =
    typeof input.pseudonym === 'string' ? input.pseudonym.trim().slice(0, 60) : ''

  const created = await payload.create({
    collection: 'community-notes',
    data: {
      body: trimmedBody.slice(0, 500),
      customer: customer.id,
      dislikeCount: 0,
      isAnonymous: Boolean(input.isAnonymous),
      isHidden: false,
      likeCount: 0,
      order: order.id,
      orderItemSnapshot: items,
      pseudonym: input.isAnonymous ? null : trimmedPseudonym || null,
      votes: [],
    },
  })

  return created as CommunityNote
}

export const applyVote = async ({
  payload,
  customer,
  noteId,
  value,
}: {
  payload: Payload
  customer: Customer
  noteId: string | number
  value: CommunityNoteVoteValue
}): Promise<CommunityNote> => {
  if (value !== 'like' && value !== 'dislike') {
    throw new CommunityNoteServiceError('Invalid vote.', 400)
  }

  const note = (await payload
    .findByID({ collection: 'community-notes', depth: 0, id: noteId })
    .catch(() => null)) as CommunityNote | null
  if (!note) {
    throw new CommunityNoteServiceError('Note not found.', 404)
  }
  if (note.isHidden) {
    throw new CommunityNoteServiceError('This note is no longer available.', 404)
  }

  const existingVotes = Array.isArray(note.votes) ? [...note.votes] : []
  const existingIndex = existingVotes.findIndex(
    (vote) => extractCustomerId(vote) === customer.id,
  )
  const existing = existingIndex >= 0 ? existingVotes[existingIndex] : null

  let nextVotes = existingVotes
  if (existing) {
    if (existing.value === value) {
      nextVotes = existingVotes.filter((_, idx) => idx !== existingIndex)
    } else {
      nextVotes = existingVotes.map((vote, idx) =>
        idx === existingIndex ? { ...vote, value } : vote,
      )
    }
  } else {
    nextVotes = [...existingVotes, { customer: customer.id, value }]
  }

  const likeCount = nextVotes.filter((vote) => vote.value === 'like').length
  const dislikeCount = nextVotes.filter((vote) => vote.value === 'dislike').length

  const updated = await payload.update({
    collection: 'community-notes',
    id: note.id,
    data: {
      dislikeCount,
      likeCount,
      votes: nextVotes,
    },
  })

  return updated as CommunityNote
}

export const findExistingNoteForOrder = async ({
  payload,
  orderId,
}: {
  payload: Payload
  orderId: string | number
}): Promise<CommunityNote | null> => {
  const result = await payload.find({
    collection: 'community-notes',
    depth: 0,
    limit: 1,
    where: { order: { equals: orderId } },
  })
  return (result.docs[0] as CommunityNote | undefined) ?? null
}
