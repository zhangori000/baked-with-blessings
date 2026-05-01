'use client'

import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import React, { startTransition, useEffect, useState } from 'react'

import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'

type ContactSceneryHeroProps = {
  initialSceneryTone?: MenuSceneryTone
}

export function ContactSceneryHero({ initialSceneryTone = 'dawn' }: ContactSceneryHeroProps) {
  const [sceneryTone, setSceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)
  const isSceneChanging = false

  useEffect(() => {
    for (const tone of menuSceneryTones) {
      preloadSceneryAssets(tone)
    }
  }, [])

  const handleSelectScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (isSceneChanging || nextSceneryTone === sceneryTone) return

    preloadSceneryAssets(nextSceneryTone)

    startTransition(() => {
      setSceneryTone(nextSceneryTone)
    })

    setIsSceneryPickerOpen(false)
  }

  return (
    <MenuHero
      eyebrow="Baked with Blessings"
      isSceneryPickerOpen={isSceneryPickerOpen}
      isSceneChanging={isSceneChanging}
      key={sceneryTone}
      onSelectScenery={handleSelectScenery}
      onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
      sceneryTone={sceneryTone}
      summary="Questions, pickup notes, custom order ideas, and event details can all go here."
      title="Contact"
    />
  )
}
