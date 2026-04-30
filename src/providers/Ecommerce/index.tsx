'use client'

import { EcommerceProvider, useCart, useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { stripeAdapterClient } from '@payloadcms/plugin-ecommerce/payments/stripe'
import React, { useEffect, useRef, useState } from 'react'

export const ECOMMERCE_SESSION_RESET_EVENT = 'bwb:ecommerce-session-reset'

export const StorefrontEcommerceProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [providerKey, setProviderKey] = useState(0)

  useEffect(() => {
    const handleSessionReset = () => {
      setProviderKey((current) => current + 1)
    }

    window.addEventListener(ECOMMERCE_SESSION_RESET_EVENT, handleSessionReset)

    return () => {
      window.removeEventListener(ECOMMERCE_SESSION_RESET_EVENT, handleSessionReset)
    }
  }, [])

  return (
    <EcommerceProvider
      key={providerKey}
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
          select: {
            items: true,
            purchasedAt: true,
            subtotal: true,
          },
        },
      }}
      paymentMethods={[
        stripeAdapterClient({
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        }),
      ]}
    >
      <PurchasedCartSessionGuard />
      {children}
    </EcommerceProvider>
  )
}

const PurchasedCartSessionGuard: React.FC = () => {
  const { cart } = useCart()
  const { clearSession } = useEcommerce()
  const hasResetPurchasedCart = useRef(false)
  const purchasedAt = (cart as { purchasedAt?: null | string } | undefined)?.purchasedAt

  useEffect(() => {
    if (!purchasedAt || hasResetPurchasedCart.current) {
      return
    }

    hasResetPurchasedCart.current = true
    clearSession()
    window.dispatchEvent(new Event(ECOMMERCE_SESSION_RESET_EVENT))
  }, [clearSession, purchasedAt])

  return null
}
