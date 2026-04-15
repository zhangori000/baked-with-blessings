'use client'

import React from 'react'

import { cookiePosterAssets, type CookiePosterAsset } from './cookiePosterData'
import { CookieSheepRig } from './cookie-sheep-rig'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'

type PosterCloud = {
  delay: string
  duration: string
  style: React.CSSProperties
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

export function CookiePosterGrid() {
  return (
    <>
      <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {cookiePosterAssets.map((poster) => {
          const sceneStyle = {
            ['--cookie-bottom' as string]: '2.35rem',
            ['--cookie-size' as string]: 'clamp(14.6rem, 63%, 16rem)',
          } as React.CSSProperties

          return (
            <article className="group block h-full w-full" key={poster.src}>
              <div
                className="relative flex h-full min-h-[33rem] w-full flex-col overflow-hidden rounded-[0.7rem] border shadow-[0_14px_36px_rgba(74,57,31,0.08)]"
                style={{
                  backgroundColor: cardSurface,
                  borderColor: cardBorder,
                }}
              >
                <div className="border-b border-[rgba(91,70,37,0.1)] px-3.5 pb-3.5 pt-3.5">
                  <div
                    className="cookiePosterScene relative h-[20rem] overflow-hidden rounded-[0.58rem] border border-[rgba(91,70,37,0.12)] bg-[#dbeeff]"
                    style={sceneStyle}
                  >
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
                        data-cloud-duration={cloud.duration}
                        data-cloud-delay={cloud.delay}
                      />
                    ))}

                    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[54%] bg-gradient-to-b from-[rgba(255,255,255,0.18)] to-transparent" />

                    <CookieSheepRig
                      href={poster.href}
                      singularSrc={poster.singularSrc}
                      title={poster.title}
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-3.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[1.5rem] font-medium leading-[0.92] tracking-[-0.05em] text-[#1d3250] md:text-[1.58rem]">
                        {poster.title}
                      </h3>
                      <p className="font-mono text-[0.79rem] uppercase leading-none tracking-[0.08em] text-[#5a6857]">
                        {poster.subtitle}
                      </p>
                    </div>

                    <span className="shrink-0 pt-0.5 font-mono text-[0.98rem] uppercase tracking-[0.08em] text-[#1d3250]">
                      {poster.amount}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {poster.chips.map((chip) => (
                      <span
                        className="rounded-full border border-[rgba(91,70,37,0.14)] bg-[#fff7e4] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-[#465743]"
                        key={chip}
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

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
      `}</style>
    </>
  )
}
