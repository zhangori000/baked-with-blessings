'use client'

import React, { createContext, useContext, useMemo } from 'react'

import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import { useTheme } from '@/providers/Theme'
import { cn } from '@/utilities/cn'

import { createBakeryThemeCssVars } from './createBakeryThemeCssVars'
import {
  bakeryThemeConfig,
  createBakeryThemeApi,
  type BakeryTheme,
  type BakeryThemeConfig,
} from './tokens'

type BakeryThemeContextValue = BakeryTheme

const BakeryThemeContext = createContext<BakeryThemeContextValue | undefined>(undefined)

type BakeryThemeManagerProps = {
  children: React.ReactNode
  className?: string
  theme: BakeryTheme
}

export const BakeryThemeManager = ({ children, className, theme }: BakeryThemeManagerProps) => {
  const themeCssVars = useMemo(() => createBakeryThemeCssVars(theme), [theme])

  return (
    <div
      className={cn(
        'bakeryThemeRoot',
        `bakeryTheme-${theme.activeColorScheme}`,
        `bakeryScene-${theme.activeScene}`,
        className,
      )}
      data-bakery-theme={theme.id}
      data-color-scheme={theme.activeColorScheme}
      data-scene={theme.activeScene}
      style={themeCssVars}
    >
      {children}
    </div>
  )
}

type BakeryThemeProviderProps = {
  children: React.ReactNode
  theme?: BakeryThemeConfig
}

export const BakeryThemeProvider = ({
  children,
  theme = bakeryThemeConfig,
}: BakeryThemeProviderProps) => {
  const { theme: activeColorScheme } = useTheme()
  const [activeScene] = usePersistentMenuSceneTone('classic')
  const resolvedColorScheme = activeColorScheme ?? 'light'

  const themeApi = useMemo(
    () => createBakeryThemeApi(theme, resolvedColorScheme, activeScene),
    [activeScene, resolvedColorScheme, theme],
  )

  return (
    <BakeryThemeContext.Provider value={themeApi}>
      <BakeryThemeManager theme={themeApi}>{children}</BakeryThemeManager>
    </BakeryThemeContext.Provider>
  )
}

export const useBakeryTheme = () => {
  const context = useContext(BakeryThemeContext)

  if (!context) {
    throw new Error('useBakeryTheme must be used within a BakeryThemeProvider')
  }

  return context
}
