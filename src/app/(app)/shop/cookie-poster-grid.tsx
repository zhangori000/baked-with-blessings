'use client'

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

const cardSurface = '#fffaf0'
const cardBorder = 'rgba(91, 70, 37, 0.14)'

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
      className="cookiePosterSketchFrame cookiePosterScene relative h-[20rem] w-full overflow-hidden bg-[#dbeeff]"
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
      className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-[0.78rem] bg-[#21492d] px-5 font-mono text-[0.88rem] uppercase tracking-[0.16em] text-white transition-colors duration-300 ease-out hover:bg-[#2d5a37] disabled:cursor-not-allowed"
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
      Add To Cart
    </button>
  )
}

function CookieCateringNotice() {
  return (
    <section
      aria-label="Cookie catering notice"
      className="cookieCateringNotice relative overflow-hidden rounded-[1.8rem] border px-5 py-6 md:px-8 md:py-8"
      style={{
        background: 'linear-gradient(135deg, #f8f8f5 0%, #efefeb 100%)',
        borderColor: 'rgba(23, 21, 16, 0.12)',
      }}
    >
      <div className="cookieCateringNoticeGlow" />

      <div className="relative z-[1] grid items-center gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(14rem,0.8fr)] md:gap-10">
        <div className="min-w-0">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.56)]">
            Cookie Catering
          </p>
          <h2 className="cookieCateringNoticeHeading mt-3 max-w-[13ch] text-[2rem] leading-[0.95] tracking-[-0.045em] text-[#171510] md:text-[2.65rem]">
            Catering orders can include past cookie flavors.
          </h2>
          <p className="cookieCateringNoticeBody mt-5 max-w-[34rem] text-[1.05rem] leading-8 text-[rgba(23,21,16,0.82)] md:text-[1.12rem]">
            If you are ordering for catering, you are not limited to only the cookies shown in the
            current lineup. Larger catering batches can reopen previous flavors because they are
            easier to plan and bake well than one-off custom cookie requests.
          </p>
          <div className="mt-7">
            <Link className="cookieCateringNoticeButton" href="/contact">
              Ask about catering
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className="cookieCateringNoticeArt hidden md:flex">
          <div className="cookieCateringNoticeArch">
            <span className="cookieCateringNoticeArchTop" />
            <span className="cookieCateringNoticeArchLeg cookieCateringNoticeArchLeg--left" />
            <span className="cookieCateringNoticeArchLeg cookieCateringNoticeArchLeg--right" />
            <span className="cookieCateringNoticeArchStep cookieCateringNoticeArchStep--outer-left" />
            <span className="cookieCateringNoticeArchStep cookieCateringNoticeArchStep--inner-left" />
            <span className="cookieCateringNoticeArchStep cookieCateringNoticeArchStep--inner-right" />
            <span className="cookieCateringNoticeArchStep cookieCateringNoticeArchStep--outer-right" />
          </div>

          <div className="cookieCateringNoticePedestal">
            <span className="cookieCateringNoticePedestalTier cookieCateringNoticePedestalTier--top" />
            <span className="cookieCateringNoticePedestalTier cookieCateringNoticePedestalTier--mid" />
            <span className="cookieCateringNoticePedestalTier cookieCateringNoticePedestalTier--base" />
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

      <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {posters.map((poster) => {
          const sceneStyle = {
            ['--cookie-bottom' as string]: '2.35rem',
            ['--cookie-size' as string]: 'clamp(14.6rem, 63%, 16rem)',
          } as React.CSSProperties

          return (
            <article className="group block h-full w-full" key={poster.slug}>
              <div
                className="relative flex h-full min-h-[31rem] w-full flex-col overflow-hidden rounded-[0.7rem] border shadow-[0_12px_28px_rgba(74,57,31,0.06)]"
                style={{
                  backgroundColor: cardSurface,
                  borderColor: cardBorder,
                }}
              >
                <div className="border-b border-[rgba(91,70,37,0.1)] px-3.5 pb-3.5 pt-3.5">
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
                        src="/log-stacked-cloud-transparent.png"
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

                <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 border-b border-[rgba(91,70,37,0.1)] pb-3.5">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[1.42rem] font-medium leading-[0.94] tracking-[-0.045em] text-[#1d3250] md:text-[1.5rem]">
                        {poster.title}
                      </h3>
                      <p className="font-mono text-[0.74rem] uppercase leading-none tracking-[0.09em] text-[#7a836f]">
                        {poster.subtitle}
                      </p>
                    </div>

                    <span className="shrink-0 pt-0.5 font-mono text-[0.95rem] uppercase tracking-[0.08em] text-[#38533d]">
                      {poster.amount}
                    </span>
                  </div>

                  <p className="text-[0.95rem] leading-6 text-[#5f685d]">{poster.summary}</p>

                  <div className="mt-auto h-[3.35rem]">
                    <CookiePosterAddToCartButton poster={poster} />
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <style>{`
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

        .cookieCateringNoticeHeading,
        .cookieCateringNoticeBody {
          font-family: Georgia, 'Times New Roman', serif;
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

        .cookieCateringNoticeArt {
          align-items: center;
          justify-content: center;
          min-height: 15rem;
          position: relative;
        }

        .cookieCateringNoticeArch {
          height: 9rem;
          position: relative;
          width: 14rem;
        }

        .cookieCateringNoticeArchTop,
        .cookieCateringNoticeArchLeg,
        .cookieCateringNoticeArchStep {
          background: #171510;
          border-radius: 999px;
          position: absolute;
        }

        .cookieCateringNoticeArchTop {
          height: 0.38rem;
          left: 0.45rem;
          right: 0.45rem;
          top: 0.5rem;
        }

        .cookieCateringNoticeArchLeg {
          height: 7.3rem;
          top: 0.5rem;
          width: 0.42rem;
        }

        .cookieCateringNoticeArchLeg--left {
          left: 0.3rem;
        }

        .cookieCateringNoticeArchLeg--right {
          right: 0.3rem;
        }

        .cookieCateringNoticeArchStep {
          height: 0.38rem;
        }

        .cookieCateringNoticeArchStep--outer-left {
          left: 0.3rem;
          top: 7.42rem;
          width: 2.6rem;
        }

        .cookieCateringNoticeArchStep--inner-left {
          left: 2.55rem;
          top: 5.15rem;
          width: 3.2rem;
        }

        .cookieCateringNoticeArchStep--inner-right {
          right: 2.55rem;
          top: 5.15rem;
          width: 3.2rem;
        }

        .cookieCateringNoticeArchStep--outer-right {
          right: 0.3rem;
          top: 7.42rem;
          width: 2.6rem;
        }

        .cookieCateringNoticePedestal {
          bottom: 0.35rem;
          height: 7.4rem;
          position: absolute;
          right: 1rem;
          width: 10rem;
        }

        .cookieCateringNoticePedestalTier {
          background: #ffffff;
          display: block;
          margin-left: auto;
          margin-right: auto;
          position: absolute;
        }

        .cookieCateringNoticePedestalTier--top {
          height: 2.8rem;
          left: 2.8rem;
          right: 2.8rem;
          top: 0;
        }

        .cookieCateringNoticePedestalTier--mid {
          height: 2.55rem;
          left: 1.4rem;
          right: 1.4rem;
          top: 2.35rem;
        }

        .cookieCateringNoticePedestalTier--base {
          height: 2.7rem;
          left: 0;
          right: 0;
          top: 4.7rem;
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

        .cookieSheepBurstPart {
          opacity: 1;
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          transition:
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 260ms ease-out;
          will-change: transform, opacity;
        }

        .group:hover .cookieSheepBodyImage,
        .group:focus-within .cookieSheepBodyImage {
          transform: scale(1.18);
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
          .cookieCateringNoticeHeading {
            max-width: 12ch;
          }

          .cookieCateringNoticeBody {
            font-size: 1rem;
            line-height: 1.7;
          }
        }
      `}</style>
    </>
  )
}
