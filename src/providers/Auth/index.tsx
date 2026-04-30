'use client'

import type { CollectionAuthUser } from '@/access/utilities'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { buildCustomerLoginData } from '@/utilities/phone'

type StorefrontCustomer = CollectionAuthUser & {
  email?: null | string
  id: number | string
  name?: null | string
  phone?: null | string
  username?: null | string
}

type ResetPassword = (args: {
  identifier: string
  password: string
  passwordConfirm: string
  verificationCode?: string
}) => Promise<{ recoveryChannel?: 'email' | 'phone'; reset?: boolean; success?: boolean }>

type ForgotPassword = (args: {
  identifier: string
  password?: string
  passwordConfirm?: string
  verificationCode?: string
}) => Promise<{ maskedPhone?: string; recoveryChannel?: 'email' | 'phone'; requiresPhoneVerification?: boolean; reset?: boolean; success?: boolean }>

type Create = (args: {
  email?: string
  name?: string
  password: string
  passwordConfirm: string
  phone?: string
  verificationCode?: string
}) => Promise<{
  maskedEmail?: string
  maskedPhone?: string
  requiresEmailVerification?: boolean
  requiresPhoneVerification?: boolean
  success?: boolean
}>

type Login = (args: { identifier: string; password: string }) => Promise<StorefrontCustomer>

type Logout = () => Promise<void>

type AuthContext = {
  create: Create
  forgotPassword: ForgotPassword
  login: Login
  logout: Logout
  resetPassword: ResetPassword
  setUser: (user: StorefrontCustomer | null) => void
  status: 'loggedIn' | 'loggedOut' | undefined
  user?: StorefrontCustomer | null
}

const Context = createContext({} as AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StorefrontCustomer | null>()

  // used to track the single event of logging in or logging out
  // useful for `useEffect` hooks that should only run once
  const [status, setStatus] = useState<'loggedIn' | 'loggedOut' | undefined>()

  const login = useCallback<Login>(async (args) => {
    try {
      const loginData = buildCustomerLoginData(args.identifier, args.password)

      if (!('email' in loginData) && !('username' in loginData)) {
        throw new Error('Enter a valid email address or phone number.')
      }

      const res = await fetch('/api/customers/login', {
        body: JSON.stringify(loginData),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (res.ok) {
        const { errors, user } = await res.json()
        if (errors) throw new Error(errors[0].message)
        setUser(user)
        setStatus('loggedIn')
        return user as StorefrontCustomer
      }

      throw new Error('Invalid login')
    } catch {
      throw new Error('An error occurred while attempting to login.')
    }
  }, [])

  const create = useCallback<Create>(
    async (args) => {
      try {
        const res = await fetch('/api/customer-auth/signup', {
          body: JSON.stringify(args),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const json = (await res.json()) as {
          maskedEmail?: string
          error?: string
          maskedPhone?: string
          requiresEmailVerification?: boolean
          requiresPhoneVerification?: boolean
          success?: boolean
        }

        if (res.status === 202) {
          return json
        }

        if (!res.ok) {
          throw new Error(json.error || 'There was a problem creating your account.')
        }

        await login({
          identifier: args.phone?.trim() || args.email || '',
          password: args.password,
        })

        return json
      } catch (error) {
        if (error instanceof Error && error.message) {
          throw error
        }

        throw new Error('An error occurred while attempting to create your account.')
      }
    },
    [login],
  )

  const logout = useCallback<Logout>(async () => {
    try {
      const res = await fetch('/api/customers/logout', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (res.ok) {
        setUser(null)
        setStatus('loggedOut')
      } else {
        throw new Error('An error occurred while attempting to logout.')
      }
    } catch {
      throw new Error('An error occurred while attempting to logout.')
    }
  }, [])

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/customers/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        })

        if (res.ok) {
          const { user: meUser } = await res.json()
          setUser((meUser || null) as StorefrontCustomer | null)
          setStatus(meUser ? 'loggedIn' : undefined)
        } else {
          throw new Error('An error occurred while fetching your account.')
        }
      } catch {
        setUser(null)
        setStatus(undefined)
      }
    }

    void fetchMe()
  }, [])

  const forgotPassword = useCallback<ForgotPassword>(async (args) => {
    try {
      const res = await fetch('/api/customer-auth/password-reset', {
        body: JSON.stringify(args),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const json = (await res.json()) as {
        error?: string
        maskedPhone?: string
        recoveryChannel?: 'email' | 'phone'
        requiresPhoneVerification?: boolean
        reset?: boolean
        success?: boolean
      }

      if (!res.ok) {
        throw new Error(json.error || 'There was a problem processing the password reset request.')
      }

      return json
    } catch {
      throw new Error('An error occurred while attempting to recover your account.')
    }
  }, [])

  const resetPassword = useCallback<ResetPassword>(async (args) => {
    try {
      const res = await fetch('/api/customer-auth/password-reset', {
        body: JSON.stringify(args),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const json = (await res.json()) as {
        error?: string
        recoveryChannel?: 'email' | 'phone'
        reset?: boolean
        success?: boolean
      }

      if (!res.ok) {
        throw new Error(json.error || 'There was a problem resetting your password.')
      }

      return json
    } catch {
      throw new Error('An error occurred while attempting to reset your password.')
    }
  }, [])

  return (
    <Context.Provider
      value={{
        create,
        forgotPassword,
        login,
        logout,
        resetPassword,
        setUser,
        status,
        user,
      }}
    >
      {children}
    </Context.Provider>
  )
}

type UseAuth = () => AuthContext

export const useAuth: UseAuth = () => useContext(Context)
