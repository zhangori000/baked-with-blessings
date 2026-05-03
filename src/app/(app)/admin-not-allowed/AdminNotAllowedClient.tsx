'use client'

import { BakeryAction, BakeryCard, BakeryPageShell } from '@/design-system/bakery'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function AdminNotAllowedClient() {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch {
      // best-effort; either way we move on
    }
    router.push('/')
    router.refresh()
  }

  const customerLabel = user?.email || user?.name || 'a customer account'

  return (
    <BakeryPageShell as="section" className="adminNotAllowedShell" tone="paper" width="container">
      <BakeryCard className="adminNotAllowedCard" radius="lg" spacing="lg" tone="paper">
        <p className="adminNotAllowedEyebrow">Admin area</p>
        <h1 className="adminNotAllowedTitle">Admin access required</h1>
        {user ? (
          <p className="adminNotAllowedBody">
            You&apos;re currently signed in as <strong>{customerLabel}</strong>, which is a
            customer account. The bakery&apos;s admin panel is only available to admin users.
            Sign out of the customer session below, then sign back in with an admin account.
          </p>
        ) : (
          <p className="adminNotAllowedBody">
            You need to sign in with an admin account to access this area.
          </p>
        )}
        <div className="adminNotAllowedActions">
          {user ? (
            <BakeryAction
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
              variant="primary"
            >
              {isLoggingOut ? 'Signing out…' : 'Sign out of customer account'}
            </BakeryAction>
          ) : (
            <BakeryAction as={Link} href="/admin/login" variant="primary">
              Go to admin sign-in
            </BakeryAction>
          )}
          <BakeryAction as={Link} href="/" variant="secondary">
            Back to homepage
          </BakeryAction>
        </div>
      </BakeryCard>
    </BakeryPageShell>
  )
}
