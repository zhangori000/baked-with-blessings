'use client'

import { FlowerSprite } from '@/components/flowers/FlowerSprite'
import { RichText } from '@/components/RichText'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import type { PublicReview, ReviewsPageData } from '@/features/reviews/types'
import {
  ClipboardCheck,
  Heart,
  Lightbulb,
  MessageSquareReply,
  PenLine,
  Scale,
  Send,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { startTransition, useEffect, useState, useTransition } from 'react'

import { MenuHero, menuSceneryTones, preloadSceneryAssets } from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'

type Props = {
  initialData: ReviewsPageData
}

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const responseFlowerSources = [
  '/flowers/daisy-large.svg',
  '/flowers/menu-nav-flower.svg',
  '/flowers/moonlit-purple-flower.svg',
  '/flowers/pink-daisy-wildflower.svg',
  '/flowers/poppy.svg',
  '/flowers/rose.svg',
  '/flowers/sunflower.svg',
  '/flowers/tulip.svg',
  '/flowers/white-wildflower.svg',
]

const getResponseFlowerSrc = (review: PublicReview) => {
  const seed = Array.from(review.id || review.title).reduce((total, character) => {
    return total + character.charCodeAt(0)
  }, 0)

  return responseFlowerSources[seed % responseFlowerSources.length] || responseFlowerSources[0]
}

export function ReviewsClient({ initialData }: Props) {
  const router = useRouter()
  const [notice, setNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isPageRefreshing, startPageRefresh] = useTransition()
  const [heroSceneryTone, setHeroSceneryTone] = usePersistentMenuSceneTone('classic')
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)

  useEffect(() => {
    for (const sceneryTone of menuSceneryTones) {
      preloadSceneryAssets(sceneryTone)
    }
  }, [])

  const handleSelectHeroScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (nextSceneryTone === heroSceneryTone) return

    preloadSceneryAssets(nextSceneryTone)
    startTransition(() => {
      setHeroSceneryTone(nextSceneryTone)
    })
    setIsSceneryPickerOpen(false)
  }

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setNotice(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set('rating', '5')

    try {
      const response = await fetch('/api/reviews', {
        body: formData,
        credentials: 'include',
        method: 'POST',
      })
      const json = (await response.json()) as { error?: string; success?: boolean }

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Unable to submit review.')
      }

      form.reset()
      setNotice('Review submitted. It will appear publicly after review.')
      setIsComposerOpen(false)
      startPageRefresh(() => {
        router.refresh()
      })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to submit review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      aria-busy={isSubmitting || isPageRefreshing}
      className="reviewsPage"
      style={{ fontFamily: 'var(--font-rounded-body)' }}
    >
      <div className="cateringMenuExperience reviewsHeroExperience">
        <MenuHero
          eyebrow="Review transparency"
          isSceneryPickerOpen={isSceneryPickerOpen}
          isSceneChanging={false}
          key={heroSceneryTone}
          onSelectScenery={handleSelectHeroScenery}
          onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
          sceneryTone={heroSceneryTone}
          summary="Leave a review. We publish real replies, show what changed, and keep boundaries when a claim needs context."
          title="Reviews"
        />
      </div>
      <section className="reviewsShell container">
        <section className="reviewsPrinciples" aria-label="Review policy">
          <article>
            <MessageSquareReply aria-hidden="true" className="h-5 w-5" />
            <h2>We respond in public</h2>
            <p>When a review exposes a real problem, the response and follow-up stay visible.</p>
          </article>
          <article>
            <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
            <h2>We track action</h2>
            <p>Changes are folded into the bakery reply so the response stays easy to read.</p>
          </article>
          <article>
            <Scale aria-hidden="true" className="h-5 w-5" />
            <h2>We keep boundaries</h2>
            <p>Unfair, abusive, or inaccurate claims can be declined or answered with context.</p>
          </article>
        </section>

        <section className="reviewDiscountPolicy" aria-label="Review discount policy">
          <div>
            <p className="reviewsEyebrow">Review thank-you</p>
            <h2>Leave a review and get 20% off a future order.</h2>
          </div>
          <p>
            The secure version should attach the reward to a logged-in customer account after a
            moderated review is accepted. To prevent abuse, the coupon should be single-use, limited
            to one reward per week, and capped at 8 total review rewards per account.
          </p>
        </section>

        <section className="reviewsLayout">
          <div className="reviewsList" aria-label="Published reviews">
            {initialData.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      </section>

      {notice ? <p className="reviewsFloatingNotice">{notice}</p> : null}
      {isPageRefreshing ? (
        <p aria-live="polite" className="reviewsRoutePending">
          Refreshing reviews
        </p>
      ) : null}

      <button
        className="reviewsComposeButton"
        onClick={() => setIsComposerOpen(true)}
        type="button"
      >
        <PenLine aria-hidden="true" className="h-5 w-5" />
        Compose
      </button>

      {isComposerOpen ? (
        <div className="reviewsComposerOverlay" role="presentation">
          <div
            aria-label="Share a review"
            aria-modal="true"
            className="reviewsComposerPanel"
            role="dialog"
          >
            <button
              aria-label="Close review form"
              className="reviewsComposerClose"
              onClick={() => setIsComposerOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <ReviewForm isSubmitting={isSubmitting} notice={notice} onSubmit={submitReview} />
          </div>
        </div>
      ) : null}
    </main>
  )
}

function ReviewForm({
  isSubmitting,
  notice,
  onSubmit,
}: {
  isSubmitting: boolean
  notice: string | null
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="reviewsForm" data-submitting={isSubmitting} onSubmit={onSubmit}>
      <div className="reviewsFormGarden" aria-hidden="true">
        <span className="reviewsFormGrass" />
        <FlowerSprite
          asset="/flowers/menu-nav-flower.svg"
          className="reviewsLetterFlower reviewsLetterFlower-left"
          living
        />
        <FlowerSprite
          asset="/flowers/menu-nav-flower.svg"
          className="reviewsLetterFlower reviewsLetterFlower-right"
          living
        />
      </div>

      <div className="reviewsFormIntro">
        <p className="reviewsEyebrow">Share a review</p>
        <h2>Write a note to the bakery.</h2>
      </div>

      <fieldset className="reviewsToneField">
        <legend>Choose one</legend>
        <div className="reviewsToneOptions">
          <label>
            <input defaultChecked name="reviewTone" type="radio" value="loved_it" />
            <span>
              <Heart aria-hidden="true" className="h-4 w-4" />
              Loved it
            </span>
          </label>
          <label>
            <input name="reviewTone" type="radio" value="suggestion" />
            <span>
              <Lightbulb aria-hidden="true" className="h-4 w-4" />I have a suggestion
            </span>
          </label>
        </div>
      </fieldset>

      <label>
        Title <span>required</span>
        <input name="title" placeholder="Short summary" required />
      </label>

      <label>
        Review <span>required</span>
        <textarea
          name="body"
          placeholder="Tell us what happened."
          required
          rows={5}
        />
      </label>

      {notice ? <p className="reviewsNotice">{notice}</p> : null}

      <button className="reviewsSubmitButton" disabled={isSubmitting} type="submit">
        <Send aria-hidden="true" className="h-4 w-4" />
        {isSubmitting ? 'Submitting' : 'Submit review'}
      </button>
    </form>
  )
}

function ReviewCard({ review }: { review: PublicReview }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasResponse = Boolean(review.businessResponse) || Boolean(review.businessResponseRichText)
  const hasHiddenDetails = review.photos.length > 0
  const toneLabel = review.reviewTone === 'suggestion' ? 'I have a suggestion' : 'Loved it'
  const responseFlowerSrc = getResponseFlowerSrc(review)

  return (
    <article className="reviewThread" data-expanded={isExpanded} data-status={review.responseStatus}>
      <section className="reviewCard">
        <div className="reviewCardTop">
          <div>
            <p className="reviewMeta">
              <span>{toneLabel}</span>
              {review.customerName}
              <span>{formatDate(review.createdAt)}</span>
            </p>
            <h2>{review.title}</h2>
          </div>
        </div>

        <p className="reviewBody">{review.body}</p>

        {isExpanded && review.photos.length ? (
          <div className="reviewPhotos">
            {review.photos.map((photo) => (
              <div className="reviewPhoto" key={photo.id || photo.url}>
                <Image
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 760px) 45vw, 220px"
                  src={photo.url}
                />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {hasResponse ? (
        <section className="reviewResponse" aria-label="Bakery reply">
          <div className="reviewResponseContent">
            <p className="reviewResponseLabel">Baked with Blessings replied</p>
            {review.businessResponseRichText ? (
              <RichText
                className="reviewResponseRichText"
                data={review.businessResponseRichText}
                enableGutter={false}
                enableProse={false}
              />
            ) : review.businessResponse ? (
              <p>{review.businessResponse}</p>
            ) : null}
          </div>
          <Image
            alt=""
            aria-hidden="true"
            className="reviewResponseFlower"
            height={64}
            src={responseFlowerSrc}
            unoptimized
            width={64}
          />
        </section>
      ) : null}

      {hasHiddenDetails ? (
        <button
          className="reviewReadToggle"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          {isExpanded ? 'Hide photos' : 'Show photos'}
        </button>
      ) : null}
    </article>
  )
}
