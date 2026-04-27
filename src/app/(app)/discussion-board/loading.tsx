import React from 'react'

import { PageResponseSkeleton } from '@/components/PageResponseSkeleton'

export default function Loading() {
  return (
    <PageResponseSkeleton
      cardCount={6}
      titleWidth="w-[min(34rem,84vw)]"
      tone="discussion"
    />
  )
}
