import React from 'react'

import { PageResponseSkeleton } from '@/components/PageResponseSkeleton'

export default function Loading() {
  return (
    <PageResponseSkeleton
      cardCount={5}
      loadingLabel="Loading Community Advice..."
      titleWidth="w-[min(32rem,84vw)]"
      tone="reviews"
    />
  )
}
