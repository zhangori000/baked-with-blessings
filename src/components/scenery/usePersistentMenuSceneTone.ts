'use client'

import { useEffect, useState } from 'react'

import {
  menuSceneTones,
  persistentMenuSceneStorageKey,
  type SceneTone,
} from './menuHeroScenery'

const isSceneTone = (value: string): value is SceneTone =>
  menuSceneTones.includes(value as SceneTone)

export const usePersistentMenuSceneTone = (fallback: SceneTone = 'classic') => {
  const [sceneTone, setSceneTone] = useState<SceneTone>(() => {
    if (typeof window === 'undefined') {
      return fallback
    }

    const storedTone = window.localStorage.getItem(persistentMenuSceneStorageKey)
    return storedTone && isSceneTone(storedTone) ? storedTone : fallback
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(persistentMenuSceneStorageKey, sceneTone)
  }, [sceneTone])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== persistentMenuSceneStorageKey || !event.newValue || !isSceneTone(event.newValue)) {
        return
      }

      setSceneTone(event.newValue)
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return [sceneTone, setSceneTone] as const
}
