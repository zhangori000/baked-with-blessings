import React from 'react'

import { SceneryLoadingShell } from '@/components/scenery/SceneryLoadingShell'

export default function Loading() {
  return (
    <SceneryLoadingShell
      message="Loading catering menu..."
      titleWidth="w-[min(30rem,80vw)]"
      variant="menu"
    />
  )
}
