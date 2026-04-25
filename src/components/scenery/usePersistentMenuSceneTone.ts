'use client'

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'

import {
  menuSceneTones,
  persistentMenuSceneStorageKey,
  type SceneTone,
} from './menuHeroScenery'

const isSceneTone = (value: string): value is SceneTone =>
  menuSceneTones.includes(value as SceneTone)

const persistentMenuSceneChangeEvent = 'baked-with-blessings-menu-scene-change'

export const usePersistentMenuSceneTone = (fallback: SceneTone = 'classic') => {
  const [sceneTone, setSceneTone] = useState<SceneTone>(fallback)
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false)

  const syncSceneTone = useCallback((nextTone: SceneTone) => {
    setSceneTone(nextTone)

    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(persistentMenuSceneStorageKey, nextTone)
    window.dispatchEvent(
      new CustomEvent(persistentMenuSceneChangeEvent, {
        detail: { sceneTone: nextTone },
      }),
    )
  }, [])

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

    const handleSceneToneChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ sceneTone?: string }>
      const nextTone = customEvent.detail?.sceneTone

      if (!nextTone || !isSceneTone(nextTone)) {
        return
      }

      setSceneTone(nextTone)
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(persistentMenuSceneChangeEvent, handleSceneToneChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(persistentMenuSceneChangeEvent, handleSceneToneChange as EventListener)
    }
  }, [])

  const updateSceneTone = useCallback<Dispatch<SetStateAction<SceneTone>>>(
    (value) => {
      const nextTone = typeof value === 'function' ? value(sceneTone) : value

      if (!isSceneTone(nextTone)) {
        return
      }

      syncSceneTone(nextTone)
    },
    [sceneTone, syncSceneTone],
  )

  return [sceneTone, updateSceneTone] as const
}
