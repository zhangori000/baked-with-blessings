import type { Payload } from 'payload'

import type { FlavorPoll } from '@/payload-types'

import { findBallot, findUpcomingPoll, tallyPoll, toPublicPoll } from './services'
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
