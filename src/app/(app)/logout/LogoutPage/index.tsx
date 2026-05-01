'use client'

import { useAuth } from '@/providers/Auth'
import { customerLoginHref, menuHref } from '@/utilities/routes'
import Link from 'next/link'
import React, { Fragment, useEffect, useState } from 'react'

export const LogoutPage: React.FC = () => {
  const { logout } = useAuth()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(true)

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
        setSuccess("You've successfully signed out.")
      } catch (logoutError) {
        setError(
          logoutError instanceof Error && logoutError.message
            ? logoutError.message
            : 'We could not sign you out. Please try again.',
        )
      } finally {
        setIsLoggingOut(false)
      }
    }

    void performLogout()
  }, [logout])

  return (
    <Fragment>
      {isLoggingOut ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-[#d8cfb6] bg-[#fffaf0] p-6 text-[#2f2414] shadow-[0_18px_48px_rgba(64,45,20,0.12)]"
        >
          <h1 className="mb-2 text-3xl font-bold">Signing out...</h1>
          <p className="m-0 text-base text-[#5d5139]">Clearing your customer session.</p>
        </div>
      ) : null}

      {!isLoggingOut && (error || success) ? (
        <div
          aria-live={error ? 'assertive' : 'polite'}
          className={
            error
              ? 'rounded-2xl border border-[#d99a8b] bg-[#fff4f0] p-6 text-[#5b2218] shadow-[0_18px_48px_rgba(64,45,20,0.12)]'
              : 'rounded-2xl border border-[#b9d39b] bg-[#f1fae8] p-6 text-[#243522] shadow-[0_18px_48px_rgba(64,45,20,0.12)]'
          }
          role={error ? 'alert' : 'status'}
        >
          <h1 className="mb-2 text-3xl font-bold">{error || success}</h1>
          <p className="m-0 text-base">
            <Link className="font-bold underline underline-offset-4" href={menuHref}>
              Return to the menu
            </Link>
            {` or `}
            <Link className="font-bold underline underline-offset-4" href={customerLoginHref}>
              log back in
            </Link>
            .
          </p>
        </div>
      ) : null}
    </Fragment>
  )
}
