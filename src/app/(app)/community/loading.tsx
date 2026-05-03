import React from 'react'

import { PageResponseSkeleton } from '@/components/PageResponseSkeleton'

export default function Loading() {
  return (
    <PageResponseSkeleton
      cardCount={9}
      loadingLabel="Pinning notes to the wall..."
      titleWidth="w-[min(28rem,80vw)]"
      tone="discussion"
    />
  )
}
