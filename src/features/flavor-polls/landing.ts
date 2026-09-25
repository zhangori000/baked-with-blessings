import type { Payload } from 'payload'

import type { FlavorPoll, FlavorPollVote } from '@/payload-types'

import {
  findBallot,
  findClosedPolls,
  findUpcomingPoll,
  relationID,
  tallyPoll,
  tallyVotes,
  toBallotForPoll,
  toPublicPoll,
} from './services'
import type { ClosedPollResults, NextVoteStatus } from './types'

export const loadClosedResults = async (
  payload: Payload,
  pollDoc: FlavorPoll,
  voterKey: string | null,
): Promise<ClosedPollResults> => {
  const poll = toPublicPoll(pollDoc)
  const [{ standings }, ballot] = await Promise.all([
    tallyPoll(payload, poll),
    findBallot(payload, poll, voterKey),
  ])

  return { myPicks: ballot?.picks ?? {}, poll, standings }
}

export const loadNextVoteStatus = async (
  payload: Payload,
  { hasOpenPoll, now }: { hasOpenPoll: boolean; now: Date },
): Promise<NextVoteStatus> => {
  if (hasOpenPoll) return { kind: 'open' }
  const upcoming = await findUpcomingPoll(payload, now)
  return upcoming?.opensAt ? { kind: 'scheduled', opensAt: upcoming.opensAt } : { kind: 'unknown' }
}

export const loadVoteHistory = async (
  payload: Payload,
  { now, voterKey }: { now: Date; voterKey: string | null },
): Promise<ClosedPollResults[]> => {
  const polls = (await findClosedPolls(payload, now)).map(toPublicPoll)
  if (polls.length === 0) return []

  const result = await payload.find({
    collection: 'flavor-poll-votes',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { picks: true, poll: true, voterKey: true },
    where: { poll: { in: polls.map((poll) => poll.id) } },
  })

  const votesByPoll = new Map<number, FlavorPollVote[]>()
  for (const vote of result.docs as FlavorPollVote[]) {
    const pollID = relationID(vote.poll)
    if (pollID == null) continue
    const list = votesByPoll.get(pollID) ?? []
    list.push(vote)
    votesByPoll.set(pollID, list)
  }

  return polls.map((poll) => {
    const votes = votesByPoll.get(poll.id) ?? []
    const mine = voterKey ? votes.find((vote) => vote.voterKey === voterKey) : undefined
    return {
      myPicks: (mine && toBallotForPoll(poll, mine)?.picks) || {},
      poll,
      standings: tallyVotes(poll, votes).standings,
    }
  })
}
