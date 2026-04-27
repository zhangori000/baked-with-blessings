'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { Theme, ThemeContextType } from './types'

import { canUseDOM } from '@/utilities/canUseDOM'
import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from './shared'
import { themeIsValid } from './types'

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

const applyThemeVariables = (themeToSet: Theme) => {
  document.documentElement.style.setProperty(
    '--background',
    themeToSet === 'dark' ? '#020e2f' : '#d8ecfb',
  )
}

const resolveInitialTheme = (): Theme | undefined => {
  if (!canUseDOM) {
    return undefined
  }

  const preference = window.localStorage.getItem(themeLocalStorageKey)

  if (themeIsValid(preference)) {
    return preference
  }

  return getImplicitPreference() ?? defaultTheme
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme | undefined>(resolveInitialTheme)

  const setTheme = useCallback((themeToSet: Theme | null) => {
    if (themeToSet === null) {
      window.localStorage.removeItem(themeLocalStorageKey)
      const nextTheme = getImplicitPreference() ?? defaultTheme
      document.documentElement.setAttribute('data-theme', nextTheme)
      applyThemeVariables(nextTheme)
      setThemeState(nextTheme)
    } else {
      setThemeState(themeToSet)
      window.localStorage.setItem(themeLocalStorageKey, themeToSet)
      document.documentElement.setAttribute('data-theme', themeToSet)
      applyThemeVariables(themeToSet)
    }
  }, [])

  useEffect(() => {
    if (!theme) {
      return
    }

    document.documentElement.setAttribute('data-theme', theme)
    applyThemeVariables(theme)
  }, [theme])

  return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => useContext(ThemeContext)
