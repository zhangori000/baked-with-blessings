'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
} from 'react'

export type BakeryMediaSettings = {
  colorScheme?: 'dark' | 'light'
  contrast?: 'less' | 'more' | 'no-preference'
  fontSize?: number
  height?: number
  width?: number
}

export const bakeryMediaQueries = {
  desktop: '(min-width: 1024px)',
  phone: '(max-width: 767px)',
  tabletUp: '(min-width: 768px)',
} as const

const bakeryDefaultMediaSettings: BakeryMediaSettings = {
  colorScheme: 'light',
  width: 1024,
}

type BakeryMediaQueryContextValue = {
  getServerSnapshot: (query: string) => boolean
  getSnapshot: (query: string) => boolean
  subscribe: (query: string, callback: () => void) => () => void
}

const BakeryMediaQueryContext = createContext<BakeryMediaQueryContextValue | null>(null)

type BakeryMediaQueryProviderProps = {
  children: React.ReactNode
  defaultValues?: BakeryMediaSettings
}

type BakeryMediaQueryEntry = {
  listener: () => void
  mediaQueryList: MediaQueryList
  subscribers: Set<() => void>
}

const addMediaQueryListener = (mediaQueryList: MediaQueryList, callback: () => void) => {
  if (mediaQueryList.addEventListener) {
    mediaQueryList.addEventListener('change', callback)
    return
  }

  mediaQueryList.addListener(callback)
}

const removeMediaQueryListener = (mediaQueryList: MediaQueryList, callback: () => void) => {
  if (mediaQueryList.removeEventListener) {
    mediaQueryList.removeEventListener('change', callback)
    return
  }

  mediaQueryList.removeListener(callback)
}

const getMediaPixelValue = (value: string, fontSize = 16): number => {
  const trimmedValue = value.trim()
  const numericValue = Number.parseFloat(trimmedValue)

  if (Number.isNaN(numericValue)) {
    throw new Error(`getMediaPixelValue failed to parse value: "${value}"`)
  }

  if (trimmedValue.endsWith('em') || trimmedValue.endsWith('rem')) {
    return numericValue * fontSize
  }

  if (trimmedValue.endsWith('px')) {
    return numericValue
  }

  throw new Error(`getMediaPixelValue only supports px, em, and rem values: "${value}"`)
}

const defaultMediaQuerySolvers: Record<
  string,
  (value: string, defaultValues: BakeryMediaSettings) => boolean
> = {
  height: (height, defaultValues) => {
    if (typeof defaultValues.height === 'undefined') return false
    return defaultValues.height === getMediaPixelValue(height, defaultValues.fontSize)
  },
  'max-height': (height, defaultValues) => {
    if (typeof defaultValues.height === 'undefined') return false
    return defaultValues.height <= getMediaPixelValue(height, defaultValues.fontSize)
  },
  'max-width': (width, defaultValues) => {
    if (typeof defaultValues.width === 'undefined') return false
    return defaultValues.width <= getMediaPixelValue(width, defaultValues.fontSize)
  },
  'min-height': (height, defaultValues) => {
    if (typeof defaultValues.height === 'undefined') return false
    return defaultValues.height >= getMediaPixelValue(height, defaultValues.fontSize)
  },
  'min-width': (width, defaultValues) => {
    if (typeof defaultValues.width === 'undefined') return false
    return defaultValues.width >= getMediaPixelValue(width, defaultValues.fontSize)
  },
  'prefers-color-scheme': (colorScheme, defaultValues) => {
    if (typeof defaultValues.colorScheme === 'undefined') return colorScheme === 'light'
    return defaultValues.colorScheme === colorScheme
  },
  'prefers-contrast': (contrast, defaultValues) => {
    if (typeof defaultValues.contrast === 'undefined') return contrast === 'no-preference'
    return defaultValues.contrast === contrast
  },
  width: (width, defaultValues) => {
    if (typeof defaultValues.width === 'undefined') return false
    return defaultValues.width === getMediaPixelValue(width, defaultValues.fontSize)
  },
}

const solveMediaQueryDefaults = (query: string, defaultValues: BakeryMediaSettings) => {
  const queryParts = query.split(' and ')

  for (const queryPart of queryParts) {
    const trimmedPart = queryPart.trim()
    const conditionValueString =
      trimmedPart.startsWith('(') && trimmedPart.endsWith(')')
        ? trimmedPart.slice(1, -1).trim()
        : trimmedPart

    if (!conditionValueString) return false

    const [condition, value] = conditionValueString.split(':').map((part) => part?.trim())

    if (!condition || !value) return false

    const result = defaultMediaQuerySolvers[condition]?.(value, defaultValues)

    if (!result) return false
  }

  return true
}

export const createBakeryMediaQueryStore = (
  defaultValues: BakeryMediaSettings = bakeryDefaultMediaSettings,
): BakeryMediaQueryContextValue => {
  const entries = new Map<string, BakeryMediaQueryEntry>()

  const getSnapshot = (query: string) =>
    entries.get(query)?.mediaQueryList.matches ?? solveMediaQueryDefaults(query, defaultValues)

  const getServerSnapshot = (query: string) => solveMediaQueryDefaults(query, defaultValues)

  const subscribe = (query: string, callback: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return () => undefined
    }

    let entry = entries.get(query)

    if (!entry) {
      const mediaQueryList = window.matchMedia(query)
      const subscribers = new Set<() => void>()
      const listener = () => {
        subscribers.forEach((subscriber) => {
          subscriber()
        })
      }

      entry = {
        listener,
        mediaQueryList,
        subscribers,
      }

      entries.set(query, entry)
      addMediaQueryListener(mediaQueryList, listener)
    }

    entry.subscribers.add(callback)

    return () => {
      const activeEntry = entries.get(query)

      if (!activeEntry) {
        return
      }

      activeEntry.subscribers.delete(callback)

      if (activeEntry.subscribers.size > 0) {
        return
      }

      removeMediaQueryListener(activeEntry.mediaQueryList, activeEntry.listener)
      entries.delete(query)
    }
  }

  return {
    getServerSnapshot,
    getSnapshot,
    subscribe,
  }
}

export const BakeryMediaQueryProvider = ({
  children,
  defaultValues = bakeryDefaultMediaSettings,
}: BakeryMediaQueryProviderProps) => {
  const [store] = useState(() => createBakeryMediaQueryStore(defaultValues))

  return (
    <BakeryMediaQueryContext.Provider value={store}>{children}</BakeryMediaQueryContext.Provider>
  )
}

export const useBakeryMediaQuery = (query: string) => {
  const context = useContext(BakeryMediaQueryContext)

  if (!context) {
    throw new Error('useBakeryMediaQuery must be used within a BakeryMediaQueryProvider')
  }

  const { getServerSnapshot, getSnapshot, subscribe } = context
  const subscribeToQuery = useCallback(
    (callback: () => void) => subscribe(query, callback),
    [query, subscribe],
  )
  const getQuerySnapshot = useCallback(() => getSnapshot(query), [getSnapshot, query])
  const getQueryServerSnapshot = useCallback(
    () => getServerSnapshot(query),
    [getServerSnapshot, query],
  )

  return useSyncExternalStore(subscribeToQuery, getQuerySnapshot, getQueryServerSnapshot)
}
