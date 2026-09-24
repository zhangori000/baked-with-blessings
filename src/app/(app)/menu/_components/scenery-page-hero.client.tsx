'use client'

import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import React, { startTransition, useEffect, useState } from 'react'

import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from './catering-menu-scenery'
import type { MenuSceneryTone } from './catering-menu-types'

type SceneryPageHeroProps = {
  eyebrow: string
  initialSceneryTone?: MenuSceneryTone
  summary: string
  title: string
}

export function SceneryPageHero({
  eyebrow,
  initialSceneryTone = 'dawn',
  summary,
  title,
}: SceneryPageHeroProps) {
  const [sceneryTone, setSceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)

  useEffect(() => {
    for (const tone of menuSceneryTones) {
      preloadSceneryAssets(tone)
    }
  }, [])

  const handleSelectScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (nextSceneryTone === sceneryTone) return

    setIsSceneryPickerOpen(false)
    startTransition(() => {
      setSceneryTone(nextSceneryTone)
    })
    preloadSceneryAssets(nextSceneryTone)
  }

  return (
    <MenuHero
      eyebrow={eyebrow}
      isSceneryPickerOpen={isSceneryPickerOpen}
      isSceneChanging={false}
      onSelectScenery={handleSelectScenery}
      onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
      sceneryTone={sceneryTone}
      summary={summary}
      title={title}
    />
  )
}
