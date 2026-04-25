'use client'

import Image from 'next/image'
import type React from 'react'

import styles from './ProgressBloom.module.css'

type ProgressBloomProps = {
  left: string
  src?: string
  style?: React.CSSProperties
}

export function ProgressBloom({
  left,
  src = '/flowers/menu-nav-flower.svg',
  style,
}: ProgressBloomProps) {
  return (
    <span aria-hidden="true" className={styles.bloom} style={{ left, ...style }}>
      <Image
        alt=""
        aria-hidden="true"
        className={styles.image}
        height={80}
        src={src}
        unoptimized
        width={80}
      />
    </span>
  )
}
