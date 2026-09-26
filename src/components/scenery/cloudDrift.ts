import './cloud-drift.css'
import type { CSSProperties } from 'react'

const driftDurations = [78, 64, 92, 70, 86, 60] as const

const cloudJourneyFraction = (leftFraction: number) =>
  Math.min(0.98, Math.max(0.02, (leftFraction + 0.2) / 1.25))

const readHorizontalPosition = (className: string): number | null => {
  const tokens = className.split(/\s+/).filter((token) => !token.includes(':'))

  for (const token of tokens) {
    const match = /^(left|right)-\[(-?[\d.]+)%\]$/.exec(token)

    if (!match) {
      continue
    }

    const value = Number.parseFloat(match[2] ?? '0') / 100

    return match[1] === 'left' ? value : 1 - value - 0.18
  }

  return null
}

const driftVars = (duration: number, fraction: number, left: string): CSSProperties =>
  ({
    ['--cloud-drift-delay' as string]: `${(-duration * fraction).toFixed(2)}s`,
    ['--cloud-drift-duration' as string]: `${duration}s`,
    ['--cloud-left' as string]: left,
  }) as CSSProperties

const withoutAnimationTiming = (style: CSSProperties = {}): CSSProperties => {
  const { animationDelay: _delay, animationDuration: _duration, ...rest } = style

  return rest
}

export const buildStaticCloudDriftStyle = (
  className: string,
  index: number,
  style?: CSSProperties,
): CSSProperties => {
  const left = readHorizontalPosition(className) ?? (index * 0.29 + 0.1) % 1
  const duration = driftDurations[index % driftDurations.length] ?? 110

  return {
    ...withoutAnimationTiming(style),
    ...driftVars(duration, cloudJourneyFraction(left), `${(left * 100).toFixed(1)}%`),
  }
}

export const buildSpawnedCloudDriftStyle = (left: string, style?: CSSProperties): CSSProperties => {
  const leftFraction = Number.parseFloat(left) / 100
  const duration = 56 + Math.round(Math.random() * 26)
  const { left: _left, ...rest } = withoutAnimationTiming(style)

  return {
    ...rest,
    ...driftVars(
      duration,
      cloudJourneyFraction(Number.isFinite(leftFraction) ? leftFraction : 0.5),
      left,
    ),
  }
}
