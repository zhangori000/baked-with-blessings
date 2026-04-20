'use client'

import { menuHref } from '@/utilities/routes'
import Link from 'next/link'
import React from 'react'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'

import type { CookiePosterAsset } from './cookiePosterData'
import { CookieSheepRig } from './cookie-sheep-rig'

type PosterCloud = {
  delay: string
  duration: string
  style: React.CSSProperties
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
                {posters.map((poster) => {
                  const sceneStyle = {
                    ['--cookie-bottom' as string]: '2.85rem',
                    ['--cookie-size' as string]: 'clamp(14.8rem, 64%, 16.4rem)',
                  } as React.CSSProperties

                  return (
                      <article key={poster.slug} className="group cookiePosterRailItem h-full">
                        <div className="cookiePosterCard relative flex h-full flex-col overflow-hidden">
                          <div className="cookiePosterMeta flex justify-between gap-3 px-1">
                            <h3 className="cookiePosterTitle min-w-0 flex-1 text-[1.28rem] font-medium leading-[0.96] tracking-[-0.03em] text-[#171510] md:text-[1.38rem]">
                              <Link href={poster.href}>
                                {poster.title}
                              </Link>
                            </h3>

                            <div className="shrink-0">
                              <CookiePosterAddToCartButton poster={poster} />
                            </div>
                          </div>

                          <CookiePosterSketchFrame slug={poster.slug} style={sceneStyle}>
                            <img
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 h-full w-full object-cover"
                              src="/grassland.svg"
                            />

                            {posterClouds.map((cloud, index) => (
                              <img
                                alt=""
                                aria-hidden="true"
                                className="cookiePosterCloud pointer-events-none absolute z-10"
                                key={`${poster.slug}-cloud-${index}`}
                                src="/clouds/three-ball-cloud-compact.svg"
                                style={cloud.style}
                                data-cloud-delay={cloud.delay}
                                data-cloud-duration={cloud.duration}
                              />
                            ))}

                            <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[54%] bg-gradient-to-b from-[rgba(255,255,255,0.18)] to-transparent" />

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
                })}
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

        .cookiePosterCloud {
          left: -18%;
          animation: cookiePosterCloudDrift 18s linear infinite;
          filter: drop-shadow(0 6px 10px rgba(255, 255, 255, 0.28));
        }

        .cookiePosterCloud[data-cloud-duration='18s'] {
          animation-duration: 18s;
        }

        .cookiePosterCloud[data-cloud-delay='0s'] {
          animation-delay: 0s;
        }

        .cookiePosterCloud[data-cloud-delay='-6s'] {
          animation-delay: -6s;
        }

        .cookiePosterCloud[data-cloud-delay='-12s'] {
          animation-delay: -12s;
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
