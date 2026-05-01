import React from 'react'

import { SceneryLoadingShell } from '@/components/scenery/SceneryLoadingShell'

export default function Loading() {
  return (
    <SceneryLoadingShell
      cardCount={3}
      message="Loading blog post..."
      titleWidth="w-[min(30rem,82vw)]"
      variant="list"
    />
  )
}
