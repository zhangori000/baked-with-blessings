'use client'

import {
  useCallback,
  useEffect,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from 'react'

import { menuSceneTones, persistentMenuSceneStorageKey, type SceneTone } from './menuHeroScenery'

const isSceneTone = (value: string): value is SceneTone =>
  menuSceneTones.includes(value as SceneTone)

const persistentMenuSceneChangeEvent = 'baked-with-blessings-menu-scene-change'

const readStoredSceneTone = (fallback: SceneTone): SceneTone => {
  if (typeof window === 'undefined') {
    return fallback
  }

  const storedTone = window.localStorage.getItem(persistentMenuSceneStorageKey)

  return storedTone && isSceneTone(storedTone) ? storedTone : fallback
}

const subscribeToSceneTone = (onStoreChange: () => void) => {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === persistentMenuSceneStorageKey) {
      onStoreChange()
    }
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(persistentMenuSceneChangeEvent, onStoreChange)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(persistentMenuSceneChangeEvent, onStoreChange)
  }
}

export const usePersistentMenuSceneTone = (fallback: SceneTone = 'classic') => {
  const sceneTone = useSyncExternalStore(
    subscribeToSceneTone,
    () => readStoredSceneTone(fallback),
    () => fallback,
  )

  const syncSceneTone = useCallback((nextTone: SceneTone) => {
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

    if (!isSceneTone(window.localStorage.getItem(persistentMenuSceneStorageKey) ?? '')) {
      window.localStorage.setItem(persistentMenuSceneStorageKey, fallback)
      window.dispatchEvent(
        new CustomEvent(persistentMenuSceneChangeEvent, {
          detail: { sceneTone: fallback },
        }),
      )
    }
  }, [fallback])

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
