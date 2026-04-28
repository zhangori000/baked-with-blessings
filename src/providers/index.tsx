import { AuthProvider } from '@/providers/Auth'
import {
  BakeryAnnouncerProvider,
  BakeryMediaQueryProvider,
  BakeryThemeProvider,
} from '@/design-system/bakery'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { stripeAdapterClient } from '@payloadcms/plugin-ecommerce/payments/stripe'
import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'

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
                <EcommerceProvider
                  enableVariants={true}
                  customersSlug="customers"
                  api={{
                    cartsFetchQuery: {
                      depth: 2,
                      populate: {
                        products: {
                          slug: true,
                          title: true,
                          gallery: true,
                          inventory: true,
                        },
                        variants: {
                          title: true,
                          inventory: true,
                        },
                      },
                    },
                  }}
                  paymentMethods={[
                    stripeAdapterClient({
                      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
                    }),
                  ]}
                >
                  {children}
                </EcommerceProvider>
              </HeaderThemeProvider>
            </AuthProvider>
          </BakeryMediaQueryProvider>
        </BakeryAnnouncerProvider>
      </BakeryThemeProvider>
    </ThemeProvider>
  )
}
