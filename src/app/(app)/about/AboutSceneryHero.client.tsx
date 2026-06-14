'use client'

import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import React, { startTransition, useEffect, useState } from 'react'

import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'

type AboutSceneryHeroProps = {
  initialSceneryTone?: MenuSceneryTone
}

export function AboutSceneryHero({ initialSceneryTone = 'dawn' }: AboutSceneryHeroProps) {
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

    setIsSceneryPickerOpen(false)
    startTransition(() => {
      setSceneryTone(nextSceneryTone)
    })
    preloadSceneryAssets(nextSceneryTone)
  }

  return (
    <MenuHero
      eyebrow="Plymouth, Minnesota"
      isSceneryPickerOpen={isSceneryPickerOpen}
      isSceneChanging={isSceneChanging}
      onSelectScenery={handleSelectScenery}
      onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
      sceneryTone={sceneryTone}
      summary="No storefront, no fixed hours — you order, we bake a small batch, and we meet up to hand it over."
      title="Baked in our home kitchen"
    />
  )
}
