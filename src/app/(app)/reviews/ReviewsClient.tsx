'use client'

import { FlowerSprite } from '@/components/flowers/FlowerSprite'
import { RichText } from '@/components/RichText'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import { BakeryAction, BakeryCard, BakeryPageShell, BakeryPressable } from '@/design-system/bakery'
import type { PublicReview, ReviewsPageData } from '@/features/reviews/types'
import {
  AtSign,
  ChevronDown,
  ChevronUp,
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

import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'

type Props = {
  initialData: ReviewsPageData
  initialSceneryTone?: MenuSceneryTone
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

export function ReviewsClient({ initialData, initialSceneryTone = 'dawn' }: Props) {
  const router = useRouter()
  const [notice, setNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isPageRefreshing, startPageRefresh] = useTransition()
  const [heroSceneryTone, setHeroSceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)

  useEffect(() => {
    for (const sceneryTone of menuSceneryTones) {
      preloadSceneryAssets(sceneryTone)
    }
  }, [])

  const handleSelectHeroScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (nextSceneryTone === heroSceneryTone) return

    setIsSceneryPickerOpen(false)
    startTransition(() => {
      setHeroSceneryTone(nextSceneryTone)
    })
    preloadSceneryAssets(nextSceneryTone)
  }

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setNotice(null)

    const form = event.currentTarget
    const formData = new FormData(form)

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
      setNotice('Review submitted. It is now public, and the owner can unpublish it if needed.')
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
          onSelectScenery={handleSelectHeroScenery}
          onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
          sceneryTone={heroSceneryTone}
          summary="This page is experimental."
          title="Reviews"
        />
      </div>
      <BakeryPageShell as="section" className="reviewsShell" spacing="none" width="container">
        <section className="reviewsPrinciples" aria-label="Review policy">
          <BakeryCard as="article" className="reviewsPrincipleCard" spacing="sm">
            <MessageSquareReply aria-hidden="true" className="h-5 w-5" />
            <h2>We respond in public</h2>
            <p>When a review exposes a real problem, the response and follow-up stay visible.</p>
          </BakeryCard>
          <BakeryCard as="article" className="reviewsPrincipleCard" spacing="sm">
            <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
            <h2>We track action</h2>
            <p>Changes are folded into the bakery reply so the response stays easy to read.</p>
          </BakeryCard>
          <BakeryCard as="article" className="reviewsPrincipleCard" spacing="sm">
            <Scale aria-hidden="true" className="h-5 w-5" />
            <h2>We keep boundaries</h2>
            <p>Unfair, abusive, or inaccurate claims can be declined or answered with context.</p>
          </BakeryCard>
        </section>

        <BakeryCard
          as="section"
          className="reviewDiscountPolicy"
          aria-label="Review discount policy"
          spacing="sm"
          tone="wash"
        >
          <div>
            <p className="reviewsEyebrow">Review thank-you</p>
            <h2>Leave a review and get 20% off a future order.</h2>
          </div>
          <p>
            The secure version should attach the reward to a logged-in customer account after a
            public review is received. To prevent abuse, the coupon should be single-use, limited to
            one reward per week, and capped at 8 total review rewards per account.
          </p>
        </BakeryCard>

        <section className="reviewsLayout">
          <div className="reviewsList" aria-label="Published reviews">
            {initialData.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      </BakeryPageShell>

      {notice ? <p className="reviewsFloatingNotice">{notice}</p> : null}
      {isPageRefreshing ? (
        <p aria-live="polite" className="reviewsRoutePending">
          Refreshing reviews
        </p>
      ) : null}

      <BakeryAction
        className="reviewsComposeButton"
        onClick={() => setIsComposerOpen(true)}
        size="lg"
        type="button"
        variant="primary"
      >
        <PenLine aria-hidden="true" className="h-5 w-5" />
        Compose
      </BakeryAction>

      {isComposerOpen ? (
        <div className="reviewsComposerOverlay" role="presentation">
          <BakeryCard
            aria-label="Share a review"
            aria-modal="true"
            className="reviewsComposerPanel"
            radius="lg"
            role="dialog"
            spacing="none"
            tone="transparent"
          >
            <BakeryPressable
              aria-label="Close review form"
              className="reviewsComposerClose"
              onClick={() => setIsComposerOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </BakeryPressable>
            <ReviewForm isSubmitting={isSubmitting} notice={notice} onSubmit={submitReview} />
          </BakeryCard>
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
  const [isContactOpen, setIsContactOpen] = useState(false)

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
        Name <span>optional</span>
        <input name="customerName" placeholder="Bakery guest" />
      </label>

      <label>
        Title <span>required</span>
        <input name="title" placeholder="Short summary" required />
      </label>

      <label>
        Review <span>required</span>
        <textarea name="body" placeholder="Tell us what happened." required rows={5} />
      </label>

      <div className="reviewsContactDisclosure">
        <BakeryPressable
          aria-controls="reviews-contact-fields"
          aria-expanded={isContactOpen}
          className="reviewsContactToggle"
          onClick={() => setIsContactOpen((current) => !current)}
          type="button"
        >
          <span>
            <AtSign aria-hidden="true" className="h-4 w-4" />
            Attach socials/contact
          </span>
          {isContactOpen ? (
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          )}
        </BakeryPressable>

        {isContactOpen ? (
          <div className="reviewsContactFields" id="reviews-contact-fields">
            <label>
              Email <span>optional, private</span>
              <input name="customerEmail" placeholder="you@example.com" type="email" />
            </label>
            <div className="reviewsContactField">
              <label htmlFor="review-instagram">
                Instagram <span>optional</span>
              </label>
              <input id="review-instagram" name="instagramHandle" placeholder="@yourhandle" />
              <label className="reviewsVisibilityToggle" htmlFor="review-instagram-public">
                <input id="review-instagram-public" name="instagramHandlePublic" type="checkbox" />
                <span>Show on public review</span>
              </label>
            </div>
            <div className="reviewsContactField">
              <label htmlFor="review-linkedin">
                LinkedIn <span>optional</span>
              </label>
              <input
                id="review-linkedin"
                name="linkedinUrl"
                placeholder="https://www.linkedin.com/in/..."
                type="url"
              />
              <label className="reviewsVisibilityToggle" htmlFor="review-linkedin-public">
                <input id="review-linkedin-public" name="linkedinUrlPublic" type="checkbox" />
                <span>Show on public review</span>
              </label>
            </div>
            <div className="reviewsContactField">
              <label htmlFor="review-discord">
                Discord <span>optional</span>
              </label>
              <input id="review-discord" name="discordUsername" placeholder="yourname" />
              <label className="reviewsVisibilityToggle" htmlFor="review-discord-public">
                <input id="review-discord-public" name="discordUsernamePublic" type="checkbox" />
                <span>Show on public review</span>
              </label>
            </div>
            <div className="reviewsContactField">
              <label htmlFor="review-league">
                League username <span>optional</span>
              </label>
              <input id="review-league" name="leagueUsername" placeholder="Summoner or Riot ID" />
              <label className="reviewsVisibilityToggle" htmlFor="review-league-public">
                <input id="review-league-public" name="leagueUsernamePublic" type="checkbox" />
                <span>Show on public review</span>
              </label>
            </div>
            <div className="reviewsContactField">
              <label htmlFor="review-nintendo">
                Nintendo ID <span>optional</span>
              </label>
              <input
                id="review-nintendo"
                name="nintendoId"
                placeholder="Nintendo ID or friend code"
              />
              <label className="reviewsVisibilityToggle" htmlFor="review-nintendo-public">
                <input id="review-nintendo-public" name="nintendoIdPublic" type="checkbox" />
                <span>Show on public review</span>
              </label>
            </div>
            <div className="reviewsContactField">
              <label htmlFor="review-ptcg">
                PTCG ID <span>optional</span>
              </label>
              <input id="review-ptcg" name="ptcgId" placeholder="PTCG ID" />
              <label className="reviewsVisibilityToggle" htmlFor="review-ptcg-public">
                <input id="review-ptcg-public" name="ptcgIdPublic" type="checkbox" />
                <span>Show on public review</span>
              </label>
            </div>
            <div className="reviewsContactField">
              <label htmlFor="review-other-contact">
                Other contact <span>optional</span>
              </label>
              <textarea
                id="review-other-contact"
                name="otherContact"
                placeholder="Anything else the bakery can use to reach you."
                rows={3}
              />
              <label className="reviewsVisibilityToggle" htmlFor="review-other-contact-public">
                <input id="review-other-contact-public" name="otherContactPublic" type="checkbox" />
                <span>Show on public review</span>
              </label>
            </div>
          </div>
        ) : null}
      </div>

      {notice ? <p className="reviewsNotice">{notice}</p> : null}

      <BakeryAction
        className="reviewsSubmitButton"
        disabled={isSubmitting}
        size="sm"
        type="submit"
        variant="primary"
      >
        <Send aria-hidden="true" className="h-4 w-4" />
        {isSubmitting ? 'Submitting' : 'Submit review'}
      </BakeryAction>
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
    <article
      className="reviewThread"
      data-expanded={isExpanded}
      data-status={review.responseStatus}
    >
      <BakeryCard as="section" className="reviewCard" spacing="sm">
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

        {review.publicSocials.length ? (
          <div className="reviewPublicSocials" aria-label="Public reviewer links">
            {review.publicSocials.map((social) =>
              social.href ? (
                <a
                  className="reviewPublicSocial"
                  href={social.href}
                  key={`${social.label}-${social.value}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <AtSign aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>{social.label}</span>
                  <strong>{social.value}</strong>
                </a>
              ) : (
                <span className="reviewPublicSocial" key={`${social.label}-${social.value}`}>
                  <AtSign aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>{social.label}</span>
                  <strong>{social.value}</strong>
                </span>
              ),
            )}
          </div>
        ) : null}

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
      </BakeryCard>

      {hasResponse ? (
        <BakeryCard
          as="section"
          className="reviewResponse"
          aria-label="Bakery reply"
          spacing="sm"
          tone="wash"
        >
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
        </BakeryCard>
      ) : null}

      {hasHiddenDetails ? (
        <BakeryAction
          className="reviewReadToggle"
          onClick={() => setIsExpanded((current) => !current)}
          size="sm"
          type="button"
          variant="secondary"
        >
          {isExpanded ? 'Hide photos' : 'Show photos'}
        </BakeryAction>
      ) : null}
    </article>
  )
}
