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
import { useAuth } from '@/providers/Auth'
import { MessageSquare, Star, X } from 'lucide-react'
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
  FEATURE_REQUESTS_PAGE_SIZE,
  type FeatureRequestCommentPublic,
  type FeatureRequestPublic,
  type FeatureRequestSortMode,
  type FeatureRequestsPage,
} from '@/features/feature-requests/types'

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const TITLE_MAX = 60
const BODY_MAX = 1000
const COMMENT_MAX = 500
const PSEUDONYM_MAX = 60

type Props = {
  heroEyebrow: string
  heroSummary: string
  heroTitle: string
  initialPage: FeatureRequestsPage
  initialSceneryTone?: MenuSceneryTone
  isAuthenticated: boolean
  viewerName: string | null
}

export function FeatureRequestsClient({
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
  const { setUser, user: authUser } = useAuth()

  const [heroSceneryTone, setHeroSceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)

  const [requests, setRequests] = useState<FeatureRequestPublic[]>(initialPage.requests)
  const [cursor, setCursor] = useState<string | null>(initialPage.nextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initialPage.hasMore)
  const [sort, setSort] = useState<FeatureRequestSortMode>(initialPage.sort)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [pseudonymInput, setPseudonymInput] = useState('')
  const [accountNameInput, setAccountNameInput] = useState('')
  const [localViewerName, setLocalViewerNameRaw] = useState(viewerName?.trim() ?? '')

  const setLocalViewerName = useCallback(
    (next: string) => {
      const trimmed = next.trim()
      setLocalViewerNameRaw(trimmed)
      if (authUser) {
        setUser({ ...authUser, name: trimmed })
      }
    },
    [authUser, setUser],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const hasAccountName = Boolean(localViewerName)

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

  const refetchPage = useCallback(
    async (nextSort: FeatureRequestSortMode) => {
      setIsLoadingMore(true)
      setFeedError(null)
      try {
        const params = new URLSearchParams()
        params.set('limit', String(FEATURE_REQUESTS_PAGE_SIZE))
        params.set('sort', nextSort)
        const res = await fetch(`/api/feature-requests?${params.toString()}`, {
          cache: 'no-store',
        })
        const json = (await res.json()) as
          | (FeatureRequestsPage & { success: true })
          | { error: string; success: false }
        if (!('success' in json) || !json.success) {
          throw new Error('error' in json ? json.error : 'Could not load requests.')
        }
        setRequests(json.requests)
        setCursor(json.nextCursor)
        setHasMore(json.hasMore)
        setSort(json.sort)
      } catch (error) {
        setFeedError(error instanceof Error ? error.message : 'Could not load requests.')
      } finally {
        setIsLoadingMore(false)
      }
    },
    [],
  )

  const handleSortChange = (next: FeatureRequestSortMode) => {
    if (next === sort) return
    void refetchPage(next)
  }

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    setFeedError(null)
    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      params.set('limit', String(FEATURE_REQUESTS_PAGE_SIZE))
      params.set('sort', sort)
      const res = await fetch(`/api/feature-requests?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = (await res.json()) as
        | (FeatureRequestsPage & { success: true })
        | { error: string; success: false }
      if (!('success' in json) || !json.success) {
        throw new Error('error' in json ? json.error : 'Could not load more requests.')
      }
      setRequests((prev) => {
        const seen = new Set(prev.map((request) => request.id))
        const next = json.requests.filter((request) => !seen.has(request.id))
        return [...prev, ...next]
      })
      setCursor(json.nextCursor)
      setHasMore(json.hasMore)
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Could not load more requests.')
    } finally {
      setIsLoadingMore(false)
    }
  }, [cursor, hasMore, isLoadingMore, sort])

  const handleOpenForm = useCallback(() => {
    setFormError(null)
    setIsFormOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setFormError(null)
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAuthenticated) {
      router.push(
        `${customerLoginHref}&redirect=${encodeURIComponent('/feature-requests')}&warning=${encodeURIComponent(
          'Log in to submit a feature request.',
        )}`,
      )
      return
    }
    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    const trimmedAccountName = accountNameInput.trim()
    const trimmedPseudonym = pseudonymInput.trim()

    if (!trimmedTitle) {
      setFormError('Add a short title.')
      return
    }
    if (!trimmedBody) {
      setFormError('Write a few words about what you would like to see.')
      return
    }
    if (
      visibility === 'public' &&
      !isAnonymous &&
      !hasAccountName &&
      !trimmedAccountName
    ) {
      setFormError(
        'Pick a display name to show on your post (will be saved to your account), or check "Post anonymously".',
      )
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/feature-requests', {
        body: JSON.stringify({
          body: trimmedBody,
          customerName:
            visibility === 'public' && !isAnonymous && !hasAccountName
              ? trimmedAccountName
              : null,
          displayMode: visibility === 'public' && isAnonymous ? 'anonymous' : 'self',
          pseudonym: visibility === 'public' && isAnonymous ? trimmedPseudonym || null : null,
          title: trimmedTitle,
          visibility,
        }),
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const json = (await res.json()) as
        | { request: FeatureRequestPublic; success: true }
        | { error: string; success: false }
      if (!json.success) {
        throw new Error(json.error || 'Could not submit request.')
      }
      if (visibility === 'public') {
        setRequests((prev) => [
          json.request,
          ...prev.filter((existing) => existing.id !== json.request.id),
        ])
      }
      if (
        visibility === 'public' &&
        !isAnonymous &&
        !hasAccountName &&
        trimmedAccountName
      ) {
        setLocalViewerName(trimmedAccountName)
      }
      setTitle('')
      setBody('')
      setIsAnonymous(false)
      setPseudonymInput('')
      setAccountNameInput('')
      setVisibility('public')
      setIsFormOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not submit request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRate = async (request: FeatureRequestPublic, value: number) => {
    if (!isAuthenticated) {
      router.push(
        `${customerLoginHref}&redirect=${encodeURIComponent('/feature-requests')}&warning=${encodeURIComponent(
          'Log in to rate a request.',
        )}`,
      )
      return
    }
    try {
      const res = await fetch(`/api/feature-requests/${request.id}/rate`, {
        body: JSON.stringify({ value }),
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const json = (await res.json()) as
        | { request: FeatureRequestPublic; success: true }
        | { error: string; success: false }
      if (!json.success) throw new Error(json.error)
      setRequests((prev) =>
        prev.map((existing) =>
          existing.id === json.request.id
            ? { ...json.request, commentCount: existing.commentCount }
            : existing,
        ),
      )
    } catch (error) {
      console.error(error)
    }
  }

  const remainingTitleChars = useMemo(() => TITLE_MAX - title.length, [title])
  const remainingBodyChars = useMemo(() => BODY_MAX - body.length, [body])

  return (
    <div className="featureRequestsPage">
      <div className="cateringMenuExperience featureRequestsHeroExperience">
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
        className="featureRequestsShell"
        spacing="none"
        tone="transparent"
        width="container"
      >
        <BakeryCard
          as="header"
          className="featureRequestsIntroBar"
          radius="md"
          spacing="none"
          tone="transparent"
        >
          <div className="featureRequestsIntroBarRow">
            <p className="featureRequestsIntroBarTitle">Public requests</p>
            <p className="featureRequestsIntroBarSubtitle">
              Sorted by{' '}
              <strong>{sort === 'top-rated' ? 'top rated' : 'newest'}</strong>
              . Logged-in customers can rate and comment.
            </p>
          </div>
          <div className="featureRequestsIntroBarActions">
            <div className="featureRequestsSortGroup" role="tablist" aria-label="Sort requests">
              <button
                aria-selected={sort === 'newest'}
                className={cn(
                  'featureRequestsSortBtn',
                  sort === 'newest' && 'is-active',
                )}
                onClick={() => handleSortChange('newest')}
                role="tab"
                type="button"
              >
                Newest
              </button>
              <button
                aria-selected={sort === 'top-rated'}
                className={cn(
                  'featureRequestsSortBtn',
                  sort === 'top-rated' && 'is-active',
                )}
                onClick={() => handleSortChange('top-rated')}
                role="tab"
                type="button"
              >
                Top rated
              </button>
            </div>
            {isAuthenticated ? (
              <BakeryAction onClick={handleOpenForm} variant="primary">
                Submit a request
              </BakeryAction>
            ) : (
              <BakeryAction
                as={Link}
                href={`${customerLoginHref}&redirect=${encodeURIComponent('/feature-requests')}`}
                variant="primary"
              >
                Log in to submit
              </BakeryAction>
            )}
          </div>
        </BakeryCard>

        {isFormOpen ? (
          <BakeryCard
            as="form"
            className="featureRequestsComposer"
            onSubmit={handleSubmit}
            radius="lg"
            spacing="sm"
            tone="paper"
          >
            <div className="featureRequestsComposerHead">
              <BakeryPressable
                aria-label="Close composer"
                className="featureRequestsComposerClose"
                onClick={handleCloseForm}
                type="button"
              >
                <X aria-hidden="true" />
              </BakeryPressable>
            </div>

            <div className="featureRequestsVisibilityGroup" role="radiogroup" aria-label="Visibility">
              <button
                aria-pressed={visibility === 'public'}
                className={cn(
                  'featureRequestsVisibilityBtn',
                  visibility === 'public' && 'is-active',
                )}
                onClick={() => setVisibility('public')}
                type="button"
              >
                <span className="featureRequestsVisibilityTitle">Post publicly</span>
                <span className="featureRequestsVisibilitySub">
                  Others can rate + reply. Your name or a pseudonym.
                </span>
              </button>
              <button
                aria-pressed={visibility === 'private'}
                className={cn(
                  'featureRequestsVisibilityBtn',
                  visibility === 'private' && 'is-active',
                )}
                onClick={() => setVisibility('private')}
                type="button"
              >
                <span className="featureRequestsVisibilityTitle">Send privately (DM)</span>
                <span className="featureRequestsVisibilitySub">
                  Only the bakery owner sees this.
                </span>
              </button>
            </div>

            <input
              aria-label="Title"
              className="featureRequestsName"
              maxLength={TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short title (e.g. Add gluten-free options)"
              type="text"
              value={title}
            />
            <p className="featureRequestsCharCount">{remainingTitleChars} characters left</p>

            <textarea
              aria-label="Request body"
              className="featureRequestsTextarea"
              maxLength={BODY_MAX}
              onChange={(event) => setBody(event.target.value)}
              placeholder="What would you like to see? Pages, food, packaging, the way orders work — anything."
              rows={4}
              value={body}
            />
            <p className="featureRequestsCharCount">{remainingBodyChars} characters left</p>

            {visibility === 'public' ? (
              <div className="featureRequestsIdentity">
                <BakeryCheckbox
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                  size="sm"
                >
                  Post anonymously / use a pseudonym
                </BakeryCheckbox>
                {isAnonymous ? (
                  <input
                    aria-label="Pseudonym"
                    className="featureRequestsName"
                    maxLength={PSEUDONYM_MAX}
                    onChange={(event) => setPseudonymInput(event.target.value)}
                    placeholder="Pseudonym (blank → 'Anonymous')"
                    type="text"
                    value={pseudonymInput}
                  />
                ) : !hasAccountName ? (
                  <>
                    <input
                      aria-label="Display name"
                      className="featureRequestsName"
                      maxLength={80}
                      onChange={(event) => setAccountNameInput(event.target.value)}
                      placeholder="Your display name"
                      type="text"
                      value={accountNameInput}
                    />
                    <p className="featureRequestsSignature">
                      Your account doesn&apos;t have a name yet — pick one. We&apos;ll save it
                      to your account so it pre-fills here and in comments next time.
                    </p>
                  </>
                ) : null}
                <p className="featureRequestsSignature">
                  Will appear as{' '}
                  <strong>
                    {isAnonymous
                      ? pseudonymInput.trim() || 'Anonymous'
                      : hasAccountName
                        ? localViewerName
                        : accountNameInput.trim() || 'Anonymous'}
                  </strong>
                </p>
              </div>
            ) : (
              <p className="featureRequestsSignature">
                Will be sent privately to the bakery owner from{' '}
                <strong>{localViewerName || 'your account'}</strong>. Not visible publicly.
              </p>
            )}

            {formError ? <p className="featureRequestsError">{formError}</p> : null}

            <div className="featureRequestsComposerActions">
              <BakeryAction onClick={handleCloseForm} variant="secondary" type="button">
                Cancel
              </BakeryAction>
              <BakeryAction
                disabled={isSubmitting || title.trim().length === 0 || body.trim().length === 0}
                variant="primary"
                type="submit"
              >
                {isSubmitting
                  ? 'Submitting...'
                  : visibility === 'public'
                    ? 'Post publicly'
                    : 'Send privately'}
              </BakeryAction>
            </div>
          </BakeryCard>
        ) : null}

        {feedError ? <p className="featureRequestsFeedError">{feedError}</p> : null}

        {requests.length === 0 ? (
          <BakeryCard className="featureRequestsEmpty" radius="lg" spacing="lg" tone="paper">
            <p className="featureRequestsEmptyTitle">No public requests yet.</p>
            <p className="featureRequestsEmptyBody">
              Be the first to suggest something. Public requests show up here so other
              people can rate them five stars and we can prioritize what the community
              actually wants.
            </p>
          </BakeryCard>
        ) : (
          <ul className="featureRequestsList" role="list">
            {requests.map((request) => (
              <FeatureRequestCard
                isAuthenticated={isAuthenticated}
                key={request.id}
                onAccountNameSet={setLocalViewerName}
                onRate={handleRate}
                request={request}
                viewerName={localViewerName}
              />
            ))}
          </ul>
        )}

        {hasMore ? (
          <div className="featureRequestsLoadMoreWrap">
            <BakeryAction
              disabled={isLoadingMore}
              onClick={() => void loadMore()}
              variant="secondary"
            >
              {isLoadingMore ? 'Loading more requests...' : 'Show more requests'}
            </BakeryAction>
          </div>
        ) : null}
      </BakeryPageShell>
    </div>
  )
}

type CardProps = {
  isAuthenticated: boolean
  onAccountNameSet: (name: string) => void
  onRate: (request: FeatureRequestPublic, value: number) => void
  request: FeatureRequestPublic
  viewerName: string | null
}

function FeatureRequestCard({
  isAuthenticated,
  onAccountNameSet,
  onRate,
  request,
  viewerName,
}: CardProps) {
  const router = useRouter()
  const hasAccountName = Boolean(viewerName)
  const [comments, setComments] = useState<FeatureRequestCommentPublic[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [commentAnonymous, setCommentAnonymous] = useState(false)
  const [commentPseudonym, setCommentPseudonym] = useState('')
  const [commentAccountName, setCommentAccountName] = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const loadComments = useCallback(async () => {
    if (commentsLoaded) return
    try {
      const res = await fetch(`/api/feature-requests/${request.id}/comments`, {
        cache: 'no-store',
      })
      const json = (await res.json()) as
        | { comments: FeatureRequestCommentPublic[]; success: true }
        | { error: string; success: false }
      if (!json.success) throw new Error(json.error)
      setComments(json.comments)
      setCommentsLoaded(true)
    } catch (error) {
      console.error(error)
    }
  }, [commentsLoaded, request.id])

  const handleToggleComments = () => {
    setCommentsExpanded((current) => {
      const next = !current
      if (next) void loadComments()
      return next
    })
  }

  const handlePostComment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAuthenticated) {
      router.push(
        `${customerLoginHref}&redirect=${encodeURIComponent('/feature-requests')}&warning=${encodeURIComponent(
          'Log in to comment on a request.',
        )}`,
      )
      return
    }
    const trimmed = commentBody.trim()
    const trimmedPseudonym = commentPseudonym.trim()
    const trimmedAccountName = commentAccountName.trim()

    if (!trimmed) {
      setCommentError('Write a few words first.')
      return
    }
    if (!commentAnonymous && !hasAccountName && !trimmedAccountName) {
      setCommentError(
        'Pick a display name to show on your reply (will be saved to your account), or check "Reply anonymously".',
      )
      return
    }

    setIsPostingComment(true)
    setCommentError(null)
    try {
      const res = await fetch(`/api/feature-requests/${request.id}/comments`, {
        body: JSON.stringify({
          body: trimmed,
          customerName: !commentAnonymous && !hasAccountName ? trimmedAccountName : null,
          displayMode: commentAnonymous ? 'anonymous' : 'self',
          pseudonym: commentAnonymous ? trimmedPseudonym || null : null,
        }),
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const json = (await res.json()) as
        | { comment: FeatureRequestCommentPublic; success: true }
        | { error: string; success: false }
      if (!json.success) throw new Error(json.error)
      setComments((prev) => [...prev, json.comment])
      if (!commentAnonymous && !hasAccountName && trimmedAccountName) {
        onAccountNameSet(trimmedAccountName)
      }
      setCommentBody('')
      setCommentAnonymous(false)
      setCommentPseudonym('')
      setCommentAccountName('')
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Could not post comment.')
    } finally {
      setIsPostingComment(false)
    }
  }

  const displayedRating = hoverRating ?? request.myRating ?? Math.round(request.averageRating)

  return (
    <li className="featureRequestsItem">
      <article className="featureRequestsCard">
        <header className="featureRequestsCardHead">
          <div className="featureRequestsCardHeadCopy">
            <h3 className="featureRequestsCardTitle">{request.title}</h3>
            <p className="featureRequestsCardMeta">
              <span className="featureRequestsCardAuthor">{request.displayName}</span>
              <span className="featureRequestsCardDot" aria-hidden="true">
                ·
              </span>
              <time dateTime={request.createdAt}>{formatDate(request.createdAt)}</time>
            </p>
          </div>
          <div className="featureRequestsCardRating" aria-label="Rate this request">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= (displayedRating || 0)
              return (
                <button
                  aria-label={`${star} star${star === 1 ? '' : 's'}`}
                  className={cn(
                    'featureRequestsStar',
                    filled && 'is-filled',
                    request.myRating === star && 'is-mine',
                  )}
                  key={star}
                  onClick={() => onRate(request, star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  type="button"
                >
                  <Star aria-hidden="true" />
                </button>
              )
            })}
            <span className="featureRequestsRatingMeta">
              {request.ratingCount > 0
                ? `${request.averageRating.toFixed(1)} · ${request.ratingCount}`
                : 'No ratings yet'}
            </span>
          </div>
        </header>

        <p className="featureRequestsCardBody">{request.body}</p>

        <footer className="featureRequestsCardFooter">
          <button
            aria-expanded={commentsExpanded}
            className="featureRequestsCommentToggle"
            onClick={handleToggleComments}
            type="button"
          >
            <MessageSquare aria-hidden="true" />
            <span>
              {request.commentCount === 0
                ? commentsExpanded
                  ? 'Hide replies'
                  : 'Add reply'
                : commentsExpanded
                  ? `Hide ${request.commentCount} repl${request.commentCount === 1 ? 'y' : 'ies'}`
                  : `Show ${request.commentCount} repl${request.commentCount === 1 ? 'y' : 'ies'}`}
            </span>
          </button>
        </footer>

        {commentsExpanded ? (
          <div className="featureRequestsComments">
            <ul className="featureRequestsCommentsList" role="list">
              {comments.length === 0 ? (
                <li className="featureRequestsCommentsEmpty">No replies yet — be the first.</li>
              ) : (
                comments.map((comment) => (
                  <li className="featureRequestsComment" key={comment.id}>
                    <p className="featureRequestsCommentMeta">
                      <span className="featureRequestsCommentAuthor">{comment.displayName}</span>
                      <span className="featureRequestsCardDot" aria-hidden="true">
                        ·
                      </span>
                      <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                    </p>
                    <p className="featureRequestsCommentBody">{comment.body}</p>
                  </li>
                ))
              )}
            </ul>

            {isAuthenticated ? (
              <form className="featureRequestsCommentForm" onSubmit={handlePostComment}>
                <textarea
                  aria-label="Reply"
                  className="featureRequestsCommentInput"
                  maxLength={COMMENT_MAX}
                  onChange={(event) => setCommentBody(event.target.value)}
                  placeholder="Write a reply…"
                  rows={2}
                  value={commentBody}
                />
                <div className="featureRequestsCommentFormRow">
                  <BakeryCheckbox
                    checked={commentAnonymous}
                    onChange={(event) => setCommentAnonymous(event.target.checked)}
                    size="sm"
                  >
                    Reply anonymously
                  </BakeryCheckbox>
                  {commentAnonymous ? (
                    <input
                      aria-label="Comment pseudonym"
                      className="featureRequestsName featureRequestsName--inline"
                      maxLength={PSEUDONYM_MAX}
                      onChange={(event) => setCommentPseudonym(event.target.value)}
                      placeholder="Pseudonym"
                      type="text"
                      value={commentPseudonym}
                    />
                  ) : !hasAccountName ? (
                    <input
                      aria-label="Display name"
                      className="featureRequestsName featureRequestsName--inline"
                      maxLength={80}
                      onChange={(event) => setCommentAccountName(event.target.value)}
                      placeholder="Your display name (saves to account)"
                      type="text"
                      value={commentAccountName}
                    />
                  ) : null}
                </div>
                {commentError ? (
                  <p className="featureRequestsError">{commentError}</p>
                ) : null}
                <div className="featureRequestsCommentFormActions">
                  <BakeryAction
                    disabled={isPostingComment || commentBody.trim().length === 0}
                    type="submit"
                    variant="primary"
                  >
                    {isPostingComment ? 'Posting...' : 'Post reply'}
                  </BakeryAction>
                </div>
              </form>
            ) : (
              <p className="featureRequestsCommentsEmpty">
                <Link
                  href={`${customerLoginHref}&redirect=${encodeURIComponent('/feature-requests')}`}
                >
                  Log in
                </Link>{' '}
                to reply.
              </p>
            )}
          </div>
        ) : null}
      </article>
    </li>
  )
}
