'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { BakeryAction } from '@/design-system/bakery'
import { getPodium, joinTitles } from '@/features/flavor-polls/results'
import { formatPollDateLabel } from '@/features/flavor-polls/schedule'
import type { ClosedPollResults, NextVoteStatus } from '@/features/flavor-polls/types'
import { flavorVoteHref, flavorVoteResultsHref, menuHref, oldFlavorsHref } from '@/utilities/routes'

import { formatRemaining, useCountdown, useRefreshOnceReached } from './useVoteClock'
import { Podium, pluralPeople, pluralTokens, Standings } from './VoteStandings'

const EMAIL_PROMISE = 'We’ll send an email when it’s up.'

function ScheduledNextVote({ opensAt }: { opensAt: string }) {
  const remainingMs = useCountdown(opensAt)
  useRefreshOnceReached({ isReached: remainingMs <= 0, isWaiting: true })

  return (
    <div className="voteStat" data-next-vote="scheduled">
      <span className="voteStatLabel">Next vote opens in</span>
      <span className="voteStatValue" suppressHydrationWarning>
        {formatRemaining(remainingMs)}
      </span>
      <span className="voteStatHint">{formatPollDateLabel(opensAt)}</span>
      <span className="voteStatHint">{EMAIL_PROMISE}</span>
    </div>
  )
}

export function NextVoteStat({ next }: { next: NextVoteStatus }) {
  if (next.kind === 'scheduled') return <ScheduledNextVote opensAt={next.opensAt} />

  if (next.kind === 'open') {
    return (
      <div className="voteStat" data-next-vote="open">
        <span className="voteStatLabel">Next vote</span>
        <span className="voteStatValue">Open now</span>
        <span className="voteStatHint">Pick the flavors you want next.</span>
      </div>
    )
  }

  return (
    <div className="voteStat" data-next-vote="unknown">
      <span className="voteStatLabel">Next vote</span>
      <span className="voteStatValue">Opening soon</span>
      <span className="voteStatHint">{EMAIL_PROMISE}</span>
    </div>
  )
}

export function ClosedResults({
  next,
  results,
}: {
  next: NextVoteStatus
  results: ClosedPollResults
}) {
  const { myPicks, poll, standings } = results
  const winners = getPodium(standings.rows)[0]?.titles ?? []
  const hasVotes = winners.length > 0

  return (
    <div className="voteLayout">
      <header className="voteIntro">
        <p className="voteEyebrow">Voting closed · Results</p>
        <h2 className="voteHeadline">
          {hasVotes ? `You picked ${joinTitles(winners)}` : 'No votes this time'}
        </h2>
        <p className="voteLead">
          “{poll.title}” closed {formatPollDateLabel(poll.closesAt)}.{' '}
          {hasVotes
            ? 'Thanks to everyone who voted. Here is how it landed.'
            : 'The next vote is a fresh start.'}
        </p>
        <Podium standings={standings} />
        <div className="voteStats">
          <NextVoteStat next={next} />
          <div className="voteStat">
            <span className="voteStatLabel">Votes cast</span>
            <span className="voteStatValue">{pluralPeople(standings.voterCount)}</span>
            <span className="voteStatHint">{pluralTokens(standings.totalVotes)} placed</span>
          </div>
        </div>
        <div className="voteActions">
          {next.kind === 'open' ? (
            <BakeryAction
              as={Link}
              end={<ArrowRight aria-hidden="true" className="h-4 w-4" />}
              href={flavorVoteHref}
              size="lg"
              variant="primary"
            >
              Vote in the next one
            </BakeryAction>
          ) : (
            <BakeryAction as={Link} href={menuHref} size="lg" variant="primary">
              See this week’s menu
            </BakeryAction>
          )}
          <BakeryAction as={Link} href={oldFlavorsHref} size="lg" variant="secondary">
            Browse old flavors
          </BakeryAction>
        </div>
      </header>
      {hasVotes ? (
        <Standings myPicks={myPicks} standings={standings} title="Final results" />
      ) : null}
    </div>
  )
}

export function PastResults({ results }: { results: ClosedPollResults }) {
  const { poll, standings } = results
  if (standings.totalVotes === 0) return null

  return (
    <section aria-labelledby="vote-past-title" className="votePast">
      <div className="votePastHeader">
        <p className="voteEyebrow">Already decided</p>
        <h2 className="voteSectionTitle" id="vote-past-title">
          Results from the last vote
        </h2>
        <p className="voteMuted">
          {poll.title} · closed {formatPollDateLabel(poll.closesAt)} ·{' '}
          {pluralPeople(standings.voterCount)} voted
        </p>
      </div>
      <Podium standings={standings} />
      <div>
        <BakeryAction
          as={Link}
          end={<ArrowRight aria-hidden="true" className="h-4 w-4" />}
          href={flavorVoteResultsHref(poll.id)}
          size="md"
          variant="secondary"
        >
          See the full results
        </BakeryAction>
      </div>
    </section>
  )
}
