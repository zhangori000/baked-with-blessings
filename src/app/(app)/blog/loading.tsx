import React from 'react'

import { SceneryLoadingShell } from '@/components/scenery/SceneryLoadingShell'

export default function Loading() {
  return (
    <SceneryLoadingShell
      cardCount={4}
      message="Loading blog..."
      titleWidth="w-[min(18rem,68vw)]"
      variant="list"
    />
  )
}
