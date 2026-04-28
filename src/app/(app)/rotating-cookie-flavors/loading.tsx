import React from 'react'

import { SceneryLoadingShell } from '@/components/scenery/SceneryLoadingShell'

export default function Loading() {
  return (
    <SceneryLoadingShell
      message="Loading cookie flavors..."
      titleWidth="w-[min(24rem,72vw)]"
      variant="posters"
    />
  )
}
