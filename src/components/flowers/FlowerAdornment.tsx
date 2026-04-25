'use client'

import type React from 'react'

import { cn } from '@/utilities/cn'

import { FlowerCluster } from './FlowerCluster'
import styles from './FlowerAdornment.module.css'

type FlowerAdornmentCluster = React.ComponentProps<typeof FlowerCluster> & {
  id?: string
}

type FlowerAdornmentProps = {
  children: React.ReactNode
  className?: string
  clusters: FlowerAdornmentCluster[]
  inline?: boolean
}

export function FlowerAdornment({
  children,
  className,
  clusters,
  inline = false,
}: FlowerAdornmentProps) {
  return (
    <span className={cn(styles.root, inline && styles.inline, className)}>
      <span className={styles.surface}>
        {clusters.map((cluster, index) => (
          <FlowerCluster key={cluster.id ?? `${cluster.edge ?? 'top'}-${index}`} {...cluster} />
        ))}
        <span className={styles.content}>{children}</span>
      </span>
    </span>
  )
}
