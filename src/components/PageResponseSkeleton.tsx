import React from 'react'

import { SceneryLoadingShell } from '@/components/scenery/SceneryLoadingShell'

type PageResponseSkeletonProps = {
  cardCount?: number
  loadingLabel?: string
  titleWidth?: string
  tone?: 'discussion' | 'reviews'
}

export function PageResponseSkeleton({
  cardCount = 4,
  loadingLabel,
  titleWidth = 'w-[min(30rem,78vw)]',
  tone = 'reviews',
}: PageResponseSkeletonProps) {
  return (
    <SceneryLoadingShell
      cardCount={cardCount}
      message={
        loadingLabel ?? (tone === 'discussion' ? 'Loading discussion...' : 'Loading reviews...')
      }
      titleWidth={titleWidth}
      variant="list"
    />
  )
}
