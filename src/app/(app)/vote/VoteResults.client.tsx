'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { BakeryAction } from '@/design-system/bakery'
import { getPodium, joinTitles } from '@/features/flavor-polls/results'
import { formatPollDateLabel, formatPollDayLabel } from '@/features/flavor-polls/schedule'
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

const HISTORY_FIRST_PAGE = 8
const HISTORY_PAGE_SIZE = 12

function VoteHistoryItem({ isOpen, results }: { isOpen: boolean; results: ClosedPollResults }) {
  const { myPicks, poll, standings } = results
  const winners = getPodium(standings.rows)[0]?.titles ?? []
  const hasVotes = winners.length > 0
  const headingId = `vote-history-standings-${poll.id}`

  return (
    <details className="voteHistoryItem" data-poll-id={poll.id} open={isOpen}>
      <summary className="voteHistorySummary">
        <span className="voteHistorySummaryMain">
          <span className="voteHistoryDate">{formatPollDayLabel(poll.closesAt)}</span>
          <span className="voteHistoryWinner">
            {hasVotes
              ? `${joinTitles(winners)} ${winners.length > 1 ? 'tied for first' : 'won'}`
              : 'No votes'}
          </span>
          <span className="voteHistoryMeta">
            {poll.title}
            {hasVotes ? ` · ${pluralPeople(standings.voterCount)} voted` : ''}
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="voteHistoryChevron" />
      </summary>
      <div className="voteHistoryPanel">
        {hasVotes ? (
          <Standings
            headingId={headingId}
            headingLevel="h3"
            myPicks={myPicks}
            standings={standings}
            title="Final standings"
          />
        ) : (
          <p className="voteMuted">Nobody voted in this one.</p>
        )}
        <div className="voteHistoryActions">
          <BakeryAction
            as={Link}
            end={<ArrowRight aria-hidden="true" className="h-4 w-4" />}
            href={flavorVoteResultsHref(poll.id)}
            size="md"
            variant="secondary"
          >
            See the results page
          </BakeryAction>
        </div>
      </div>
    </details>
  )
}

export function VoteHistory({
  history,
  openLatest,
  subtitle,
  title,
}: {
  history: ClosedPollResults[]
  openLatest: boolean
  subtitle: string
  title: string
}) {
  const [visibleCount, setVisibleCount] = useState(HISTORY_FIRST_PAGE)
  if (history.length === 0) return null

  const visible = history.slice(0, visibleCount)
  const hiddenCount = history.length - visible.length

  return (
    <section aria-labelledby="vote-history-title" className="voteHistory">
      <div className="voteHistoryHeader">
        <p className="voteEyebrow">Already decided</p>
        <h2 className="voteSectionTitle" id="vote-history-title">
          {title}
        </h2>
        <p className="voteMuted">{subtitle}</p>
      </div>
      <ol className="voteHistoryList">
        {visible.map((results, index) => (
          <li key={results.poll.id}>
            <VoteHistoryItem isOpen={openLatest && index === 0} results={results} />
          </li>
        ))}
      </ol>
      {hiddenCount > 0 ? (
        <BakeryAction
          className="voteHistoryMore"
          onClick={() => setVisibleCount((count) => count + HISTORY_PAGE_SIZE)}
          size="md"
          variant="secondary"
        >
          Show older votes ({hiddenCount})
        </BakeryAction>
      ) : null}
    </section>
  )
}
