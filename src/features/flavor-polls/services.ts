import { createHash } from 'node:crypto'

import type { Payload } from 'payload'

import { buildCookiePosterAsset } from '@/features/products/cookieDisplayData'
import type { FlavorPoll, FlavorPollVote, Product } from '@/payload-types'

import { FLAVOR_IDEA_MAX_LENGTH } from './constants'
import type { PollBallot, PollOption, PollStandings, PublicPoll } from './types'

export class FlavorPollError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const relationID = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : null
  }
  return null
}

export const hashVoterToken = (token: string) =>
  createHash('sha256')
    .update(`${process.env.PAYLOAD_SECRET ?? ''}:flavor-vote:${token}`)
    .digest('hex')

export const isPollOpen = (poll: Pick<FlavorPoll, 'closesAt' | 'status'>, now = Date.now()) =>
  poll.status === 'live' && new Date(poll.closesAt).getTime() > now

const toPollOption = (product: Product): PollOption | null => {
  const poster = buildCookiePosterAsset(product)
  if (!poster) return null

  return {
    fallbackSrc: poster.bodyFallbackSrc,
    image: poster.image,
    productId: product.id,
    slug: poster.slug,
    summary: poster.summary,
    title: poster.title,
  }
}

export const toPublicPoll = (poll: FlavorPoll): PublicPoll => ({
  allowFlavorIdeas: poll.allowFlavorIdeas !== false,
  closesAt: poll.closesAt,
  id: poll.id,
  isOpen: isPollOpen(poll),
  options: (poll.options ?? [])
    .filter((option): option is Product => typeof option === 'object' && option !== null)
    .filter((product) => product._status !== 'draft')
    .map(toPollOption)
    .filter((option): option is PollOption => Boolean(option)),
  showStandingsAfterVoting: poll.showStandingsAfterVoting !== false,
  title: poll.title,
  votesPerPerson: Math.max(1, Math.floor(Number(poll.votesPerPerson) || 1)),
})

export const findCurrentPoll = async (payload: Payload) => {
  const result = await payload.find({
    collection: 'flavor-polls',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    sort: '-closesAt',
    where: { status: { equals: 'live' } },
  })

  return (result.docs[0] as FlavorPoll | undefined) ?? null
}

const findVoteDoc = async (payload: Payload, pollID: number, voterKey: string) => {
  const result = await payload.find({
    collection: 'flavor-poll-votes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ poll: { equals: pollID } }, { voterKey: { equals: voterKey } }],
    },
  })

  return (result.docs[0] as FlavorPollVote | undefined) ?? null
}

const toBallot = (vote: FlavorPollVote): PollBallot => {
  const picks: Record<number, number> = {}
  for (const pick of vote.picks ?? []) {
    const productID = relationID(pick.product)
    const count = Number(pick.count)
    if (productID != null && count > 0) {
      picks[productID] = (picks[productID] ?? 0) + count
    }
  }

  return { flavorIdea: vote.flavorIdea ?? '', picks }
}

export const findBallot = async (
  payload: Payload,
  poll: Pick<PublicPoll, 'id' | 'options'>,
  voterKey: string | null,
) => {
  if (!voterKey) return null
  const vote = await findVoteDoc(payload, poll.id, voterKey)
  if (!vote) return null

  const ballot = toBallot(vote)
  const allowedIDs = new Set(poll.options.map((option) => option.productId))
  const picks: Record<number, number> = {}
  for (const [id, count] of Object.entries(ballot.picks)) {
    if (allowedIDs.has(Number(id))) picks[Number(id)] = count
  }

  if (Object.keys(picks).length === 0) return null
  return { ...ballot, picks }
}

export const tallyPoll = async (payload: Payload, poll: PublicPoll) => {
  const result = await payload.find({
    collection: 'flavor-poll-votes',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { flavorIdea: true, picks: true },
    where: { poll: { equals: poll.id } },
  })

  const totals = new Map<number, number>()
  const flavorIdeas: string[] = []

  for (const doc of result.docs as FlavorPollVote[]) {
    for (const pick of doc.picks ?? []) {
      const productID = relationID(pick.product)
      const count = Number(pick.count)
      if (productID != null && count > 0) {
        totals.set(productID, (totals.get(productID) ?? 0) + count)
      }
    }
    const idea = doc.flavorIdea?.trim()
    if (idea) flavorIdeas.push(idea)
  }

  const rows = poll.options
    .map((option) => ({
      productId: option.productId,
      title: option.title,
      votes: totals.get(option.productId) ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title))

  const standings: PollStandings = {
    rows,
    totalVotes: rows.reduce((sum, row) => sum + row.votes, 0),
    voterCount: result.docs.length,
  }

  return { flavorIdeas, standings }
}

export const submitBallot = async ({
  flavorIdea,
  payload,
  picks,
  poll,
  voterKey,
}: {
  flavorIdea: unknown
  payload: Payload
  picks: unknown
  poll: PublicPoll
  voterKey: string
}): Promise<PollBallot> => {
  if (!poll.isOpen) {
    throw new FlavorPollError('Voting has closed for this week.', 409)
  }

  const allowedIDs = new Set(poll.options.map((option) => option.productId))
  const cleanPicks: { count: number; product: number }[] = []
  let spent = 0

  if (picks && typeof picks === 'object' && !Array.isArray(picks)) {
    for (const [key, raw] of Object.entries(picks as Record<string, unknown>)) {
      const productID = Number(key)
      const count = Number(raw)
      if (!Number.isInteger(count) || count < 0) {
        throw new FlavorPollError('Each flavor needs a whole number of votes.')
      }
      if (count === 0) continue
      if (!allowedIDs.has(productID)) {
        throw new FlavorPollError('That flavor is not on this week’s ballot.')
      }
      spent += count
      cleanPicks.push({ count, product: productID })
    }
  }

  if (spent < 1) {
    throw new FlavorPollError('Place at least one cookie token before submitting.')
  }
  if (spent > poll.votesPerPerson) {
    throw new FlavorPollError(`You only have ${poll.votesPerPerson} tokens to spend.`)
  }

  const idea =
    poll.allowFlavorIdeas && typeof flavorIdea === 'string'
      ? flavorIdea.trim().replace(/\s+/g, ' ').slice(0, FLAVOR_IDEA_MAX_LENGTH)
      : ''

  const data = { flavorIdea: idea || null, picks: cleanPicks, poll: poll.id, voterKey }
  const existing = await findVoteDoc(payload, poll.id, voterKey)

  if (existing) {
    const updated = await payload.update({
      collection: 'flavor-poll-votes',
      data,
      depth: 0,
      id: existing.id,
      overrideAccess: true,
    })
    return toBallot(updated as FlavorPollVote)
  }

  try {
    const created = await payload.create({
      collection: 'flavor-poll-votes',
      data,
      depth: 0,
      overrideAccess: true,
    })
    return toBallot(created as FlavorPollVote)
  } catch (error) {
    const raced = await findVoteDoc(payload, poll.id, voterKey)
    if (!raced) throw error
    const updated = await payload.update({
      collection: 'flavor-poll-votes',
      data,
      depth: 0,
      id: raced.id,
      overrideAccess: true,
    })
    return toBallot(updated as FlavorPollVote)
  }
}
