'use client'

import { EcommerceProvider, useCart, useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { stripeAdapterClient } from '@payloadcms/plugin-ecommerce/payments/stripe'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

export const ECOMMERCE_SESSION_RESET_EVENT = 'bwb:ecommerce-session-reset'

const CartReadyContext = createContext(true)

/**
 * False while a logged-in customer's saved cart is still being adopted — the gap
 * between getUser() resolving (user populated) and the cart id being set. A tap in
 * that window makes addItem mint a NEW cart instead of landing in the saved one;
 * add-to-cart surfaces gate on this so the duplicate is never created.
 */
export const useCartReady = (): boolean => useContext(CartReadyContext)

/**
 * useCart() with the adoption gate folded into isLoading, so every existing
 * `disabled={... isLoading ...}` add-to-cart button waits out the mount-adoption
 * window with no per-button change.
 */
export const useStorefrontCart = () => {
  const cart = useCart()
  const ready = useCartReady()
  return { ...cart, isLoading: cart.isLoading || !ready }
}

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
      <CartReadyGate>{children}</CartReadyGate>
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

const CartReadyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cartID, user } = useEcommerce()
  const savedCartDocs = (user as { cart?: { docs?: unknown[] } } | null)?.cart?.docs
  const hasSavedCart = Array.isArray(savedCartDocs) && savedCartDocs.length > 0
  const adopting = Boolean(user) && !cartID && hasSavedCart

  // Fail-open: if adoption ever stalls, release the gate so add-to-cart can never
  // get stuck disabled. Resets on remount (the session reset bumps providerKey).
  const [releasedAfterTimeout, setReleasedAfterTimeout] = useState(false)
  useEffect(() => {
    if (!adopting) {
      return
    }

    const timer = setTimeout(() => setReleasedAfterTimeout(true), 5000)
    return () => clearTimeout(timer)
  }, [adopting])

  return (
    <CartReadyContext.Provider value={!adopting || releasedAfterTimeout}>
      {children}
    </CartReadyContext.Provider>
  )
}
