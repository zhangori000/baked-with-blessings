'use client'

import type { SceneTone } from '@/components/scenery/menuHeroScenery'
import { buildCloudSpawnPosition } from '@/components/scenery/cloudSpawnPlacement'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import { RichText } from '@/components/RichText'
import { BakeryAction, BakeryCard, BakeryPressable } from '@/design-system/bakery'
import { menuHref } from '@/utilities/routes'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import React, { useState } from 'react'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { toast } from 'sonner'

import type { CookiePosterAsset } from './cookiePosterData'
import { CookieSheepRig } from './cookie-sheep-rig'

type PosterCloud = {
  delay: string
  duration: string
  style: React.CSSProperties
}

type PosterSceneTone = SceneTone

type SpawnedPosterCloud = {
  delay: string
  duration: string
  id: number
  left: string
  src: string
  top: string
  width: string
}

type SpawnedPosterFlower = {
  bob: string
  bottom: string
  delay: string
  duration: string
  id: number
  left: string
  scale: number
  tilt: string
}

type CookiePosterSketchFrameProps = {
  children: React.ReactNode
  slug: string
  style?: React.CSSProperties
}

const posterClouds: PosterCloud[] = [
  {
    delay: '0s',
    duration: '18s',
    style: {
      opacity: 0.96,
      top: '10%',
      width: '5.5rem',
    },
  },
  {
    delay: '-6s',
    duration: '18s',
    style: {
      opacity: 0.9,
      top: '22%',
      width: '4.9rem',
    },
  },
  {
    delay: '-12s',
    duration: '18s',
    style: {
      opacity: 0.93,
      top: '14%',
      width: '5.7rem',
    },
  },
]

const posterSceneryTones: PosterSceneTone[] = [
  'dawn',
  'moonlit',
  'classic',
  'blossom',
  'fairy-castle',
]
const posterSkyByScenery: Record<PosterSceneTone, string> = {
  dawn: '/sceneries/brown-anime-gradient-sky.svg',
  'under-tree': '/sceneries/girl-under-tree-sky.svg',
  moonlit: '/sceneries/moonlit-purple-sky.svg',
  classic: '/sceneries/classic-sky.svg',
  blossom: '/sceneries/blossom-breeze-sky.svg',
  'fairy-castle': '/sceneries/fairy-castle.svg',
}
const posterMeadowByScenery: Record<PosterSceneTone, string> = {
  dawn: '/sceneries/brown-anime-rolling-meadow.svg',
  'under-tree': '/sceneries/girl-under-tree-meadow.svg',
  moonlit: '/sceneries/moonlit-purple-meadow.svg',
  classic: '/sceneries/classic-meadow.svg',
  blossom: '/sceneries/blossom-grass-mound.svg',
  'fairy-castle': '/sceneries/transparent-meadow.svg',
}
const posterButtonAuraByScenery: Record<PosterSceneTone, string> = {
  dawn: 'rgba(255, 214, 101, 0.86)',
  'under-tree': 'rgba(197, 228, 142, 0.84)',
  moonlit: 'rgba(153, 115, 255, 0.9)',
  classic: 'rgba(255, 215, 79, 0.85)',
  blossom: 'rgba(255, 176, 208, 0.92)',
  'fairy-castle': 'rgba(154, 172, 138, 0.9)',
}
const posterCloudAssetsByScenery: Record<PosterSceneTone, readonly string[]> = {
  dawn: ['/clouds/brown-anime-cloud-fluffy.svg', '/clouds/brown-anime-cloud-layered.svg'],
  'under-tree': ['/clouds/three-ball-cloud-wide.svg', '/clouds/three-ball-cloud.svg'],
  moonlit: ['/clouds/moonlit-purple-swoop-cloud.svg', '/clouds/moonlit-purple-upper-cloud.svg'],
  classic: ['/clouds/three-ball-cloud-compact.svg', '/clouds/three-ball-cloud.svg'],
  blossom: ['/clouds/sakura-soft-cloud.svg'],
  'fairy-castle': ['/sceneries/fairy-castle-cloud-puff.svg'],
}

let spawnedPosterCloudID = 0
let spawnedPosterFlowerID = 0

const buildSeededPosterFlowers = (cardIndex: number): SpawnedPosterFlower[] => {
  const leftOffset = (cardIndex % 3) * 2.4

  return [
    {
      bob: '0.18rem',
      bottom: '5%',
      delay: '-0.8s',
      duration: '4.4s',
      id: cardIndex * 10 + 1,
      left: `${12 + leftOffset}%`,
      scale: 0.96,
      tilt: '-2deg',
    },
    {
      bob: '0.22rem',
      bottom: '12%',
      delay: '-2.1s',
      duration: '4.9s',
      id: cardIndex * 10 + 2,
      left: `${84 - leftOffset}%`,
      scale: 1.04,
      tilt: '2deg',
    },
  ]
}

const createSpawnedPosterCloud = (sceneryTone: PosterSceneTone): SpawnedPosterCloud => {
  const assets = posterCloudAssetsByScenery[sceneryTone] ?? posterCloudAssetsByScenery.classic
  const src = assets[Math.floor(Math.random() * assets.length)] ?? assets[0]
  const { left, top } = buildCloudSpawnPosition()

  return {
    delay: `-${(Math.random() * 7).toFixed(2)}s`,
    duration: `${(16 + Math.random() * 8).toFixed(2)}s`,
    id: ++spawnedPosterCloudID,
    left,
    src,
    top,
    width: `${(4.8 + Math.random() * 2.7).toFixed(2)}rem`,
  }
}

const createSpawnedPosterFlower = (): SpawnedPosterFlower => ({
  bob: `${(0.16 + Math.random() * 0.14).toFixed(2)}rem`,
  bottom: `${(4 + Math.random() * 28).toFixed(2)}%`,
  delay: `-${(Math.random() * 4.2).toFixed(2)}s`,
  duration: `${(4.1 + Math.random() * 1.7).toFixed(2)}s`,
  id: ++spawnedPosterFlowerID,
  left: `${(8 + Math.random() * 84).toFixed(2)}%`,
  scale: Number((0.88 + Math.random() * 0.44).toFixed(2)),
  tilt: `${(Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 2.4)}deg`,
})

function CookiePosterRailCard({
  cardIndex,
  poster,
}: {
  cardIndex: number
  poster: CookiePosterAsset
}) {
  const [sceneryTone, setSceneryTone] = usePersistentMenuSceneTone('classic')
  const [isIngredientNoteOpen, setIsIngredientNoteOpen] = useState(false)
  const [spawnedClouds, setSpawnedClouds] = useState<SpawnedPosterCloud[]>([])
  const [spawnedFlowers, setSpawnedFlowers] = useState<SpawnedPosterFlower[]>(
    buildSeededPosterFlowers(cardIndex),
  )
  const isCateringOnly = poster.canBuyIndividually === false
  const posterMenuHref = poster.menuHref ?? menuHref

  const staticCloudAssets =
    posterCloudAssetsByScenery[sceneryTone] ?? posterCloudAssetsByScenery.classic
  const sceneStyle = {
    ['--cookie-bottom' as string]: '2.85rem',
    ['--cookie-size' as string]: 'clamp(14.8rem, 64%, 16.4rem)',
    ['--poster-scene-charge' as string]: posterButtonAuraByScenery[sceneryTone],
  } as React.CSSProperties

  const handleChangeScenery = () => {
    setSceneryTone((current) => {
      const currentIndex = posterSceneryTones.indexOf(current)
      return (
        posterSceneryTones[(currentIndex + 1) % posterSceneryTones.length] ?? posterSceneryTones[0]
      )
    })
    setIsIngredientNoteOpen(false)
    setSpawnedClouds([])
    setSpawnedFlowers(buildSeededPosterFlowers(cardIndex))
  }

  return (
    <article className="group cookiePosterRailItem h-full">
      <BakeryCard
        className="cookiePosterCard relative flex h-full flex-col overflow-hidden"
        radius="md"
        spacing="none"
        tone="transparent"
      >
        <div className="cookiePosterMeta flex justify-between gap-3 px-1">
          <h3 className="cookiePosterTitle min-w-0 flex-1 text-[1.28rem] font-medium leading-[0.96] tracking-[-0.03em] text-[#171510] md:text-[1.38rem]">
            {isCateringOnly ? (
              <Link
                aria-label={`View catering options for ${poster.title} on the menu`}
                className="cookiePosterLockedNameTag"
                href={posterMenuHref}
              >
                <Lock aria-hidden="true" size={14} strokeWidth={2.4} />
                <span>{poster.title}</span>
              </Link>
            ) : (
              <span>{poster.title}</span>
            )}
          </h3>

          <div className="shrink-0">
            <CookiePosterAddToCartButton poster={poster} />
          </div>
        </div>

        {isCateringOnly ? (
          <p className="cookiePosterLockedDescription px-1">
            <span>{poster.lockedLabel ?? 'Catering only this month'}.</span>{' '}
            {poster.lockedDescription ??
              'Available in batches of 10, mini or regular size, on the menu.'}
          </p>
        ) : null}

        <CookiePosterSketchFrame slug={poster.slug} style={sceneStyle}>
          <div className="cookiePosterSceneControls absolute left-3 top-3 z-30 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
            <BakeryAction
              className="cookiePosterSceneButton"
              onClick={handleChangeScenery}
              size="sm"
              type="button"
              variant="secondary"
            >
              Change scenery
            </BakeryAction>
            <BakeryAction
              className="cookiePosterSceneButton"
              onClick={() =>
                setSpawnedClouds((current) => [...current, createSpawnedPosterCloud(sceneryTone)])
              }
              size="sm"
              type="button"
              variant="secondary"
            >
              Spawn cloud
            </BakeryAction>
            <BakeryAction
              className="cookiePosterSceneButton"
              onClick={() =>
                setSpawnedFlowers((current) => [...current, createSpawnedPosterFlower()])
              }
              size="sm"
              type="button"
              variant="secondary"
            >
              Spawn flower
            </BakeryAction>
            <CookiePosterIngredientNote
              className="cookiePosterInfoButton cookiePosterInfoButton--inline hidden md:inline-flex"
              dockClassName="cookiePosterInfoDock cookiePosterInfoDock--inline hidden md:flex"
              isOpen={isIngredientNoteOpen}
              onOpenChange={setIsIngredientNoteOpen}
              poster={poster}
            />
          </div>

          <Image
            alt=""
            aria-hidden="true"
            className="cookiePosterSky absolute inset-0 h-full w-full object-cover"
            fill
            priority
            sizes="21rem"
            src={posterSkyByScenery[sceneryTone]}
            unoptimized
          />

          {posterClouds.map((cloud, index) => (
            <Image
              alt=""
              aria-hidden="true"
              className="cookiePosterSceneCloud"
              height={280}
              key={`${poster.slug}-cloud-${sceneryTone}-${index}`}
              priority
              src={staticCloudAssets[index % staticCloudAssets.length] ?? staticCloudAssets[0]}
              style={
                {
                  ...cloud.style,
                  ['--cloud-delay' as string]: cloud.delay,
                  ['--cloud-duration' as string]: cloud.duration,
                } as React.CSSProperties
              }
              unoptimized
              width={520}
            />
          ))}

          {spawnedClouds.map((cloud) => (
            <Image
              alt=""
              aria-hidden="true"
              className="cookiePosterSceneCloud"
              height={280}
              key={cloud.id}
              priority
              src={cloud.src}
              style={
                {
                  ['--cloud-delay' as string]: cloud.delay,
                  ['--cloud-duration' as string]: cloud.duration,
                  left: cloud.left,
                  top: cloud.top,
                  width: cloud.width,
                } as React.CSSProperties
              }
              unoptimized
              width={520}
            />
          ))}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[54%] bg-gradient-to-b from-[rgba(255,255,255,0.18)] to-transparent" />

          {sceneryTone === 'moonlit' ? <CookiePosterMoonlitLinework /> : null}

          <Image
            alt=""
            aria-hidden="true"
            className="cookiePosterMeadow absolute inset-x-0 bottom-0 z-[2] h-full w-full object-cover object-bottom"
            fill
            priority
            sizes="21rem"
            src={posterMeadowByScenery[sceneryTone]}
            unoptimized
          />

          {spawnedFlowers.map((flower) => (
            <Image
              alt=""
              aria-hidden="true"
              className="cookiePosterSceneFlower"
              height={120}
              key={flower.id}
              priority
              src="/flowers/menu-nav-flower.svg"
              style={
                {
                  ['--poster-flower-bob' as string]: flower.bob,
                  ['--poster-flower-delay' as string]: flower.delay,
                  ['--poster-flower-duration' as string]: flower.duration,
                  ['--poster-flower-scale' as string]: `${flower.scale}`,
                  ['--poster-flower-tilt' as string]: flower.tilt,
                  bottom: flower.bottom,
                  left: flower.left,
                } as React.CSSProperties
              }
              unoptimized
              width={120}
            />
          ))}

          <CookieSheepRig
            bodyFallbackSrc={poster.bodyFallbackSrc}
            image={poster.image}
            title={poster.title}
          />

          <CookiePosterIngredientNote
            className="cookiePosterInfoButton md:hidden"
            dockClassName="cookiePosterInfoDock absolute bottom-3 right-3 z-30 md:hidden"
            isOpen={isIngredientNoteOpen}
            onOpenChange={setIsIngredientNoteOpen}
            poster={poster}
          />
        </CookiePosterSketchFrame>
      </BakeryCard>
    </article>
  )
}

function CookiePosterMoonlitLinework() {
  return (
    <div aria-hidden="true" className="cookiePosterMoonlitLinework absolute inset-0 z-[4]">
      <div className="cookiePosterMoonlitRipple cookiePosterMoonlitRipple--one" />
      <div className="cookiePosterMoonlitRipple cookiePosterMoonlitRipple--two" />
      <div className="cookiePosterMoonlitRipple cookiePosterMoonlitRipple--three" />
      <div className="cookiePosterMoonlitSpark cookiePosterMoonlitSpark--one" />
      <div className="cookiePosterMoonlitSpark cookiePosterMoonlitSpark--two" />
      <div className="cookiePosterMoonlitSpark cookiePosterMoonlitSpark--three" />
      <div className="cookiePosterMoonlitReeds" />
    </div>
  )
}

function CookiePosterIngredientNote({
  className,
  dockClassName,
  isOpen,
  onOpenChange,
  poster,
}: {
  className?: string
  dockClassName?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  poster: CookiePosterAsset
}) {
  const dialogId = `${poster.slug}-ingredient-note`
  const hasInfoBody = Boolean(poster.receiptBody?.root)

  if (!hasInfoBody) {
    return null
  }

  return (
    <>
      <div className={dockClassName ?? 'cookiePosterInfoDock absolute bottom-3 right-3 z-30'}>
        <BakeryPressable
          aria-controls={dialogId}
          aria-expanded={isOpen}
          aria-label={`Show ingredients for ${poster.title}`}
          className={className ?? 'cookiePosterInfoButton'}
          onClick={() => onOpenChange(!isOpen)}
          type="button"
        >
          <span className="cookiePosterInfoButtonIcon" aria-hidden="true">
            <Image
              alt=""
              className="cookiePosterInfoButtonFlower"
              height={52}
              src="/flowers/menu-nav-flower.svg"
              unoptimized
              width={64}
            />
          </span>
          <span>{poster.infoButtonLabel}</span>
        </BakeryPressable>
      </div>

      {isOpen ? (
        <BakeryCard
          aria-label={`${poster.title} ingredients`}
          className="cookiePosterIngredientCard absolute bottom-14 right-3 z-40 w-[min(13.8rem,calc(100%-1.5rem))]"
          id={dialogId}
          radius="lg"
          role="dialog"
          spacing="none"
          tone="transparent"
        >
          <BakeryPressable
            aria-label={`Close ingredients for ${poster.title}`}
            className="cookiePosterIngredientClose"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            x
          </BakeryPressable>

          <div className="cookiePosterIngredientPin" aria-hidden="true" />

          <RichText
            className="cookiePosterInfoRichText"
            data={poster.receiptBody as SerializedEditorState}
            enableGutter={false}
            enableProse={false}
          />
        </BakeryCard>
      ) : null}
    </>
  )
}

function CookiePosterSketchFrame({ children, slug, style }: CookiePosterSketchFrameProps) {
  return (
    <div
      className="cookiePosterSketchFrame cookiePosterScene relative h-[21rem] w-full overflow-hidden bg-[#dbeeff] md:h-[21.75rem]"
      data-poster-slug={slug}
      style={style}
    >
      <div className="relative h-full w-full">{children}</div>
    </div>
  )
}

function CookiePosterAddToCartButton({ poster }: { poster: CookiePosterAsset }) {
  const { addItem, isLoading } = useCart()
  const isCateringOnly = poster.canBuyIndividually === false
  const canAdd = typeof poster.productId === 'number'

  if (isCateringOnly) {
    return (
      <BakeryAction
        aria-label={`View catering options for ${poster.title} on the menu`}
        className="cookiePosterActionButton cookiePosterActionButton--locked inline-flex cursor-pointer items-center justify-center text-center text-[0.92rem] font-medium tracking-[-0.01em] transition duration-200"
        href={poster.menuHref ?? menuHref}
        size="sm"
        start={<Lock aria-hidden="true" size={14} strokeWidth={2.4} />}
        variant="secondary"
      >
        {poster.menuLinkLabel ?? 'Menu'}
      </BakeryAction>
    )
  }

  return (
    <BakeryAction
      aria-label={`Add ${poster.title} to cart`}
      className="cookiePosterActionButton inline-flex cursor-pointer items-center justify-center text-center text-[0.92rem] font-medium tracking-[-0.01em] text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={isLoading}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()

        if (!canAdd) {
          toast.info('These cookie poster cards are not linked to live catalog items yet.')
          return
        }

        addItem({
          product: poster.productId!,
        }).then(() => {
          toast.success(`${poster.title} added to cart.`)
        })
      }}
      size="sm"
      type="button"
      variant="primary"
    >
      Add to cart
    </BakeryAction>
  )
}

function CookieCateringNotice() {
  return (
    <BakeryCard
      aria-label="Cookie catering notice"
      as="section"
      className="cookieCateringNotice relative overflow-hidden rounded-[1.8rem] border px-5 py-6 md:px-8 md:py-8"
      radius="xl"
      spacing="none"
      style={{
        background:
          'linear-gradient(180deg, rgba(255, 250, 242, 0.97), rgba(251, 246, 235, 0.97)), rgba(255, 250, 242, 0.97)',
        borderColor: 'rgba(91, 70, 37, 0.14)',
      }}
      tone="transparent"
    >
      <div className="cookieCateringNoticeGlow" />

      <div className="relative z-[1] grid gap-6 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:items-end md:gap-12">
        <div className="min-w-0">
          <p className="text-[0.74rem] font-medium uppercase tracking-[0.18em] text-[rgba(23,21,16,0.56)]">
            Cookie Catering
          </p>
          <h2 className="cookieCateringNoticeHeading mt-3 max-w-[11ch] text-[2rem] leading-[0.95] tracking-[-0.045em] text-[#171510] md:text-[2.65rem]">
            Catering orders can include past cookie flavors.
          </h2>
        </div>

        <div className="min-w-0 md:pb-2">
          <p className="cookieCateringNoticeBody text-[1.05rem] leading-8 text-[rgba(23,21,16,0.82)] md:text-[1.12rem]">
            If you are ordering for catering, you are not limited to only the cookies shown in the
            current lineup. Larger catering batches can reopen previous flavors because they are
            easier to plan and bake well than one-off custom cookie requests.
          </p>
          <div className="mt-7">
            <Link className="cookieCateringNoticeButton" href={menuHref}>
              Build a catering tray
            </Link>
          </div>
        </div>
      </div>
    </BakeryCard>
  )
}

export function CookiePosterGrid({ posters }: { posters: CookiePosterAsset[] }) {
  return (
    <>
      <CookieCateringNotice />

      <section className="w-full">
        <div className="cookiePosterRailShell">
          <div className="cookiePosterFence" aria-hidden="true" />
          <div className="cookiePosterRailFrame">
            <div className="cookiePosterRail w-full">
              <div className="cookiePosterRailInner">
                {posters.map((poster, index) => (
                  <CookiePosterRailCard cardIndex={index} key={poster.slug} poster={poster} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .cookiePosterCard {
          background:
            linear-gradient(180deg, rgba(255, 250, 242, 0.97), rgba(251, 246, 235, 0.97)),
            rgba(255, 250, 242, 0.97);
          border: 1px solid rgba(91, 70, 37, 0.14);
          border-radius: 0.82rem;
          border-color: rgba(91, 70, 37, 0.14);
          box-shadow:
            0 8px 20px rgba(74, 57, 31, 0.045),
            inset 0 1px 0 rgba(255, 255, 255, 0.75);
          isolation: isolate;
          padding: 0.9rem;
          height: 100%;
        }

        .cookiePosterRailShell {
          position: relative;
          isolation: isolate;
          padding: 0.35rem 0 2.4rem;
          width: calc(50vw + 50%);
        }

        .cookiePosterRailFrame {
          position: relative;
          z-index: 1;
        }

        .cookiePosterRailFrame::after {
          background: linear-gradient(90deg, rgba(251, 246, 235, 0), rgba(251, 246, 235, 0.96));
          border-bottom-right-radius: 1.7rem;
          border-top-right-radius: 1.7rem;
          bottom: 0.35rem;
          content: '';
          pointer-events: none;
          position: absolute;
          right: 0;
          top: 0;
          width: clamp(2.5rem, 5vw, 4rem);
        }

        .cookiePosterRail {
          overflow-x: auto;
          overflow-y: visible;
          overscroll-behavior-x: contain;
          scroll-snap-type: x proximity;
          -ms-overflow-style: none;
          scrollbar-width: none;
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .cookiePosterRailInner {
          display: flex;
          gap: 2.25rem;
          padding-bottom: 0.4rem;
          padding-left: 1.1rem;
          padding-right: clamp(1.2rem, 4vw, 2.75rem);
          position: relative;
          width: max-content;
          min-width: 100%;
          align-items: stretch;
        }

        .cookiePosterFence {
          background-image: url('/fence.svg');
          background-position: left bottom;
          background-repeat: repeat-x;
          background-size: 2.4rem 100%;
          bottom: 2.8rem;
          height: 70%;
          left: -2rem;
          opacity: 0.88;
          pointer-events: none;
          position: absolute;
          right: 0;
          z-index: 0;
        }

        .cookiePosterRail::-webkit-scrollbar {
          display: none;
        }

        .cookiePosterRailItem {
          flex: 0 0 min(86vw, 21rem);
          scroll-snap-align: start;
        }

        .cookiePosterActionButton {
          background: #1c2e10;
          border: 1px solid #1c2e10;
          border-radius: 0.82rem;
          box-shadow:
            0 10px 18px rgba(28, 46, 16, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          flex: 0 0 auto;
          min-height: 2.45rem;
          min-width: 7.85rem;
          padding: 0.55rem 1rem;
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            filter 180ms ease;
        }

        .cookiePosterActionButton:hover,
        .cookiePosterActionButton:focus-visible {
          background: #2b4419;
          border-color: #2b4419;
          box-shadow:
            0 14px 24px rgba(28, 46, 16, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          filter: saturate(1.05);
          transform: translateY(-2px) scale(1.015);
        }

        .cookiePosterActionButton:active {
          transform: translateY(0) scale(0.985);
          box-shadow:
            0 7px 14px rgba(28, 46, 16, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .cookiePosterMeta {
          align-items: flex-start;
          margin-bottom: 0.85rem;
          min-height: 0;
        }

        .cookiePosterTitle {
          font-family: var(--font-rounded-body);
          max-width: 13ch;
        }

        .cookiePosterTitle a {
          display: inline-block;
          max-width: 100%;
        }

        .cookiePosterLockedNameTag {
          align-items: center;
          color: inherit;
          display: inline-flex;
          gap: 0.34rem;
          text-decoration: none;
        }

        .cookiePosterLockedNameTag span {
          min-width: 0;
        }

        .cookiePosterLockedDescription {
          color: rgba(23, 21, 16, 0.66);
          font-family: var(--font-rounded-body);
          font-size: 0.78rem;
          font-weight: 650;
          line-height: 1.38;
          margin-bottom: 0.78rem;
          margin-top: -0.36rem;
        }

        .cookiePosterLockedDescription span {
          color: #171510;
          font-weight: 800;
        }

        .cookieCateringNotice {
          box-shadow:
            0 16px 36px rgba(23, 21, 16, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          margin-bottom: 1.2rem;
        }

        .cookieCateringNoticeGlow {
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.34), transparent 42%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 64%);
          inset: 0;
          pointer-events: none;
          position: absolute;
        }

        .cookieCateringNoticeHeading {
          font-family: var(--font-rounded-display);
        }

        .cookieCateringNoticeBody {
          font-family: var(--font-rounded-body);
        }

        .cookieCateringNoticeButton {
          align-items: center;
          background: #171510;
          border: 1px solid #171510;
          border-radius: 0.95rem;
          color: #ffffff;
          display: inline-flex;
          font-size: 1rem;
          justify-content: center;
          min-height: 3rem;
          padding: 0.8rem 1.2rem;
          text-decoration: none;
          transition:
            transform 150ms ease,
            background-color 150ms ease,
            border-color 150ms ease;
        }

        .cookieCateringNoticeButton:hover,
        .cookieCateringNoticeButton:focus-visible {
          background: #2a2822;
          border-color: #2a2822;
          transform: translateY(-1px);
        }

        .cookiePosterSketchFrame {
          clip-path: polygon(
            0.5% 0.8%,
            25% 0.45%,
            50% 0.35%,
            75% 0.5%,
            99.2% 0.85%,
            99.45% 24.9%,
            99.15% 50%,
            99.4% 75.1%,
            98.95% 99.25%,
            74.9% 99.05%,
            50.05% 99.4%,
            25.05% 99.15%,
            0.75% 98.9%,
            0.55% 75.15%,
            0.8% 50.2%,
            0.45% 24.9%
          );
        }

        .cookiePosterSceneButton {
          align-items: center;
          background:
            linear-gradient(
              90deg,
              color-mix(in srgb, var(--poster-scene-charge, rgba(255, 215, 79, 0.85)) 70%, white 30%) 0%,
              color-mix(in srgb, var(--poster-scene-charge, rgba(255, 215, 79, 0.85)) 84%, white 16%) 100%
            ),
            rgba(255, 248, 242, 0.9);
          border: 1px solid rgba(25, 57, 95, 0.16);
          border-radius: 999px;
          color: #173a63;
          cursor: pointer;
          display: inline-flex;
          font-family: var(--font-rounded-display);
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          min-height: 1.95rem;
          padding: 0.4rem 0.72rem;
          position: relative;
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease;
        }

        .cookiePosterSceneButton:hover,
        .cookiePosterSceneButton:focus-visible {
          border-color: rgba(25, 57, 95, 0.28);
          box-shadow: 0 10px 18px rgba(23, 58, 99, 0.12);
          transform: translateY(-1px);
        }

        .cookiePosterSceneCloud {
          animation: cookiePosterCloudDrift var(--cloud-duration, 18s) linear infinite;
          animation-delay: var(--cloud-delay, 0s);
          filter: drop-shadow(0 6px 10px rgba(255, 255, 255, 0.28));
          left: -18%;
          pointer-events: none;
          position: absolute;
          z-index: 10;
        }

        .cookiePosterSceneFlower {
          animation: cookiePosterFlowerLife var(--poster-flower-duration, 4.6s) ease-in-out infinite;
          animation-delay: var(--poster-flower-delay, 0s);
          bottom: 4%;
          left: 0;
          pointer-events: none;
          position: absolute;
          transform:
            translateX(-50%)
            translateY(0)
            rotate(calc(var(--poster-flower-tilt, 2deg) * -1))
            scale(var(--poster-flower-scale, 1));
          transform-origin: center bottom;
          width: 2.2rem;
          z-index: 8;
        }

        .cookiePosterMoonlitLinework {
          pointer-events: none;
        }

        .cookiePosterMoonlitRipple {
          border-top: 1.5px solid rgba(209, 229, 255, 0.38);
          border-radius: 999px;
          filter: drop-shadow(0 0 10px rgba(184, 221, 255, 0.12));
          height: 1rem;
          position: absolute;
          right: 0;
        }

        .cookiePosterMoonlitRipple--one {
          bottom: 1.1rem;
          right: 1rem;
          transform: rotate(-1deg);
          width: 4.8rem;
        }

        .cookiePosterMoonlitRipple--two {
          bottom: 1.5rem;
          opacity: 0.84;
          right: 1.45rem;
          width: 3.8rem;
        }

        .cookiePosterMoonlitRipple--three {
          bottom: 1.9rem;
          opacity: 0.64;
          right: 2rem;
          width: 2.9rem;
        }

        .cookiePosterMoonlitSpark {
          background: rgba(242, 250, 255, 0.88);
          border-radius: 999px;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.36);
          height: 0.18rem;
          position: absolute;
          width: 0.18rem;
        }

        .cookiePosterMoonlitSpark--one {
          bottom: 2.7rem;
          right: 4.6rem;
        }

        .cookiePosterMoonlitSpark--two {
          bottom: 3.15rem;
          right: 2.9rem;
        }

        .cookiePosterMoonlitSpark--three {
          bottom: 2.35rem;
          right: 1.7rem;
        }

        .cookiePosterMoonlitReeds {
          background:
            linear-gradient(180deg, transparent, transparent 24%, rgba(173, 219, 214, 0.35) 24.5%, transparent 25%) right 0.5rem bottom/0.42rem 100% no-repeat,
            linear-gradient(180deg, transparent, transparent 32%, rgba(173, 219, 214, 0.28) 32.5%, transparent 33%) right 1.1rem bottom/0.32rem 100% no-repeat,
            linear-gradient(180deg, transparent, transparent 18%, rgba(173, 219, 214, 0.25) 18.5%, transparent 19%) right 1.55rem bottom/0.28rem 100% no-repeat;
          bottom: 0.8rem;
          height: 3.4rem;
          position: absolute;
          right: 0.55rem;
          width: 2rem;
        }

        .cookiePosterInfoDock {
          align-items: flex-end;
          display: flex;
          justify-content: flex-end;
        }

        .cookiePosterInfoDock--inline {
          align-items: stretch;
          justify-content: flex-start;
          position: static;
        }

        .cookiePosterInfoButton {
          align-items: center;
          backdrop-filter: blur(10px);
          background: rgba(246, 251, 255, 0.2);
          border: 1px solid rgba(235, 246, 255, 0.34);
          border-radius: 999px;
          box-shadow:
            0 10px 28px rgba(6, 17, 36, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.26);
          color: rgba(247, 252, 255, 0.84);
          cursor: pointer;
          display: inline-flex;
          font-family: var(--font-rounded-display);
          font-size: 0.78rem;
          font-weight: 700;
          gap: 0.38rem;
          letter-spacing: 0.01em;
          min-height: 2rem;
          padding: 0.45rem 0.72rem;
          transition:
            background-color 180ms ease,
            color 180ms ease,
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 180ms ease,
            border-color 180ms ease;
        }

        .cookiePosterInfoButton:hover,
        .cookiePosterInfoButton:focus-visible,
        .cookiePosterInfoButton[aria-expanded='true'] {
          background: rgba(255, 250, 236, 0.92);
          border-color: rgba(255, 248, 227, 0.96);
          box-shadow:
            0 14px 30px rgba(6, 17, 36, 0.22),
            0 0 0 1px rgba(104, 77, 34, 0.06);
          color: #5a4121;
          transform: translateY(-1px);
        }

        .cookiePosterInfoButtonIcon {
          align-items: center;
          background: rgba(255, 255, 255, 0.24);
          border-radius: 999px;
          display: inline-flex;
          height: 1.1rem;
          justify-content: center;
          line-height: 1;
          width: 1.1rem;
        }

        .cookiePosterInfoButtonFlower {
          display: block;
          height: 1rem;
          width: 1rem;
        }

        .cookiePosterInfoButton--inline {
          box-shadow: none;
        }

        .cookiePosterIngredientCard {
          background: #fffefa;
          border: 1px solid rgba(128, 98, 51, 0.18);
          border-radius: 1rem 1rem 1.2rem 0.92rem;
          box-shadow:
            0 22px 36px rgba(16, 14, 10, 0.2),
            0 6px 12px rgba(107, 81, 41, 0.12);
          overflow: hidden;
          padding: 1rem 0.95rem 0.9rem;
          transform: rotate(-1.2deg);
        }

        .cookiePosterIngredientCard::after {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.46), transparent 24%);
          content: '';
          inset: 0;
          pointer-events: none;
          position: absolute;
        }

        .cookiePosterIngredientPin {
          background: radial-gradient(circle at 30% 30%, #fffbde, #d4a95f 72%, #9a6d2b 100%);
          border-radius: 999px;
          box-shadow: 0 5px 10px rgba(92, 63, 17, 0.24);
          height: 0.8rem;
          left: 50%;
          position: absolute;
          top: 0.45rem;
          transform: translateX(-50%);
          width: 0.8rem;
          z-index: 2;
        }

        .cookiePosterIngredientClose {
          align-items: center;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(118, 87, 39, 0.16);
          border-radius: 999px;
          color: rgba(93, 68, 31, 0.8);
          cursor: pointer;
          display: inline-flex;
          font-size: 0.72rem;
          height: 1.4rem;
          justify-content: center;
          position: absolute;
          right: 0.45rem;
          top: 0.45rem;
          width: 1.4rem;
          z-index: 2;
        }

        .cookiePosterInfoRichText {
          position: relative;
          z-index: 1;
        }

        .cookiePosterInfoRichText h3,
        .cookiePosterInfoRichText h4 {
          color: #5d4119;
          font-family: 'Comic Sans MS', 'Bradley Hand', cursive;
          font-size: 1.18rem;
          line-height: 1.05;
          margin: 0.35rem 0 0.45rem;
        }

        .cookiePosterInfoRichText p {
          color: rgba(88, 64, 32, 0.78);
          font-family: 'Comic Sans MS', 'Bradley Hand', cursive;
          font-size: 0.87rem;
          line-height: 1.35;
          margin: 0.45rem 0 0;
          padding-right: 1rem;
        }

        .cookiePosterInfoRichText strong {
          color: #4f3818;
          font-weight: 800;
        }

        .cookieSheepBodyImage {
          transform: scale(1.04);
          transform-origin: center center;
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }

        .group:hover .cookieSheepBodyImage,
        .group:focus-within .cookieSheepBodyImage {
          transform: scale(1.18);
        }

        .cookieSheepBurstPart {
          opacity: 1;
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          transition:
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 260ms ease-out;
          will-change: transform, opacity;
        }

        .group:hover .cookieSheepBurstPart,
        .group:focus-within .cookieSheepBurstPart {
          opacity: 0;
          transform: translate3d(var(--sheep-burst-x, 0), var(--sheep-burst-y, 0), 0)
            rotate(var(--sheep-burst-rotate, 0deg))
            scale(var(--sheep-burst-scale, 0.72));
        }

        @keyframes cookiePosterCloudDrift {
          0% {
            transform: translate3d(0, 0, 0);
          }

          100% {
            transform: translate3d(42rem, 0, 0);
          }
        }

        @keyframes cookiePosterFlowerLife {
          0%,
          100% {
            transform:
              translateX(-50%)
              translateY(0)
              rotate(calc(var(--poster-flower-tilt, 2deg) * -1))
              scale(var(--poster-flower-scale, 1));
          }

          50% {
            transform:
              translateX(-50%)
              translateY(calc(var(--poster-flower-bob, 0.18rem) * -1))
              rotate(var(--poster-flower-tilt, 2deg))
              scale(var(--poster-flower-scale, 1));
          }
        }

        @media (max-width: 767px) {
          .cookiePosterActionButton {
            min-width: 0;
            min-height: 2.3rem;
            padding-left: 0.9rem;
            padding-right: 0.9rem;
          }

          .cookiePosterMeta {
            flex-direction: column;
            gap: 0.7rem;
            margin-bottom: 0.75rem;
          }

          .cookiePosterSceneControls {
            left: 0.75rem;
            right: 0.75rem;
            top: 0.75rem;
          }

          .cookiePosterSceneButton {
            font-size: 0.7rem;
            min-height: 1.82rem;
            padding-left: 0.62rem;
            padding-right: 0.62rem;
          }

          .cookiePosterIngredientCard {
            bottom: 3.45rem;
            right: 0.75rem;
            width: min(12.6rem, calc(100% - 1.5rem));
          }

          .cookiePosterInfoDock {
            bottom: 0.75rem;
            right: 0.75rem;
          }

          .cookiePosterInfoButton--inline {
            display: none;
          }

          .cookiePosterRailShell {
            padding-bottom: 1.65rem;
            padding-top: 0.2rem;
          }

          .cookiePosterFence {
            bottom: 1.65rem;
            left: -1.5rem;
          }

          .cookiePosterRail {
            gap: 0.85rem;
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .cookieCateringNotice {
            padding-bottom: 1.5rem;
            padding-top: 1.75rem;
          }

          .cookieCateringNoticeHeading {
            max-width: 12ch;
          }

          .cookieCateringNoticeBody {
            font-size: 1rem;
            line-height: 1.7;
          }
        }

        @media (min-width: 768px) {
          .cookiePosterRailItem {
            flex-basis: 20.5rem;
          }
        }

        @media (min-width: 1280px) {
          .cookiePosterRail {
            gap: 1.15rem;
          }

          .cookiePosterRailItem {
            flex-basis: 21rem;
          }
        }
      `}</style>
    </>
  )
}
