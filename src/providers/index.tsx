import { AuthProvider } from '@/providers/Auth'
import {
  BakeryAnnouncerProvider,
  BakeryMediaQueryProvider,
  BakeryThemeProvider,
} from '@/design-system/bakery'
import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'
import { StorefrontEcommerceProvider } from '@/providers/Ecommerce'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <BakeryThemeProvider>
        <BakeryAnnouncerProvider>
          <BakeryMediaQueryProvider>
            <AuthProvider>
              <HeaderThemeProvider>
                <SonnerProvider />
                <StorefrontEcommerceProvider>
                  {children}
                </StorefrontEcommerceProvider>
              </HeaderThemeProvider>
            </AuthProvider>
          </BakeryMediaQueryProvider>
        </BakeryAnnouncerProvider>
      </BakeryThemeProvider>
    </ThemeProvider>
  )
}
