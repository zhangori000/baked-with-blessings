'use client'

import React, { createContext, useContext } from 'react'

import type { ThemeContextType } from './types'

import { storefrontTheme } from './shared'

const themeContextValue: ThemeContextType = { theme: storefrontTheme }

const ThemeContext = createContext<ThemeContextType>(themeContextValue)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={themeContextValue}>{children}</ThemeContext.Provider>
)

export const useTheme = (): ThemeContextType => useContext(ThemeContext)
