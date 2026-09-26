'use client'

import { type FormEvent, useEffect, useEffectEvent, useRef, useState } from 'react'

import { useAuth } from '@/providers/Auth'

export type CustomerAuthMode = 'create' | 'login'

export type AdminSessionUser = {
  email?: string | null
  id?: number | string
}

type Options = {
  initialMode?: CustomerAuthMode
  onAdminSignedIn?: (user: AdminSessionUser) => void
  onSignedIn?: (kind: CustomerAuthMode) => void
  textsOffered?: boolean
}

const resendDelayMs = 7 * 1000

export const isEmailLike = (value: string) => /\S+@\S+\.\S+/.test(value.trim())

export function useCustomerAuthForm({
  initialMode = 'login',
  onAdminSignedIn,
  onSignedIn,
  textsOffered = false,
}: Options = {}) {
  const { create, login } = useAuth()
  const lastAutoSubmittedCodeRef = useRef('')
  const [mode, setMode] = useState<CustomerAuthMode>(initialMode)
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [createContact, setCreateContact] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createNotice, setCreateNotice] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationRecipient, setVerificationRecipient] = useState('')
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null)
  const [resendSeconds, setResendSeconds] = useState(0)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [smsOptIn, setSmsOptIn] = useState(false)

  const contactIsPhone = Boolean(createContact.trim()) && !isEmailLike(createContact)

  useEffect(() => {
    if (!needsVerification || resendAvailableAt == null) {
      setResendSeconds(0)
      return
    }

    const updateResendSeconds = () => {
      setResendSeconds(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)))
    }

    updateResendSeconds()
    const interval = window.setInterval(updateResendSeconds, 250)

    return () => {
      window.clearInterval(interval)
    }
  }, [needsVerification, resendAvailableAt])

  const clearVerification = () => {
    setNeedsVerification(false)
    setVerificationCode('')
    setVerificationRecipient('')
    setResendAvailableAt(null)
    lastAutoSubmittedCodeRef.current = ''
  }

  const reset = () => {
    setLoginIdentifier('')
    setLoginPassword('')
    setLoginError(null)
    setCreateContact('')
    setCreatePassword('')
    setCreatePasswordConfirm('')
    setCreateError(null)
    setCreateNotice(null)
    setSmsOptIn(false)
    clearVerification()
    setMode('login')
    setShowPassword(false)
  }

  const switchMode = () => {
    setLoginError(null)
    setCreateError(null)
    setCreateNotice(null)
    clearVerification()
    setMode((current) => (current === 'create' ? 'login' : 'create'))
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isLoggingIn) return

    const identifier = loginIdentifier.trim()
    const password = loginPassword.trim()

    if (!identifier || !password) {
      setLoginError('Enter your customer email or phone number and password.')
      return
    }

    setLoginError(null)
    setIsLoggingIn(true)

    try {
      await login({ identifier, password })
      setLoginIdentifier('')
      setLoginPassword('')
      setShowPassword(false)
      onSignedIn?.('login')
    } catch {
      if (onAdminSignedIn && isEmailLike(identifier)) {
        const adminLoginResponse = await fetch('/api/admins/login', {
          body: JSON.stringify({ email: identifier.toLowerCase(), password }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        if (adminLoginResponse.ok) {
          const data = (await adminLoginResponse.json().catch(() => null)) as {
            user?: AdminSessionUser | null
          } | null
          setLoginIdentifier('')
          setLoginPassword('')
          setShowPassword(false)
          onAdminSignedIn(data?.user ?? { email: identifier.toLowerCase() })
          return
        }
      }

      setLoginError('That email, phone, and password combination did not match an account.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const getContactPayload = () => {
    const contact = createContact.trim()
    const isEmailSignup = isEmailLike(contact)

    if (!contact) {
      return { error: 'Enter an email address or phone number first.' }
    }

    if (!isEmailSignup && contact.replace(/\D/g, '').length < 7) {
      return { error: 'Enter a valid email address or phone number.' }
    }

    return {
      contact,
      data: {
        email: isEmailSignup ? contact : undefined,
        phone: isEmailSignup ? undefined : contact,
      },
    }
  }

  const getPasswordError = () => {
    const password = createPassword.trim()
    const passwordConfirm = createPasswordConfirm.trim()

    if (!password || !passwordConfirm) {
      return 'Enter and confirm your password before creating the account.'
    }

    if (password.length < 3) {
      return 'Password must be at least 3 characters.'
    }

    if (password !== passwordConfirm) {
      return 'The password confirmation does not match.'
    }

    return null
  }

  const handleSendCode = async () => {
    if (isCreating || isResending || resendSeconds > 0) return

    const contactPayload = getContactPayload()

    if ('error' in contactPayload) {
      setCreateError(contactPayload.error || 'Enter a valid email address or phone number.')
      return
    }

    setCreateError(null)
    setCreateNotice(null)
    setIsResending(true)

    try {
      const response = await fetch('/api/customer-auth/signup', {
        body: JSON.stringify(contactPayload.data),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json()) as {
        error?: string
        maskedEmail?: string
        maskedPhone?: string
        requiresEmailVerification?: boolean
        requiresPhoneVerification?: boolean
      }

      if (!response.ok) {
        throw new Error(result.error || 'Could not send a verification code.')
      }

      if (result.requiresEmailVerification) {
        setVerificationRecipient(result.maskedEmail || contactPayload.contact)
      } else if (result.requiresPhoneVerification) {
        setVerificationRecipient(result.maskedPhone || contactPayload.contact)
      }

      setNeedsVerification(true)
      setVerificationCode('')
      lastAutoSubmittedCodeRef.current = ''
      setCreateNotice('Verification code sent. You can finish the password fields now.')
      setResendAvailableAt(Date.now() + resendDelayMs)
    } catch (error) {
      setCreateError(
        error instanceof Error && error.message
          ? error.message
          : 'Could not send a verification code. Please try again.',
      )
    } finally {
      setIsResending(false)
    }
  }

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCreating) return

    const password = createPassword.trim()
    const passwordConfirm = createPasswordConfirm.trim()
    const code = verificationCode.trim()
    const contactPayload = getContactPayload()

    if ('error' in contactPayload) {
      setCreateError(contactPayload.error || 'Enter a valid email address or phone number.')
      return
    }

    if (!needsVerification) {
      await handleSendCode()
      return
    }

    const passwordError = getPasswordError()

    if (passwordError) {
      setCreateError(passwordError)
      return
    }

    if (code.length !== 6) {
      setCreateError('Enter the 6-digit verification code.')
      return
    }

    setCreateError(null)
    setCreateNotice(null)
    setIsCreating(true)

    try {
      const result = await create({
        ...contactPayload.data,
        password,
        passwordConfirm,
        smsOptIn: textsOffered && smsOptIn && Boolean(contactPayload.data.phone),
        verificationCode: code,
      })

      if (result.requiresEmailVerification || result.requiresPhoneVerification) {
        setNeedsVerification(true)
        setVerificationRecipient(
          (result.requiresEmailVerification ? result.maskedEmail : result.maskedPhone) ||
            contactPayload.contact,
        )
        setVerificationCode('')
        lastAutoSubmittedCodeRef.current = ''
        setResendAvailableAt(Date.now() + resendDelayMs)
        setCreateNotice(null)
        return
      }

      setCreateContact('')
      setCreatePassword('')
      setCreatePasswordConfirm('')
      setSmsOptIn(false)
      clearVerification()
      setCreateNotice(null)
      setShowPassword(false)
      onSignedIn?.('create')
    } catch (error) {
      setCreateError(
        error instanceof Error && error.message
          ? error.message
          : 'There was a problem creating your account. Please try again.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  const submitFromVerificationCode = useEffectEvent(() => {
    void handleCreateSubmit({ preventDefault: () => undefined } as FormEvent<HTMLFormElement>)
  })

  useEffect(() => {
    if (!needsVerification) {
      lastAutoSubmittedCodeRef.current = ''
      return
    }

    const code = verificationCode.trim()

    if (code.length < 6) {
      lastAutoSubmittedCodeRef.current = ''
      return
    }

    if (isCreating || isResending || lastAutoSubmittedCodeRef.current === code) {
      return
    }

    lastAutoSubmittedCodeRef.current = code
    const timeout = window.setTimeout(() => {
      submitFromVerificationCode()
    }, 120)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    needsVerification,
    createPassword,
    createPasswordConfirm,
    verificationCode,
    isResending,
    isCreating,
  ])

  return {
    contactIsPhone,
    createContact,
    createError,
    createNotice,
    createPassword,
    createPasswordConfirm,
    handleCreateSubmit,
    handleLoginSubmit,
    handleSendCode,
    isCreating,
    isLoggingIn,
    isResending,
    loginError,
    loginIdentifier,
    loginPassword,
    mode,
    needsVerification,
    resendSeconds,
    reset,
    setCreateContact: (value: string) => {
      setCreateContact(value)
      setCreateError(null)
    },
    setCreatePassword,
    setCreatePasswordConfirm,
    setLoginIdentifier,
    setLoginPassword,
    setMode,
    setShowPassword,
    setSmsOptIn,
    setVerificationCode: (value: string) => {
      setVerificationCode(value.replace(/\D/g, '').slice(0, 6))
      setCreateError(null)
    },
    showPassword,
    smsOptIn,
    switchMode,
    textsOffered,
    verificationCode,
    verificationRecipient,
  }
}

export type CustomerAuthFormState = ReturnType<typeof useCustomerAuthForm>
