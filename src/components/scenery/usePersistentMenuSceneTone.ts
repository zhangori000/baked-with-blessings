'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

import { menuSceneTones, persistentMenuSceneStorageKey, type SceneTone } from './menuHeroScenery'
import { defaultMenuScene, menuSceneLoadingTokens } from './menuSceneLoadingTokens'

const isSceneTone = (value: string): value is SceneTone =>
  menuSceneTones.includes(value as SceneTone)

const persistentMenuSceneChangeEvent = 'baked-with-blessings-menu-scene-change'
const persistentMenuSceneCookieMaxAge = 60 * 60 * 24 * 365
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const applyDocumentSceneTone = (sceneTone: SceneTone) => {
  if (typeof document === 'undefined') {
    return
  }

  const tokens = menuSceneLoadingTokens[sceneTone] ?? menuSceneLoadingTokens[defaultMenuScene]
  const root = document.documentElement

  root.setAttribute('data-menu-scene', sceneTone)
  root.style.setProperty('--route-loading-background', tokens.background)
  root.style.setProperty('--route-loading-sky', tokens.sky)
  root.style.setProperty('--route-loading-sky-mobile', tokens.skyMobile)
  root.style.setProperty('--route-loading-meadow', tokens.meadow)
  root.style.setProperty('--route-loading-overlay', tokens.overlay)
  root.style.setProperty('--route-loading-banner-bg', tokens.bannerBackground)
  root.style.setProperty('--route-loading-banner-color', tokens.bannerColor)
}

const writeSceneToneCookie = (sceneTone: SceneTone) => {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${persistentMenuSceneStorageKey}=${encodeURIComponent(
    sceneTone,
  )}; Max-Age=${persistentMenuSceneCookieMaxAge}; Path=/; SameSite=Lax`
}

export const usePersistentMenuSceneTone = (fallback: SceneTone = 'dawn') => {
  const [sceneTone, setSceneTone] = useState<SceneTone>(fallback)

  const syncSceneTone = useCallback((nextTone: SceneTone) => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(persistentMenuSceneStorageKey, nextTone)
    applyDocumentSceneTone(nextTone)
    writeSceneToneCookie(nextTone)
    setSceneTone(nextTone)
    window.dispatchEvent(
      new CustomEvent(persistentMenuSceneChangeEvent, {
        detail: { sceneTone: nextTone },
      }),
    )
  }, [])

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncFromStorage = () => {
      const storedValue = window.localStorage.getItem(persistentMenuSceneStorageKey)
      const storedTone = storedValue && isSceneTone(storedValue) ? storedValue : null
      const nextTone = storedTone ?? fallback

      if (!storedTone) {
        window.localStorage.setItem(persistentMenuSceneStorageKey, nextTone)
      }

      applyDocumentSceneTone(nextTone)
      writeSceneToneCookie(nextTone)
      setSceneTone(nextTone)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === persistentMenuSceneStorageKey) {
        syncFromStorage()
      }
    }

    syncFromStorage()
    window.addEventListener('storage', handleStorage)
    window.addEventListener(persistentMenuSceneChangeEvent, syncFromStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(persistentMenuSceneChangeEvent, syncFromStorage)
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
