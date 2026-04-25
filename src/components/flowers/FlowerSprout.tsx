'use client'

import type React from 'react'

import { cn } from '@/utilities/cn'

import styles from './FlowerSprout.module.css'

type FlowerSproutProps = {
  animation?: 'grow' | 'living' | 'still'
  className?: string
  edge?: 'bottom' | 'top'
  size?: number | string
  stemLength?: number | string
  style?: React.CSSProperties
  tone?: 'gold' | 'plum' | 'rose' | 'sage' | 'sunflower'
}

const petals = [0, 60, 120, 180, 240, 300]

const toCssLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)

export function FlowerSprout({
  animation = 'living',
  className,
  edge = 'top',
  size = '1.5rem',
  stemLength = '0.82rem',
  style,
  tone = 'sage',
}: FlowerSproutProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        styles.sprout,
        edge === 'top' ? styles.top : styles.bottom,
        animation === 'living' && styles.living,
        animation === 'grow' && styles.grow,
        styles[tone],
        className,
      )}
      style={
        {
          '--sprout-size': toCssLength(size),
          '--sprout-stem-length': toCssLength(stemLength),
          ...style,
        } as React.CSSProperties
      }
    >
      <span className={styles.stem} />
      <span className={styles.head}>
        <span className={styles.flower}>
          {petals.map((rotation) => (
            <span
              className={styles.petal}
              key={rotation}
              style={{ '--petal-rotation': `${rotation}deg` } as React.CSSProperties}
            />
          ))}
          <span className={styles.center} />
        </span>
      </span>
    </span>
  )
}
