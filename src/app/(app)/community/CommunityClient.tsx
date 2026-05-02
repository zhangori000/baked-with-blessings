'use client'

import {
  BakeryAction,
  BakeryCard,
  BakeryCheckbox,
  BakeryPageShell,
  BakeryPressable,
} from '@/design-system/bakery'
import { cn } from '@/utilities/cn'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import { ThumbsDown, ThumbsUp, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'
import { customerLoginHref } from '@/utilities/routes'
import {
  COMMUNITY_NOTES_PAGE_SIZE,
  type CommunityNotePublic,
  type CommunityNotesPage,
  type CommunityNoteVoteValue,
} from '@/features/community/types'

const POST_IT_BACKGROUNDS = [
  '#fff3a4',
  '#ffd9a8',
  '#ffb6c1',
  '#c8eed1',
  '#bfe2ff',
  '#e0c8ff',
] as const

const TAPE_TONES = [
  'rgba(255, 248, 184, 0.78)',
  'rgba(217, 232, 255, 0.78)',
  'rgba(255, 220, 220, 0.78)',
] as const

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const formatNoteDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const summarizeItems = (items: CommunityNotePublic['items']) => {
  if (items.length === 0) return ''
  const first = items[0]
  const firstLabel = `${first.productTitle}${first.quantity > 1 ? ` ×${first.quantity}` : ''}`
  if (items.length === 1) return firstLabel
  return `${firstLabel} + ${items.length - 1} more`
}

type Props = {
  fromOrderId: string | null
  heroEyebrow: string
  heroSummary: string
  heroTitle: string
  initialPage: CommunityNotesPage
  initialSceneryTone?: MenuSceneryTone
  isAuthenticated: boolean
  viewerName: string | null
}

const truncate = (value: string, max: number) =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`

export function CommunityClient({
  fromOrderId,
  heroEyebrow,
  heroSummary,
  heroTitle,
  initialPage,
  initialSceneryTone,
  isAuthenticated,
  viewerName,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [heroSceneryTone, setHeroSceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)

  const [notes, setNotes] = useState<CommunityNotePublic[]>(initialPage.notes)
  const [cursor, setCursor] = useState<string | null>(initialPage.nextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initialPage.hasMore)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState<boolean>(Boolean(fromOrderId))
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [displayName, setDisplayName] = useState(viewerName?.trim() ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [activeNote, setActiveNote] = useState<CommunityNotePublic | null>(null)
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    for (const sceneryTone of menuSceneryTones) {
      preloadSceneryAssets(sceneryTone)
    }
  }, [])

  const handleSelectHeroScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (nextSceneryTone === heroSceneryTone) return
    setIsSceneryPickerOpen(false)
    startTransition(() => setHeroSceneryTone(nextSceneryTone))
    preloadSceneryAssets(nextSceneryTone)
  }

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    setFeedError(null)
    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      params.set('limit', String(COMMUNITY_NOTES_PAGE_SIZE))
      const res = await fetch(`/api/community-notes?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = (await res.json()) as
        | (CommunityNotesPage & { success: true })
        | { error: string; success: false }
      if (!('success' in json) || !json.success) {
        throw new Error('error' in json ? json.error : 'Could not load more notes.')
      }
      setNotes((prev) => {
        const seen = new Set(prev.map((note) => note.id))
        const next = json.notes.filter((note) => !seen.has(note.id))
        return [...prev, ...next]
      })
      setCursor(json.nextCursor)
      setHasMore(json.hasMore)
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Could not load more notes.')
    } finally {
      setIsLoadingMore(false)
    }
  }, [cursor, hasMore, isLoadingMore])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore()
        }
      },
      { rootMargin: '320px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  const handleOpenForm = useCallback(() => {
    setFormError(null)
    setIsFormOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setFormError(null)
    if (fromOrderId) {
      const next = new URLSearchParams(searchParams.toString())
      next.delete('fromOrder')
      const query = next.toString()
      router.replace(`/community${query ? `?${query}` : ''}`, { scroll: false })
    }
  }, [fromOrderId, router, searchParams])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!fromOrderId) {
      setFormError(
        'You can post a note right after an order, from your order page. Place an order first, then you will be sent here.',
      )
      return
    }
    const trimmed = body.trim()
    if (!trimmed) {
      setFormError('Write a few words first.')
      return
    }
    setIsSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/community-notes', {
        body: JSON.stringify({
          body: trimmed,
          isAnonymous,
          orderId: fromOrderId,
          pseudonym: isAnonymous ? null : displayName.trim() || null,
        }),
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const json = (await res.json()) as
        | { note: CommunityNotePublic; success: true }
        | { error: string; success: false }
      if (!json.success) {
        throw new Error(json.error || 'Could not post note.')
      }
      setNotes((prev) => [json.note, ...prev.filter((existing) => existing.id !== json.note.id)])
      setBody('')
      setDisplayName(viewerName?.trim() ?? '')
      setIsAnonymous(false)
      setIsFormOpen(false)
      const next = new URLSearchParams(searchParams.toString())
      next.delete('fromOrder')
      const query = next.toString()
      router.replace(`/community${query ? `?${query}` : ''}`, { scroll: false })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not post note.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (note: CommunityNotePublic, value: CommunityNoteVoteValue) => {
    if (!isAuthenticated) {
      router.push(
        `${customerLoginHref}&redirect=${encodeURIComponent('/community')}&warning=${encodeURIComponent(
          'Log in to react to a note.',
        )}`,
      )
      return
    }
    if (pendingVoteId === note.id) return
    setPendingVoteId(note.id)
    try {
      const res = await fetch(`/api/community-notes/${note.id}/vote`, {
        body: JSON.stringify({ value }),
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const json = (await res.json()) as
        | { note: CommunityNotePublic; success: true }
        | { error: string; success: false }
      if (!json.success) {
        throw new Error(json.error)
      }
      setNotes((prev) => prev.map((existing) => (existing.id === json.note.id ? json.note : existing)))
      setActiveNote((current) => (current && current.id === json.note.id ? json.note : current))
    } catch (error) {
      console.error(error)
    } finally {
      setPendingVoteId((current) => (current === note.id ? null : current))
    }
  }

  const remainingChars = useMemo(() => 500 - body.length, [body])

  return (
    <div className="communityPage">
      <div className="cateringMenuExperience communityHeroExperience">
        <MenuHero
          eyebrow={heroEyebrow}
          isSceneryPickerOpen={isSceneryPickerOpen}
          isSceneChanging={false}
          onSelectScenery={handleSelectHeroScenery}
          onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
          sceneryTone={heroSceneryTone}
          summary={heroSummary}
          title={heroTitle}
        />
      </div>

      <BakeryPageShell
        as="section"
        className="communityShell"
        spacing="none"
        tone="transparent"
        width="container"
      >
        <BakeryCard
          as="header"
          className="communityIntroBar"
          radius="md"
          spacing="none"
          tone="transparent"
        >
          <div className="communityIntroBarRow">
            <p className="communityIntroBarTitle">Post-it Wall</p>
            <p className="communityIntroBarSubtitle">
              Public letters from people who just ordered. Newest pinned at the top.
            </p>
          </div>
          <div className="communityIntroBarActions">
            {isAuthenticated ? (
              fromOrderId ? (
                <BakeryAction onClick={handleOpenForm} variant="primary">
                  Write your note
                </BakeryAction>
              ) : (
                <p className="communityIntroBarHint">
                  Want to leave a note? Place an order, then come back from your order page.
                </p>
              )
            ) : (
              <BakeryAction
                as={Link}
                href={`${customerLoginHref}&redirect=${encodeURIComponent('/community')}`}
                variant="primary"
              >
                Log in to react
              </BakeryAction>
            )}
          </div>
        </BakeryCard>

        {isFormOpen ? (
          <BakeryCard
            as="form"
            className="communityComposer"
            onSubmit={handleSubmit}
            radius="lg"
            spacing="lg"
            tone="paper"
          >
            <div className="communityComposerHead">
              <p className="communityComposerEyebrow">Pin it to the wall</p>
              <BakeryPressable
                aria-label="Close composer"
                className="communityComposerClose"
                onClick={handleCloseForm}
                type="button"
              >
                <X aria-hidden="true" />
              </BakeryPressable>
            </div>
            <p className="communityComposerLead">
              Write a tiny letter for everyone who passes through the wall. Up to 500 characters.
            </p>
            <label className="communityComposerLabel" htmlFor="community-note-body">
              Your note
            </label>
            <textarea
              className="communityComposerTextarea"
              id="community-note-body"
              maxLength={500}
              onChange={(event) => setBody(event.target.value)}
              rows={5}
              value={body}
            />
            <p className="communityComposerCharCount">
              {remainingChars} characters left
            </p>

            <div className="communityComposerIdentity">
              <label className="communityComposerLabel" htmlFor="community-note-name">
                What name do you want to appear as?
              </label>
              <input
                aria-describedby="community-note-name-hint"
                className="communityComposerName"
                disabled={isAnonymous}
                id="community-note-name"
                maxLength={60}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={viewerName?.trim() || 'Your name'}
                type="text"
                value={displayName}
              />
              <p className="communityComposerSignature" id="community-note-name-hint">
                Will appear as{' '}
                <strong>
                  {isAnonymous
                    ? 'Anonymous'
                    : displayName.trim() || viewerName?.trim() || 'Anonymous'}
                </strong>
              </p>
              <BakeryCheckbox
                checked={isAnonymous}
                onChange={(event) => setIsAnonymous(event.target.checked)}
              >
                Post anonymously
              </BakeryCheckbox>
            </div>

            {formError ? <p className="communityComposerError">{formError}</p> : null}

            <div className="communityComposerActions">
              <BakeryAction onClick={handleCloseForm} variant="secondary" type="button">
                Cancel
              </BakeryAction>
              <BakeryAction disabled={isSubmitting || body.trim().length === 0} variant="primary" type="submit">
                {isSubmitting ? 'Posting...' : 'Post the note'}
              </BakeryAction>
            </div>
          </BakeryCard>
        ) : null}

        {feedError ? <p className="communityFeedError">{feedError}</p> : null}

        {notes.length === 0 ? (
          <BakeryCard className="communityEmpty" radius="lg" tone="paper">
            <p className="communityEmptyTitle">No notes pinned yet.</p>
            <p className="communityEmptyBody">
              The very first note will sit at the top of this wall. After your next order you will
              be invited to leave one.
            </p>
          </BakeryCard>
        ) : (
          <ul className="communityGrid" role="list">
            {notes.map((note, index) => {
              const seed = hashString(note.id || String(index))
              const background = POST_IT_BACKGROUNDS[seed % POST_IT_BACKGROUNDS.length]
              const tape = TAPE_TONES[seed % TAPE_TONES.length]
              const summary = summarizeItems(note.items)

              return (
                <li
                  className="communityGridItem"
                  key={note.id}
                  style={{
                    ['--communityNoteBg' as string]: background,
                    ['--communityNoteTape' as string]: tape,
                  }}
                >
                  <div
                    aria-label={`Open note from ${note.displayName}`}
                    className="communityNoteCard"
                    onClick={() => setActiveNote(note)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setActiveNote(note)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span aria-hidden="true" className="communityNoteTape" />
                    <div className="communityNoteTopRow">
                      <span className="communityNoteHeader">
                        <span className="communityNoteAuthor">{note.displayName}</span>
                        <time className="communityNoteDate" dateTime={note.createdAt}>
                          {formatNoteDate(note.createdAt)}
                        </time>
                      </span>
                      <div className="communityNoteReactions">
                        <button
                          aria-label={`Like (${note.likeCount})`}
                          className={cn(
                            'communityNoteReactionBtn',
                            note.myVote === 'like' && 'is-active',
                          )}
                          disabled={pendingVoteId === note.id}
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleVote(note, 'like')
                          }}
                          type="button"
                        >
                          <ThumbsUp aria-hidden="true" />
                          <span>{note.likeCount}</span>
                        </button>
                        <button
                          aria-label={`Dislike (${note.dislikeCount})`}
                          className={cn(
                            'communityNoteReactionBtn',
                            note.myVote === 'dislike' && 'is-active',
                          )}
                          disabled={pendingVoteId === note.id}
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleVote(note, 'dislike')
                          }}
                          type="button"
                        >
                          <ThumbsDown aria-hidden="true" />
                          <span>{note.dislikeCount}</span>
                        </button>
                      </div>
                    </div>
                    <span className="communityNoteBody">{truncate(note.body, 220)}</span>
                    {summary ? (
                      <span className="communityNoteOrderTeaser">
                        <span className="communityNoteOrderEyebrow">Just ordered:</span>{' '}
                        {summary}
                      </span>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {hasMore ? (
          <div className="communityLoadMoreRow">
            <div aria-hidden="true" ref={sentinelRef} />
            <BakeryAction disabled={isLoadingMore} onClick={() => void loadMore()} variant="secondary">
              {isLoadingMore ? 'Loading more notes...' : 'Show more notes'}
            </BakeryAction>
          </div>
        ) : null}
      </BakeryPageShell>

      {activeNote ? (
        <div
          aria-label={`Note from ${activeNote.displayName}`}
          aria-modal="true"
          className="communityModalOverlay"
          onClick={() => setActiveNote(null)}
          role="dialog"
        >
          <div
            className="communityModalCard"
            onClick={(event) => event.stopPropagation()}
            style={{
              ['--communityNoteBg' as string]:
                POST_IT_BACKGROUNDS[hashString(activeNote.id) % POST_IT_BACKGROUNDS.length],
              ['--communityNoteTape' as string]:
                TAPE_TONES[hashString(activeNote.id) % TAPE_TONES.length],
            }}
          >
            <button
              aria-label="Close note"
              className="communityModalClose"
              onClick={() => setActiveNote(null)}
              type="button"
            >
              <X aria-hidden="true" />
            </button>
            <span aria-hidden="true" className="communityNoteTape" />
            <p className="communityModalAuthor">{activeNote.displayName}</p>
            <time className="communityModalDate" dateTime={activeNote.createdAt}>
              {formatNoteDate(activeNote.createdAt)}
            </time>
            <p className="communityModalBody">{activeNote.body}</p>
            {activeNote.items.length > 0 ? (
              <section className="communityModalItems">
                <h3>Just ordered</h3>
                <ul>
                  {activeNote.items.map((item, idx) => (
                    <li key={`${item.productTitle}-${idx}`}>
                      <span className="communityModalItemTitle">{item.productTitle}</span>
                      <span className="communityModalItemQty">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <div className="communityModalReactions">
              <button
                aria-label={`Like (${activeNote.likeCount})`}
                className={cn(
                  'communityNoteReactionBtn',
                  activeNote.myVote === 'like' && 'is-active',
                )}
                disabled={pendingVoteId === activeNote.id}
                onClick={() => void handleVote(activeNote, 'like')}
                type="button"
              >
                <ThumbsUp aria-hidden="true" />
                <span>{activeNote.likeCount}</span>
              </button>
              <button
                aria-label={`Dislike (${activeNote.dislikeCount})`}
                className={cn(
                  'communityNoteReactionBtn',
                  activeNote.myVote === 'dislike' && 'is-active',
                )}
                disabled={pendingVoteId === activeNote.id}
                onClick={() => void handleVote(activeNote, 'dislike')}
                type="button"
              >
                <ThumbsDown aria-hidden="true" />
                <span>{activeNote.dislikeCount}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
