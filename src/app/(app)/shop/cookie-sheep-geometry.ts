import type { CSSProperties } from 'react'

export const FULL_CLOCK_MS = 43_200_000

export type CookieJointPlacement = {
  anchorX: number
  anchorY: number
  artScale?: number
  artTranslateXPct?: number
  artTranslateYPct?: number
  baseClockMs?: number
  clockMs: number
  directionClockMs?: number
  height: string
  radialOffsetPct?: number
  radiusPct: number
  rotateDeg?: number
  tangentOffsetPct?: number
  width: string
}

type ParallelLegPairOptions = {
  anchorX: number
  anchorY: number
  centerClockMs: number
  directionClockMs: number
  lengthPct: number
  pairSpacingMinutes: number
  radialOffsetPct: number
  rotateDeg?: number
  thicknessPct: number
}

export const clockTimeToMs = (
  hour: number,
  minute = 0,
  second = 0,
  millisecond = 0,
) => (((hour % 12) * 60 + minute) * 60 + second) * 1000 + millisecond

export const normalizeClockMs = (clockMs: number) => {
  const wrapped = clockMs % FULL_CLOCK_MS

  return wrapped >= 0 ? wrapped : wrapped + FULL_CLOCK_MS
}

export const clockMsToDegrees = (clockMs: number) =>
  (normalizeClockMs(clockMs) / FULL_CLOCK_MS) * 360

const formatPct = (value: number) => `${Number(value.toFixed(2))}%`

export class CookieBodyGeometryService {
  constructor(private readonly bodyRadiusPct: number) {}

  get radiusPct() {
    return this.bodyRadiusPct
  }

  get diameterPct() {
    return this.bodyRadiusPct * 2
  }

  partSizeValuePctFromBodyAreaRatio(areaRatio: number, assetFillRatio = 1) {
    return (this.diameterPct * Math.sqrt(areaRatio)) / assetFillRatio
  }

  partSizePctFromBodyAreaRatio(areaRatio: number, assetFillRatio = 1) {
    return formatPct(this.partSizeValuePctFromBodyAreaRatio(areaRatio, assetFillRatio))
  }

  mirrorClockMs(clockMs: number) {
    return normalizeClockMs(FULL_CLOCK_MS - normalizeClockMs(clockMs))
  }

  mirrorPlacement(placement: CookieJointPlacement): CookieJointPlacement {
    return {
      ...placement,
      clockMs: this.mirrorClockMs(placement.clockMs),
      directionClockMs:
        placement.directionClockMs == null
          ? undefined
          : this.mirrorClockMs(placement.directionClockMs),
    }
  }

  createParallelLegPair({
    anchorX,
    anchorY,
    centerClockMs,
    directionClockMs,
    lengthPct,
    pairSpacingMinutes,
    radialOffsetPct,
    rotateDeg = 0,
    thicknessPct,
  }: ParallelLegPairOptions): [CookieJointPlacement, CookieJointPlacement] {
    const halfSpacingMs = (pairSpacingMinutes * 60 * 1000) / 2

    return [
      {
        anchorX,
        anchorY,
        clockMs: normalizeClockMs(centerClockMs - halfSpacingMs),
        directionClockMs,
        height: formatPct(thicknessPct),
        radialOffsetPct,
        radiusPct: this.bodyRadiusPct,
        rotateDeg,
        width: formatPct(lengthPct),
      },
      {
        anchorX,
        anchorY,
        clockMs: normalizeClockMs(centerClockMs + halfSpacingMs),
        directionClockMs,
        height: formatPct(thicknessPct),
        radialOffsetPct,
        radiusPct: this.bodyRadiusPct,
        rotateDeg,
        width: formatPct(lengthPct),
      },
    ]
  }
}

export const placePartOnCookie = ({
  anchorX,
  anchorY,
  baseClockMs = clockTimeToMs(3, 0),
  clockMs,
  directionClockMs,
  height,
  radialOffsetPct = 0,
  radiusPct,
  rotateDeg = 0,
  tangentOffsetPct = 0,
  width,
}: CookieJointPlacement): CSSProperties => {
  const angleDeg = clockMsToDegrees(clockMs)
  const directionDeg =
    directionClockMs == null
      ? 0
      : clockMsToDegrees(directionClockMs) - clockMsToDegrees(baseClockMs)
  const radians = ((angleDeg - 90) * Math.PI) / 180
  const radialX = Math.cos(radians)
  const radialY = Math.sin(radians)
  const tangentX = -Math.sin(radians)
  const tangentY = Math.cos(radians)
  const xPct = 50 + radialX * (radiusPct + radialOffsetPct) + tangentX * tangentOffsetPct
  const yPct = 50 + radialY * (radiusPct + radialOffsetPct) + tangentY * tangentOffsetPct

  return {
    height,
    left: `${xPct}%`,
    top: `${yPct}%`,
    transform: `translate(${-anchorX * 100}%, ${-anchorY * 100}%) rotate(${directionDeg + rotateDeg}deg)`,
    transformOrigin: `${anchorX * 100}% ${anchorY * 100}%`,
    width,
  }
}

export const placePartArt = ({
  artScale = 1,
  artTranslateXPct = 0,
  artTranslateYPct = 0,
}: CookieJointPlacement): CSSProperties => ({
  transform: `translate(${artTranslateXPct}%, ${artTranslateYPct}%) scale(${artScale})`,
  transformOrigin: 'center center',
})
