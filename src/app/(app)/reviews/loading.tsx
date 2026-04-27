import React from 'react'

import { PageResponseSkeleton } from '@/components/PageResponseSkeleton'

export default function Loading() {
  return <PageResponseSkeleton cardCount={5} titleWidth="w-[min(22rem,72vw)]" tone="reviews" />
}
