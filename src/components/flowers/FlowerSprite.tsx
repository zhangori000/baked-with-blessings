'use client'

import Image from 'next/image'
import { cn } from '@/utilities/cn'
import type React from 'react'

import styles from './FlowerSprite.module.css'

type FlowerSpriteProps = {
  asset: string
  animateIn?: boolean
  className?: string
  living?: boolean
  sizes?: string
  style?: React.CSSProperties
}

export function FlowerSprite({
  asset,
  animateIn = false,
  className,
  living = false,
  sizes = '64px',
  style,
}: FlowerSpriteProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.sprite, living && styles.living, className)}
      style={style}
    >
      <Image
        alt=""
        aria-hidden="true"
        className={cn(styles.image, animateIn && styles.growIn)}
        height={160}
        sizes={sizes}
        src={asset}
        unoptimized
        width={160}
      />
    </span>
  )
}
