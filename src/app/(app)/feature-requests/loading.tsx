import React from 'react'

import { PageResponseSkeleton } from '@/components/PageResponseSkeleton'

export default function Loading() {
  return (
    <PageResponseSkeleton
      cardCount={6}
      loadingLabel="Loading feature requests..."
      titleWidth="w-[min(28rem,80vw)]"
      tone="discussion"
    />
  )
}
