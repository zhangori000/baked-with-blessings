'use client'

import type React from 'react'

import { cn } from '@/utilities/cn'

import { FlowerSprite } from './FlowerSprite'
import styles from './GrowingGrassBorder.module.css'

type GrowingGrassBorderProps = {
  animate?: boolean
  asset?: string
  className?: string
  flowerPositions?: number[]
  flowerSize?: number | string
  mode?: 'grow' | 'shrink'
  lineClassName?: string
  lineInset?: number | string
  lineHeight?: number | string
  sizes?: string
  style?: React.CSSProperties
}

const defaultFlowerPositions = [28, 72]

const toCssLength = (value: number | string | undefined, fallback: string) => {
  if (value == null) return fallback
  return typeof value === 'number' ? `${value}px` : value
}

export function GrowingGrassBorder({
  animate = true,
  asset = '/flowers/menu-nav-flower.svg',
  className,
  flowerPositions = defaultFlowerPositions,
  flowerSize = '2.6rem',
  mode = 'grow',
  lineClassName,
  lineInset = 0,
  lineHeight = '0.34rem',
  sizes = '40px',
  style,
}: GrowingGrassBorderProps) {
  const normalizedLineHeight = toCssLength(lineHeight, '0.34rem')
  const normalizedLineInset = toCssLength(lineInset, '0rem')
  const normalizedFlowerSize = toCssLength(flowerSize, '2.6rem')

  return (
    <span
      aria-hidden="true"
      className={cn(styles.root, className)}
      data-animate={animate ? 'true' : 'false'}
      data-mode={mode}
      style={
        {
          '--grass-border-height': normalizedLineHeight,
          '--grass-border-inset': normalizedLineInset,
          ...style,
        } as React.CSSProperties
      }
    >
      <span className={cn(styles.line, lineClassName)} />

      {flowerPositions.map((left, index) => (
        <FlowerSprite
          animateIn={animate}
          asset={asset}
          className={styles.flower}
          key={`${left}-${index}`}
          living
          sizes={sizes}
          style={
            {
              '--flower-bob': '0.05rem',
              '--flower-delay': `${0.06 + index * 0.08}s`,
              '--flower-grow-delay': `${260 + index * 70}ms`,
              '--flower-scale': '1.95',
              '--flower-tilt': index % 2 === 0 ? '-2deg' : '3deg',
              left: `${left}%`,
              width: normalizedFlowerSize,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  )
}
