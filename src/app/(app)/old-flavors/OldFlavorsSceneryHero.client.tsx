'use client'

import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import React, { startTransition, useEffect, useState } from 'react'

import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'

type OldFlavorsSceneryHeroProps = {
  initialSceneryTone?: MenuSceneryTone
}

export function OldFlavorsSceneryHero({ initialSceneryTone = 'dawn' }: OldFlavorsSceneryHeroProps) {
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
      eyebrow="Hall of Fame"
      isSceneryPickerOpen={isSceneryPickerOpen}
      isSceneChanging={false}
      onSelectScenery={handleSelectScenery}
      onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
      sceneryTone={sceneryTone}
      summary="Every flavor that has rotated off the menu. Any of them might come back, and all of them can be ordered through Catering."
      title="Old Flavors"
    />
  )
}
