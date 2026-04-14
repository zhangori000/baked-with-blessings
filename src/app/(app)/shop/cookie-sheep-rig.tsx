'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'

import {
  CookieBodyGeometryService,
  clockTimeToMs,
  placePartArt,
  placePartOnCookie,
  type CookieJointPlacement,
} from './cookie-sheep-geometry'

type CookieSheepRigProps = {
  href: string
  singularSrc: string
  title: string
}

const cookieRadiusPct = 41.5
const cookieBody = new CookieBodyGeometryService(cookieRadiusPct)
const headVisualSizePct = cookieBody.partSizeValuePctFromBodyAreaRatio(1 / 25)
const headSizePct = cookieBody.partSizePctFromBodyAreaRatio(1 / 25, 0.32)
const tailSizePct = cookieBody.partSizePctFromBodyAreaRatio(1 / 18, 0.72)
const legPairWidthPct = Number((headVisualSizePct * 1.18).toFixed(2))
const legPairHeightPct = Number((headVisualSizePct * 0.82).toFixed(2))

const frontLegPairPlacement: CookieJointPlacement = {
  anchorX: 0.08,
  anchorY: 0.46,
  clockMs: clockTimeToMs(7, 44),
  directionClockMs: clockTimeToMs(7, 52),
  height: `${legPairHeightPct}%`,
  radialOffsetPct: 0.28,
  radiusPct: cookieRadiusPct,
  width: `${legPairWidthPct}%`,
}

const hindLegPairPlacement: CookieJointPlacement = {
  anchorX: 0.08,
  anchorY: 0.46,
  clockMs: clockTimeToMs(4, 16),
  directionClockMs: clockTimeToMs(4, 8),
  height: `${legPairHeightPct}%`,
  radialOffsetPct: 0.28,
  radiusPct: cookieRadiusPct,
  width: `${legPairWidthPct}%`,
}

const headPlacement: CookieJointPlacement = {
  anchorX: 0.99,
  anchorY: 0.55,
  artScale: 1.15,
  artTranslateXPct: 40,
  artTranslateYPct: -2,
  clockMs: clockTimeToMs(8, 53),
  height: headSizePct,
  radialOffsetPct: -0.55,
  radiusPct: cookieRadiusPct,
  rotateDeg: 15,
  tangentOffsetPct: 0.12,
  width: headSizePct,
}

const tailPlacement: CookieJointPlacement = {
  anchorX: 0.08,
  anchorY: 0.52,
  artScale: 1.22,
  artTranslateXPct: -22,
  artTranslateYPct: 0,
  clockMs: clockTimeToMs(3, 6),
  height: tailSizePct,
  radialOffsetPct: 0.32,
  radiusPct: cookieRadiusPct,
  rotateDeg: 6,
  tangentOffsetPct: -0.04,
  width: tailSizePct,
}

function AssetPartImage({
  alt,
  className,
  src,
  style,
}: {
  alt: string
  className?: string
  src: string
  style?: CSSProperties
}) {
  return (
    <img
      alt={alt}
      className={className}
      draggable="false"
      loading="eager"
      src={src}
      style={style}
    />
  )
}

function SheepLegPairSvg() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 36 22" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 6H18C22 6 25 6.2 28 10"
        stroke="#111111"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.6"
      />
      <path
        d="M6 15H21C25 15 28 15.2 31 19"
        stroke="#111111"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.6"
      />
    </svg>
  )
}

export function CookieSheepRig({ href, singularSrc, title }: CookieSheepRigProps) {
  return (
    <div className="absolute left-1/2 bottom-[var(--cookie-bottom)] z-20 h-[var(--cookie-size)] w-[var(--cookie-size)] -translate-x-1/2">
      <div className="absolute inset-0 z-10">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={placePartOnCookie(frontLegPairPlacement)}
        >
          <SheepLegPairSvg />
        </span>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={placePartOnCookie(hindLegPairPlacement)}
        >
          <SheepLegPairSvg />
        </span>
      </div>

      <Link
        aria-label={`Open ${title} cookie page`}
        className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17341f] focus-visible:ring-offset-4"
        href={href}
      >
        <span className="sr-only">{title}</span>
        <img
          alt={`${title} cookie`}
          className="pointer-events-none block h-full w-full scale-[1.04] object-cover"
          loading="lazy"
          src={singularSrc}
        />
      </Link>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-30"
        style={placePartOnCookie(tailPlacement)}
      >
        <AssetPartImage
          alt=""
          className="block h-full w-full object-contain"
          src="/sheep-tail.svg"
          style={placePartArt(tailPlacement)}
        />
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-40"
        style={placePartOnCookie(headPlacement)}
      >
        <AssetPartImage
          alt=""
          className="block h-full w-full object-contain"
          src="/singular-sheep-head.svg"
          style={placePartArt(headPlacement)}
        />
      </span>
    </div>
  )
}
