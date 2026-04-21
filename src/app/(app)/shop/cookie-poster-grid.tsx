'use client'

import { menuHref } from '@/utilities/routes'
import Link from 'next/link'
import React, { useState } from 'react'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'

import type { CookiePosterAsset } from './cookiePosterData'
import { CookieSheepRig } from './cookie-sheep-rig'

type PosterCloud = {
  delay: string
  duration: string
  style: React.CSSProperties
}

type PosterSceneTone = 'dawn' | 'under-tree' | 'moonlit' | 'classic' | 'blossom'

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

const posterSceneryTones: PosterSceneTone[] = ['classic', 'dawn', 'under-tree', 'moonlit', 'blossom']
const posterSkyByScenery: Record<PosterSceneTone, string> = {
  dawn: '/catering/scenery/brown-anime-gradient-sky.svg',
  'under-tree': '/catering/scenery/girl-under-tree-sky.svg',
  moonlit: '/catering/scenery/moonlit-purple-sky.svg',
  classic: '/catering/scenery/classic-sky.svg',
  blossom: '/catering/scenery/blossom-breeze-sky.svg',
}
const posterMeadowByScenery: Record<PosterSceneTone, string> = {
  dawn: '/catering/scenery/brown-anime-rolling-meadow.svg',
  'under-tree': '/catering/scenery/girl-under-tree-meadow.svg',
  moonlit: '/catering/scenery/moonlit-purple-meadow.svg',
  classic: '/catering/scenery/classic-meadow.svg',
  blossom: '/catering/scenery/blossom-grass-mound.svg',
}
const posterButtonAuraByScenery: Record<PosterSceneTone, string> = {
  dawn: 'rgba(255, 214, 101, 0.86)',
  'under-tree': 'rgba(197, 228, 142, 0.84)',
  moonlit: 'rgba(153, 115, 255, 0.9)',
  classic: 'rgba(255, 215, 79, 0.85)',
  blossom: 'rgba(255, 176, 208, 0.92)',
}
const posterCloudAssetsByScenery: Record<PosterSceneTone, readonly string[]> = {
  dawn: ['/clouds/brown-anime-cloud-fluffy.svg', '/clouds/brown-anime-cloud-layered.svg'],
  'under-tree': ['/clouds/three-ball-cloud-wide.svg', '/clouds/three-ball-cloud.svg'],
  moonlit: ['/clouds/moonlit-purple-swoop-cloud.svg', '/clouds/moonlit-purple-upper-cloud.svg'],
  classic: ['/clouds/three-ball-cloud-compact.svg', '/clouds/three-ball-cloud.svg'],
  blossom: ['/clouds/three-ball-cloud-wide.svg', '/clouds/three-ball-cloud.svg'],
}

let spawnedPosterCloudID = 0
let spawnedPosterFlowerID = 0

const buildSeededPosterFlowers = (cardIndex: number): SpawnedPosterFlower[] => {
  const leftOffset = (cardIndex % 3) * 2.4

  return [
    {
      bob: '0.18rem',
      delay: '-0.8s',
      duration: '4.4s',
      id: cardIndex * 10 + 1,
      left: `${12 + leftOffset}%`,
      scale: 0.96,
      tilt: '-2deg',
    },
    {
      bob: '0.22rem',
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

  return {
    delay: `-${(Math.random() * 7).toFixed(2)}s`,
    duration: `${(16 + Math.random() * 8).toFixed(2)}s`,
    id: ++spawnedPosterCloudID,
    left: `${(4 + Math.random() * 40).toFixed(2)}%`,
    src,
    top: `${(6 + Math.random() * 22).toFixed(2)}%`,
    width: `${(4.8 + Math.random() * 2.7).toFixed(2)}rem`,
  }
}

const createSpawnedPosterFlower = (): SpawnedPosterFlower => ({
  bob: `${(0.16 + Math.random() * 0.14).toFixed(2)}rem`,
  delay: `-${(Math.random() * 4.2).toFixed(2)}s`,
  duration: `${(4.1 + Math.random() * 1.7).toFixed(2)}s`,
  id: ++spawnedPosterFlowerID,
  left: `${(8 + Math.random() * 84).toFixed(2)}%`,
  scale: Number((0.88 + Math.random() * 0.44).toFixed(2)),
  tilt: `${(Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 2.4)}deg`,
})

function CookiePosterRailCard({ cardIndex, poster }: { cardIndex: number; poster: CookiePosterAsset }) {
  const [sceneryTone, setSceneryTone] = useState<PosterSceneTone>(
    posterSceneryTones[cardIndex % posterSceneryTones.length] ?? 'classic',
  )
  const [spawnedClouds, setSpawnedClouds] = useState<SpawnedPosterCloud[]>([])
  const [spawnedFlowers, setSpawnedFlowers] = useState<SpawnedPosterFlower[]>(
    buildSeededPosterFlowers(cardIndex),
  )

  const staticCloudAssets = posterCloudAssetsByScenery[sceneryTone] ?? posterCloudAssetsByScenery.classic
  const sceneStyle = {
    ['--cookie-bottom' as string]: '2.85rem',
    ['--cookie-size' as string]: 'clamp(14.8rem, 64%, 16.4rem)',
    ['--poster-scene-charge' as string]: posterButtonAuraByScenery[sceneryTone],
  } as React.CSSProperties

  const handleChangeScenery = () => {
    setSceneryTone((current) => {
      const currentIndex = posterSceneryTones.indexOf(current)
      return posterSceneryTones[(currentIndex + 1) % posterSceneryTones.length] ?? posterSceneryTones[0]
    })
    setSpawnedClouds([])
    setSpawnedFlowers(buildSeededPosterFlowers(cardIndex))
  }

  return (
    <article className="group cookiePosterRailItem h-full">
      <div className="cookiePosterCard relative flex h-full flex-col overflow-hidden">
        <div className="cookiePosterMeta flex justify-between gap-3 px-1">
          <h3 className="cookiePosterTitle min-w-0 flex-1 text-[1.28rem] font-medium leading-[0.96] tracking-[-0.03em] text-[#171510] md:text-[1.38rem]">
            <Link href={poster.href}>{poster.title}</Link>
          </h3>

          <div className="shrink-0">
            <CookiePosterAddToCartButton poster={poster} />
          </div>
        </div>

        <CookiePosterSketchFrame slug={poster.slug} style={sceneStyle}>
          <div className="cookiePosterSceneControls absolute left-3 top-3 z-30 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
            <button className="cookiePosterSceneButton" onClick={handleChangeScenery} type="button">
              Change scenery
            </button>
            <button
              className="cookiePosterSceneButton"
              onClick={() => setSpawnedClouds((current) => [...current, createSpawnedPosterCloud(sceneryTone)])}
              type="button"
            >
              Spawn cloud
            </button>
            <button
              className="cookiePosterSceneButton"
              onClick={() => setSpawnedFlowers((current) => [...current, createSpawnedPosterFlower()])}
              type="button"
            >
              Spawn flower
            </button>
          </div>

          <img
            alt=""
            aria-hidden="true"
            className="cookiePosterSky absolute inset-0 h-full w-full object-cover"
            src={posterSkyByScenery[sceneryTone]}
          />

          {posterClouds.map((cloud, index) => (
            <img
              alt=""
              aria-hidden="true"
              className="cookiePosterSceneCloud"
              key={`${poster.slug}-cloud-${sceneryTone}-${index}`}
              src={staticCloudAssets[index % staticCloudAssets.length] ?? staticCloudAssets[0]}
              style={
                {
                  ...cloud.style,
                  ['--cloud-delay' as string]: cloud.delay,
                  ['--cloud-duration' as string]: cloud.duration,
                } as React.CSSProperties
              }
            />
          ))}

          {spawnedClouds.map((cloud) => (
            <img
              alt=""
              aria-hidden="true"
              className="cookiePosterSceneCloud"
              key={cloud.id}
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
            />
          ))}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[54%] bg-gradient-to-b from-[rgba(255,255,255,0.18)] to-transparent" />

          <img
            alt=""
            aria-hidden="true"
            className="cookiePosterMeadow absolute inset-x-0 bottom-0 z-[2] h-full w-full object-cover object-bottom"
            src={posterMeadowByScenery[sceneryTone]}
          />

          {spawnedFlowers.map((flower) => (
            <img
              alt=""
              aria-hidden="true"
              className="cookiePosterSceneFlower"
              key={flower.id}
              src="/flowers/menu-nav-flower.svg"
              style={
                {
                  ['--poster-flower-bob' as string]: flower.bob,
                  ['--poster-flower-delay' as string]: flower.delay,
                  ['--poster-flower-duration' as string]: flower.duration,
                  ['--poster-flower-scale' as string]: `${flower.scale}`,
                  ['--poster-flower-tilt' as string]: flower.tilt,
                  left: flower.left,
                } as React.CSSProperties
              }
            />
          ))}

          <CookieSheepRig
            bodyFallbackSrc={poster.bodyFallbackSrc}
            href={poster.href}
            image={poster.image}
            title={poster.title}
          />
        </CookiePosterSketchFrame>
      </div>
    </article>
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
  const canAdd = typeof poster.productId === 'number'

  return (
    <button
      aria-label={`Add ${poster.title} to cart`}
      className="cookiePosterActionButton inline-flex cursor-pointer items-center justify-center text-center text-[0.92rem] font-medium tracking-[-0.01em] text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-50"
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
      disabled={isLoading}
      type="button"
    >
      Add to cart
    </button>
  )
}

function CookieCateringNotice() {
  return (
    <section
      aria-label="Cookie catering notice"
      className="cookieCateringNotice relative overflow-hidden rounded-[1.8rem] border px-5 py-6 md:px-8 md:py-8"
      style={{
        background:
          'linear-gradient(180deg, rgba(255, 250, 242, 0.97), rgba(251, 246, 235, 0.97)), rgba(255, 250, 242, 0.97)',
        borderColor: 'rgba(91, 70, 37, 0.14)',
      }}
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
    </section>
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
          bottom: 0.45rem;
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
