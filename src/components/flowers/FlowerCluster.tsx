'use client'

import type React from 'react'

import { cn } from '@/utilities/cn'

import { FlowerSprout } from './FlowerSprout'
import { FlowerSprite } from './FlowerSprite'
import styles from './FlowerCluster.module.css'

type FlowerClusterProps = {
  animation?: 'grow' | 'living' | 'still'
  asset?: string
  assets?: string[]
  bleed?: number | string
  className?: string
  count?: number
  edge?: 'bottom' | 'top'
  flowerClassName?: string
  positions?: number[]
  size?: number | string
  sizes?: string
  style?: React.CSSProperties
  stemLength?: number | string
  tone?: 'gold' | 'plum' | 'rose' | 'sage' | 'sunflower'
  variant?: 'sprout' | 'sprite'
}

const defaultAsset = '/flowers/menu-nav-flower.svg'

const toCssLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)

const buildEvenPositions = (count: number) => {
  if (count <= 1) return [50]
  return Array.from({ length: count }, (_, index) => 14 + (72 * index) / (count - 1))
}

export function FlowerCluster({
  animation = 'living',
  asset = defaultAsset,
  assets,
  bleed = '0.15rem',
  className,
  count = 3,
  edge = 'top',
  flowerClassName,
  positions,
  size = '1.8rem',
  sizes = '40px',
  stemLength = '0.82rem',
  style,
  tone = 'sage',
  variant = 'sprite',
}: FlowerClusterProps) {
  const safeCount = Math.max(1, count)
  const placement = positions?.length ? positions : buildEvenPositions(safeCount)
  const normalizedBleed = toCssLength(bleed)
  const normalizedSize = toCssLength(size)

  return (
    <span
      aria-hidden="true"
      className={cn(styles.cluster, edge === 'top' ? styles.top : styles.bottom, className)}
      style={style}
    >
      {placement.map((left, index) => {
        const flowerAsset = assets?.[index % assets.length] ?? asset
        const baseStyle: React.CSSProperties = {
          left: `${left}%`,
          width: normalizedSize,
          ...(edge === 'top'
            ? { bottom: `calc(100% - ${normalizedBleed})` }
            : { top: `calc(100% - ${normalizedBleed})` }),
        }

        if (animation === 'living') {
          baseStyle['--flower-bob' as keyof React.CSSProperties] = `${0.12 + (index % 3) * 0.03}rem`
          baseStyle['--flower-delay' as keyof React.CSSProperties] = `${index * 0.08}s`
          baseStyle['--flower-scale' as keyof React.CSSProperties] = `${0.92 + (index % 4) * 0.08}`
          baseStyle['--flower-tilt' as keyof React.CSSProperties] = `${index % 2 === 0 ? 2 : 3}deg`
        }

        return (
          variant === 'sprout' ? (
            <FlowerSprout
              animation={animation}
              className={flowerClassName}
              edge={edge}
              key={`${tone}-${edge}-${index}`}
              size={normalizedSize}
              stemLength={stemLength}
              style={{
                ...baseStyle,
                '--sprout-bob': `${0.05 + (index % 2) * 0.02}rem`,
                '--sprout-delay': `${index * 0.08}s`,
                '--sprout-tilt': `${index % 2 === 0 ? 2 : 3}deg`,
                '--sprout-anchor-offset': edge === 'top'
                  ? `calc(100% - ${normalizedBleed})`
                  : `calc(100% - ${normalizedBleed})`,
              } as React.CSSProperties}
              tone={tone}
            />
          ) : (
            <FlowerSprite
              animateIn={animation === 'grow'}
              asset={flowerAsset}
              className={flowerClassName}
              key={`${flowerAsset}-${edge}-${index}`}
              living={animation === 'living'}
              sizes={sizes}
              style={baseStyle}
            />
          )
        )
      })}
    </span>
  )
}
