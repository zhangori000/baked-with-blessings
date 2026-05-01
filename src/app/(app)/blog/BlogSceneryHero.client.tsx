'use client'

import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import React, { startTransition, useEffect, useState } from 'react'

import {
  MenuHero,
  menuSceneryTones,
  preloadSceneryAssets,
} from '../menu/_components/catering-menu-scenery'
import type { MenuSceneryTone } from '../menu/_components/catering-menu-types'

type BlogSceneryHeroProps = {
  eyebrow: string
  initialSceneryTone?: MenuSceneryTone
  summary: string
  title: string
}

export function BlogSceneryHero({
  eyebrow,
  initialSceneryTone = 'dawn',
  summary,
  title,
}: BlogSceneryHeroProps) {
  const [sceneryTone, setSceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const [isSceneryPickerOpen, setIsSceneryPickerOpen] = useState(false)
  const isSceneChanging = false

  useEffect(() => {
    for (const tone of menuSceneryTones) {
      preloadSceneryAssets(tone)
    }
  }, [])

  const handleSelectScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (isSceneChanging || nextSceneryTone === sceneryTone) {
      return
    }

    preloadSceneryAssets(nextSceneryTone)

    startTransition(() => {
      setSceneryTone(nextSceneryTone)
    })

    setIsSceneryPickerOpen(false)
  }

  return (
    <MenuHero
      eyebrow={eyebrow}
      isSceneryPickerOpen={isSceneryPickerOpen}
      isSceneChanging={isSceneChanging}
      key={sceneryTone}
      onSelectScenery={handleSelectScenery}
      onToggleSceneryPicker={() => setIsSceneryPickerOpen((current) => !current)}
      sceneryTone={sceneryTone}
      summary={summary}
      title={title}
    />
  )
}
