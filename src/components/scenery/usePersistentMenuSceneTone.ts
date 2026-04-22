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
  const [sceneTone, setSceneTone] = useState<SceneTone>(fallback)
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedTone = window.localStorage.getItem(persistentMenuSceneStorageKey)

    if (storedTone && isSceneTone(storedTone)) {
      setSceneTone(storedTone)
    } else {
      window.localStorage.setItem(persistentMenuSceneStorageKey, fallback)
    }

    setHasHydratedStorage(true)
  }, [fallback])

  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydratedStorage) {
      return
    }

    window.localStorage.setItem(persistentMenuSceneStorageKey, sceneTone)
  }, [hasHydratedStorage, sceneTone])

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
