'use client'

import { ArrowRight, Cookie, Maximize2, Minus, Plus, X } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { ImageLightbox, type ImageLightboxItem } from '@/components/ImageLightbox'
import { getOverlayRoot, useOverlayDismiss } from '@/components/ImageLightbox/useOverlayDismiss'
import { Media } from '@/components/Media'
import { BakeryAction } from '@/design-system/bakery'
import { FLAVOR_IDEA_MAX_LENGTH } from '@/features/flavor-polls/constants'
import { formatPollCloseLabel } from '@/features/flavor-polls/schedule'
import type {
  ClosedPollResults,
  NextVoteStatus,
  PollBallot,
  PollOption,
  PollStandings,
  PublicPoll,
} from '@/features/flavor-polls/types'
import { featureRequestsHref, menuHref, oldFlavorsHref } from '@/utilities/routes'

import { formatRemaining, useCountdown, useRefreshOnceReached } from './useVoteClock'
import { ClosedResults, NextVoteStat, VoteHistory } from './VoteResults.client'
import { pluralTokens, Standings } from './VoteStandings'

type OpenVote = {
  ballot: PollBallot | null
  poll: PublicPoll
  standings: PollStandings | null
}

type VoteExperienceProps = {
  featureRequestsEnabled: boolean
  history: ClosedPollResults[]
  next: NextVoteStatus
  openVote: OpenVote | null
}

const countTokens = (picks: Record<number, number>) =>
  Object.values(picks).reduce((sum, value) => sum + value, 0)

const MAX_CARD_TOKEN_SLOTS = 5

function TokenRow({ filled, total }: { filled: number; total: number }) {
  return (
    <span aria-hidden="true" className="voteTokenRow">
      {Array.from({ length: total }, (_, index) => (
        <Cookie
          className="voteToken"
          data-filled={index < filled || undefined}
          key={index}
          strokeWidth={2.2}
        />
      ))}
    </span>
  )
}

function OptionImage({ option, sizes }: { option: PollOption; sizes: string }) {
  if (option.image) {
    return (
      <Media
        fill
        htmlElement={null}
        imgClassName="voteCardImage"
        resource={option.image}
        size={sizes}
      />
    )
  }

  return (
    <NextImage
      alt={`${option.title} cookie`}
      className="voteCardImage"
      fill
      sizes={sizes}
      src={option.fallbackSrc}
      unoptimized
    />
  )
}

function VoteCard({
  canAdd,
  count,
  onChange,
  onExpand,
  option,
  votesPerPerson,
}: {
  canAdd: boolean
  count: number
  onChange: (next: number) => void
  onExpand: () => void
  option: PollOption
  votesPerPerson: number
}) {
  const slots = votesPerPerson <= MAX_CARD_TOKEN_SLOTS ? votesPerPerson : 1

  return (
    <li className="voteCard" data-picked={count > 0 || undefined}>
      <button
        aria-label={`Enlarge photo of ${option.title}`}
        className="voteCardPhoto"
        onClick={onExpand}
        type="button"
      >
        <span className="voteCardPhotoFrame">
          <OptionImage option={option} sizes="(max-width: 640px) 80vw, 280px" />
        </span>
        <span aria-hidden="true" className="voteCardExpand">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>
      <div className="voteCardBody">
        <h3 className="voteCardTitle">{option.title}</h3>
        {option.summary ? <p className="voteCardSummary">{option.summary}</p> : null}
        <div className="voteStepper">
          <button
            aria-label={`Take a token off ${option.title}`}
            className="voteStepperButton"
            disabled={count === 0}
            onClick={() => onChange(count - 1)}
            type="button"
          >
            <Minus aria-hidden="true" className="h-4 w-4" />
          </button>
          <span aria-live="polite" className="voteStepperCount">
            <TokenRow filled={Math.min(count, slots)} total={slots} />
            <span className="voteStepperLabel">{pluralTokens(count)}</span>
          </span>
          <button
            aria-label={`Put a token on ${option.title}`}
            className="voteStepperButton"
            data-primary
            disabled={!canAdd}
            onClick={() => onChange(count + 1)}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  )
}

function ThankYouDialog({
  closeLabel,
  featureRequestsEnabled,
  hasStandings,
  isOpen,
  onClose,
}: {
  closeLabel: string
  featureRequestsEnabled: boolean
  hasStandings: boolean
  isOpen: boolean
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useOverlayDismiss({ focusRef: closeRef, isOpen, onClose })

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div className="voteDialogBackdrop" onClick={onClose}>
      <div
        aria-labelledby="vote-thanks-title"
        aria-modal="true"
        className="voteDialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close"
          className="voteDialogClose"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
        <h2 className="voteDialogTitle" id="vote-thanks-title">
          Thanks for voting!
        </h2>
        <p className="voteDialogText">
          Your tokens are saved. You can change them any time until voting closes {closeLabel}.
        </p>
        {featureRequestsEnabled ? (
          <div className="voteDialogNote">
            <p>
              Got a bigger idea? A flavor we have never made, a box size, anything for the site? You
              can always post it on our Request Features page.
            </p>
            <BakeryAction
              as={Link}
              end={<ArrowRight aria-hidden="true" className="h-4 w-4" />}
              href={featureRequestsHref}
              size="sm"
              variant="secondary"
            >
              Request a feature
            </BakeryAction>
          </div>
        ) : null}
        <BakeryAction block onClick={onClose} size="md" variant="primary">
          {hasStandings ? 'See the current standings' : 'Done'}
        </BakeryAction>
      </div>
    </div>,
    getOverlayRoot(),
  )
}

function EmptyState({ next }: { next: NextVoteStatus }) {
  return (
    <div className="voteEmpty">
      <p className="voteEyebrow">No vote open right now</p>
      <h2 className="voteHeadline">The next flavor vote is coming soon</h2>
      <div className="voteStats">
        <NextVoteStat next={next} />
      </div>
      <p className="voteLead">Check back soon. In the meantime, see what is baking now.</p>
      <div className="voteActions">
        <BakeryAction as={Link} href={menuHref} size="lg" variant="primary">
          See this week’s menu
        </BakeryAction>
        <BakeryAction as={Link} href={oldFlavorsHref} size="lg" variant="secondary">
          Browse old flavors
        </BakeryAction>
      </div>
    </div>
  )
}

function ActiveVote({
  featureRequestsEnabled,
  initialBallot,
  initialStandings,
  poll,
}: {
  featureRequestsEnabled: boolean
  initialBallot: PollBallot | null
  initialStandings: PollStandings | null
  poll: PublicPoll
}) {
  const router = useRouter()
  const remainingMs = useCountdown(poll.closesAt)
  const isOpen = poll.isOpen && remainingMs > 0
  const closeLabel = formatPollCloseLabel(poll.closesAt)
  const [savedBallot, setSavedBallot] = useState<PollBallot | null>(initialBallot)
  const [standings, setStandings] = useState<PollStandings | null>(initialStandings)
  const [picks, setPicks] = useState<Record<number, number>>(initialBallot?.picks ?? {})
  const [flavorIdea, setFlavorIdea] = useState(initialBallot?.flavorIdea ?? '')
  const [isEditing, setIsEditing] = useState(!initialBallot)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isThankYouOpen, setIsThankYouOpen] = useState(false)
  const [lightboxItem, setLightboxItem] = useState<ImageLightboxItem | null>(null)
  const changeVotesRef = useRef<HTMLElement>(null)

  const spent = countTokens(picks)
  const savedSpent = savedBallot ? countTokens(savedBallot.picks) : 0
  const remainingTokens = poll.votesPerPerson - spent
  const gridRef = useRef<HTMLUListElement>(null)
  const submitBarRef = useRef<HTMLDivElement>(null)
  const [isGridVisible, setIsGridVisible] = useState(false)
  const [isSubmitBarVisible, setIsSubmitBarVisible] = useState(false)
  const closeLightbox = useCallback(() => setLightboxItem(null), [])
  const closeThankYou = useCallback(() => {
    setIsThankYouOpen(false)
    window.requestAnimationFrame(() => changeVotesRef.current?.focus({ preventScroll: true }))
  }, [])

  const hasClockClosed = remainingMs <= 0

  useRefreshOnceReached({ isReached: hasClockClosed, isWaiting: poll.isOpen })

  useEffect(() => {
    const grid = gridRef.current
    const bar = submitBarRef.current
    if (!grid || !bar || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === grid) setIsGridVisible(entry.isIntersecting)
        if (entry.target === bar) setIsSubmitBarVisible(entry.isIntersecting)
      }
    })
    observer.observe(grid)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [isEditing, isOpen])

  const showFloatingTally = isEditing && isGridVisible && !isSubmitBarVisible

  const setCount = (productId: number, next: number) => {
    setError(null)
    setPicks((current) => {
      const others = countTokens(current) - (current[productId] ?? 0)
      const clamped = Math.max(0, Math.min(next, poll.votesPerPerson - others))
      const updated = { ...current }
      if (clamped === 0) {
        delete updated[productId]
      } else {
        updated[productId] = clamped
      }
      return updated
    })
  }

  const handleSubmit = async () => {
    if (spent < 1 || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/flavor-polls/${poll.id}/vote`, {
        body: JSON.stringify({ flavorIdea, picks }),
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json().catch(() => ({}))) as {
        ballot?: PollBallot
        error?: string
        standings?: PollStandings | null
        success?: boolean
      }

      if (!response.ok || !result.success || !result.ballot) {
        setError(result.error ?? 'Something went wrong. Please try again.')
        submitBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (response.status === 409) router.refresh()
        return
      }

      setSavedBallot(result.ballot)
      setPicks(result.ballot.picks)
      setFlavorIdea(result.ballot.flavorIdea)
      setStandings(result.standings ?? null)
      setIsEditing(false)
      setIsThankYouOpen(true)
    } catch {
      setError('We could not reach the bakery. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const titleByProduct = new Map(poll.options.map((option) => [option.productId, option.title]))
  const savedSummary = savedBallot
    ? Object.entries(savedBallot.picks)
        .map(([id, count]) => `${titleByProduct.get(Number(id)) ?? 'A flavor'} × ${count}`)
        .join(', ')
    : ''

  if (!isOpen) {
    return (
      <div className="voteLayout">
        <header aria-live="polite" className="voteIntro">
          <p className="voteEyebrow">Voting just closed</p>
          <h2 className="voteHeadline">{poll.title}</h2>
          <p className="voteLead">
            Counting the cookie tokens. The final results will show here in a moment.
          </p>
        </header>
      </div>
    )
  }

  return (
    <div className="voteLayout">
      <header className="voteIntro">
        <p className="voteEyebrow">Cookie token ballot</p>
        <h2 className="voteHeadline">{poll.title}</h2>
        <p className="voteLead">
          You have {pluralTokens(poll.votesPerPerson)}. Stack them all on one favorite or spread
          them across the flavors you want next week.
        </p>
        <div className="voteStats">
          <div className="voteStat">
            <span className="voteStatLabel">Voting closes in</span>
            <span className="voteStatValue" suppressHydrationWarning>
              {formatRemaining(remainingMs)}
            </span>
            <span className="voteStatHint">{closeLabel}</span>
          </div>
          <div className="voteStat">
            <span className="voteStatLabel">{isEditing ? 'Tokens left' : 'Tokens placed'}</span>
            <span className="voteStatValue">
              {isEditing ? remainingTokens : savedSpent} of {poll.votesPerPerson}
            </span>
            <TokenRow
              filled={isEditing ? remainingTokens : savedSpent}
              total={poll.votesPerPerson}
            />
          </div>
        </div>
      </header>

      {!isEditing && savedBallot ? (
        <div aria-live="polite" className="voteSaved">
          <div>
            <p className="voteSavedTitle">Your votes are in</p>
            <p className="voteMuted">{savedSummary}</p>
            {savedBallot.flavorIdea ? (
              <p className="voteMuted">Your idea: “{savedBallot.flavorIdea}”</p>
            ) : null}
          </div>
          <BakeryAction
            onClick={() => setIsEditing(true)}
            ref={changeVotesRef}
            size="md"
            variant="secondary"
          >
            Change my votes
          </BakeryAction>
        </div>
      ) : null}

      {isEditing ? (
        <>
          <ul className="voteGrid" ref={gridRef}>
            {poll.options.map((option) => {
              const count = picks[option.productId] ?? 0
              return (
                <VoteCard
                  canAdd={remainingTokens > 0}
                  count={count}
                  key={option.productId}
                  onChange={(next) => setCount(option.productId, next)}
                  onExpand={() =>
                    setLightboxItem({
                      fallbackSrc: option.fallbackSrc,
                      image: option.image,
                      title: option.title,
                    })
                  }
                  option={option}
                  votesPerPerson={poll.votesPerPerson}
                />
              )
            })}
          </ul>

          {poll.allowFlavorIdeas ? (
            <div className="voteIdea">
              <label className="voteIdeaLabel" htmlFor="vote-flavor-idea">
                What flavor would you love to see? <span className="voteMuted">(optional)</span>
              </label>
              <input
                className="voteIdeaInput"
                id="vote-flavor-idea"
                maxLength={FLAVOR_IDEA_MAX_LENGTH}
                onChange={(event) => setFlavorIdea(event.target.value)}
                placeholder="Lemon blueberry, ube, pumpkin chai…"
                type="text"
                value={flavorIdea}
              />
              <p className="voteMuted">The baker reads every idea.</p>
            </div>
          ) : null}

          <div className="voteSubmitBar" ref={submitBarRef}>
            <div className="voteSubmitCopy">
              <strong>
                {spent === 0
                  ? `Place up to ${pluralTokens(poll.votesPerPerson)}`
                  : remainingTokens === 0
                    ? 'All tokens placed'
                    : `${pluralTokens(remainingTokens)} left to place`}
              </strong>
              <span className="voteMuted">
                {error ?? 'You can change your votes until voting closes.'}
              </span>
            </div>
            <div className="voteSubmitActions">
              {savedBallot ? (
                <BakeryAction
                  onClick={() => {
                    setPicks(savedBallot.picks)
                    setFlavorIdea(savedBallot.flavorIdea)
                    setError(null)
                    setIsEditing(false)
                  }}
                  size="lg"
                  variant="ghost"
                >
                  Cancel
                </BakeryAction>
              ) : null}
              <BakeryAction
                disabled={spent < 1}
                loading={isSubmitting}
                onClick={handleSubmit}
                size="lg"
                variant="primary"
              >
                {savedBallot ? 'Save my votes' : 'Submit my votes'}
              </BakeryAction>
            </div>
          </div>
        </>
      ) : null}

      {!isEditing && standings ? (
        <Standings
          myPicks={savedBallot?.picks ?? {}}
          standings={standings}
          title="Current standings"
        />
      ) : null}

      {!isEditing && !standings ? (
        <p className="voteMuted voteSecretNote">
          Totals stay secret until voting closes {closeLabel}. Check back then for the results.
        </p>
      ) : null}

      {showFloatingTally ? (
        <div className="voteFloatingTally">
          <TokenRow filled={remainingTokens} total={poll.votesPerPerson} />
          <span>
            {remainingTokens === 0 ? 'All tokens placed' : `${pluralTokens(remainingTokens)} left`}
          </span>
          <button
            className="voteFloatingTallyButton"
            disabled={spent < 1 || isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {savedBallot ? 'Save' : 'Submit'}
          </button>
        </div>
      ) : null}

      <ImageLightbox item={lightboxItem} onClose={closeLightbox} />
      <ThankYouDialog
        closeLabel={closeLabel}
        featureRequestsEnabled={featureRequestsEnabled}
        hasStandings={Boolean(standings)}
        isOpen={isThankYouOpen}
        onClose={closeThankYou}
      />
    </div>
  )
}

export function VoteExperience({
  featureRequestsEnabled,
  history,
  next,
  openVote,
}: VoteExperienceProps) {
  const [lastResults, ...earlier] = history

  if (openVote) {
    return (
      <div className="voteLayout">
        <ActiveVote
          featureRequestsEnabled={featureRequestsEnabled}
          initialBallot={openVote.ballot}
          initialStandings={openVote.standings}
          key={openVote.poll.id}
          poll={openVote.poll}
        />
        <VoteHistory
          history={history}
          openLatest
          subtitle="Open any week to see how every flavor did."
          title="Past votes"
        />
      </div>
    )
  }

  if (lastResults) {
    return (
      <div className="voteLayout">
        <ClosedResults key={lastResults.poll.id} next={next} results={lastResults} />
        <VoteHistory
          history={earlier}
          openLatest={false}
          subtitle="Open any week to see how every flavor did."
          title="Earlier votes"
        />
      </div>
    )
  }

  return <EmptyState next={next} />
}
