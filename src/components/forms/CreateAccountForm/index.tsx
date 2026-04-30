'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { customerLoginHref } from '@/utilities/routes'
import { ArrowRight, Mail, ShieldCheck, Smartphone, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import styles from './index.module.css'

type FormData = {
  email: string
  name: string
  password: string
  passwordConfirm: string
  phone: string
  verificationCode: string
}

const contactRequirementMessage = 'Enter at least an email address or a phone number.'

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const { create } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<null | string>(null)
  const [maskedEmail, setMaskedEmail] = useState<null | string>(null)
  const [maskedPhone, setMaskedPhone] = useState<null | string>(null)
  const [verificationMode, setVerificationMode] = useState<null | 'email' | 'phone'>(null)

  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError: setFieldError,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')
  const emailValue = watch('email', '')
  const phoneValue = watch('phone', '')
  const verificationCode = watch('verificationCode', '')
  const isEmailVerification = verificationMode === 'email'
  const isPhoneVerification = verificationMode === 'phone'
  const verificationRecipient =
    (isPhoneVerification ? maskedPhone : maskedEmail) || emailValue || phoneValue || 'your contact method'

  useEffect(() => {
    if (emailValue.trim() || phoneValue.trim()) {
      if (errors.email?.type === 'contact-required') clearErrors('email')
      if (errors.phone?.type === 'contact-required') clearErrors('phone')
    }
  }, [clearErrors, emailValue, errors.email?.type, errors.phone?.type, phoneValue])

  const resetVerificationMode = useCallback(() => {
    setVerificationMode(null)
    setMaskedEmail(null)
    setMaskedPhone(null)
  }, [])

  const primaryActionLabel = useMemo(() => {
    if (loading) return 'Processing'
    if (verificationMode) return 'Verify code and create account'
    if (phoneValue.trim()) return 'Send verification code'
    if (emailValue.trim() && !phoneValue.trim()) return 'Send verification code'
    return 'Create account'
  }, [emailValue, loading, phoneValue, verificationMode])

  const onSubmit = useCallback(
    async (data: FormData) => {
      const redirect = searchParams.get('redirect')
      const trimmedEmail = data.email.trim()
      const trimmedPhone = data.phone.trim()

      setSubmitError(null)

      if (!trimmedEmail && !trimmedPhone) {
        setFieldError('email', {
          type: 'contact-required',
          message: contactRequirementMessage,
        })
        setFieldError('phone', {
          type: 'contact-required',
          message: contactRequirementMessage,
        })
        return
      }

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        const result = await create(data)
        clearTimeout(timer)

        if (result.requiresPhoneVerification) {
          resetVerificationMode()
          setMaskedPhone(result.maskedPhone || data.phone)
          setVerificationMode('phone')
          setLoading(false)
          return
        }

        if (result.requiresEmailVerification) {
          resetVerificationMode()
          setMaskedEmail(result.maskedEmail || data.email)
          setVerificationMode('email')
          setLoading(false)
          return
        }

        if (redirect) router.push(redirect)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch (_) {
        clearTimeout(timer)
        setLoading(false)
        setSubmitError('There was an error with the credentials provided. Please try again.')
      }
    },
    [create, router, searchParams, setFieldError],
  )

  const emailRegistration = register('email', {
    validate: (value) =>
      !value.trim() || /\S+@\S+\.\S+/.test(value) || 'Enter a valid email address.',
  })
  const phoneRegistration = register('phone')

  return (
    <form className={styles.shell} onSubmit={handleSubmit(onSubmit)}>
      <section className={styles.hero}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Customer account
          </span>
          <span className={styles.pill}>At least one contact method is required</span>
        </div>

        <h1 className={styles.title}>Create your account with email, phone, or both.</h1>

        <p className={styles.lead}>
          Choose the login path that fits you. Email-only signup works today, and phone signup
          adds a one-time 6-digit verification step before the account is created.
        </p>

        <div className={styles.heroMeta}>
          <div className={styles.heroMetaItem}>
            <strong>Email</strong>: good for customers who prefer inbox-based login and recovery.
          </div>
          <div className={styles.heroMetaItem}>
            <strong>Phone</strong>: verifies the number once, then lets the customer log in with
            phone and password.
          </div>
        </div>
      </section>

      <Message error={submitError} />

      <section className={styles.formCard}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Profile</h2>
              <p className={styles.sectionHint}>A display name helps you recognize the account later.</p>
            </div>
          </div>

          <div className={styles.stack}>
            <FormItem>
              <Label htmlFor="name" className={styles.fieldLabel}>
                <UserRound size={16} />
                Name
              </Label>
              <Input
                id="name"
                autoComplete="name"
                className={styles.input}
                placeholder="Apple Smith"
                {...register('name')}
                type="text"
              />
              <span className={styles.helper}>Optional, but recommended if you want a friendly account name.</span>
              {errors.name && <FormError message={errors.name.message} />}
            </FormItem>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Contact methods</h2>
              <p className={styles.sectionHint}>
                Add an email, a phone number, or both. You do not need both to create the account.
              </p>
            </div>
          </div>

          <div className={styles.grid}>
            <FormItem>
              <Label htmlFor="email" className={styles.fieldLabel}>
                <Mail size={16} />
                Email address
                <span className={styles.optionalLabel}>optional</span>
              </Label>
            <Input
              id="email"
              autoComplete="email"
              className={styles.input}
              placeholder="apple@example.com"
              {...emailRegistration}
              onChange={(event) => {
                emailRegistration.onChange(event)
                clearErrors(['email', 'phone'])
                resetVerificationMode()
              }}
              type="email"
            />
              <span className={styles.helper}>Use this if you want email-based login or recovery.</span>
              {errors.email && <FormError message={errors.email.message} />}
            </FormItem>

            <FormItem>
              <Label htmlFor="phone" className={styles.fieldLabel}>
                <Smartphone size={16} />
                Phone number
                <span className={styles.optionalLabel}>optional</span>
              </Label>
            <Input
              id="phone"
              autoComplete="tel"
              className={styles.input}
              placeholder="(312) 555-1212"
              {...phoneRegistration}
              onChange={(event) => {
                phoneRegistration.onChange(event)
                clearErrors(['email', 'phone'])
                resetVerificationMode()
              }}
              inputMode="tel"
              type="tel"
            />
              <span className={styles.helper}>
                If you use phone, we will text a one-time verification code before the account is created.
              </span>
              {errors.phone && <FormError message={errors.phone.message} />}
            </FormItem>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Password</h2>
              <p className={styles.sectionHint}>Set the password the customer will use after signup.</p>
            </div>
          </div>

          <div className={styles.grid}>
            <FormItem>
              <Label htmlFor="password" className={styles.fieldLabel}>
                <ShieldCheck size={16} />
                New password
              </Label>
              <Input
                id="password"
                autoComplete="new-password"
                className={styles.input}
                placeholder="Create a strong password"
                {...register('password', { required: 'Password is required.' })}
                type="password"
              />
              <span className={styles.helper}>Use something unique. This account can later log in with email or phone.</span>
              {errors.password && <FormError message={errors.password.message} />}
            </FormItem>

            <FormItem>
              <Label htmlFor="passwordConfirm" className={styles.fieldLabel}>
                <ShieldCheck size={16} />
                Confirm password
              </Label>
              <Input
                id="passwordConfirm"
                autoComplete="new-password"
                className={styles.input}
                placeholder="Repeat the password"
                {...register('passwordConfirm', {
                  required: 'Please confirm your password.',
                  validate: (value) => value === password.current || 'The passwords do not match',
                })}
                type="password"
              />
              <span className={styles.helper}>This protects against typos before the account is created.</span>
              {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
            </FormItem>
          </div>
        </div>

        {verificationMode && (
          <div className={styles.section}>
            <div className={styles.verificationPanel}>
              <h2 className={styles.verificationTitle}>
                {isPhoneVerification
                  ? 'Finish the phone verification'
                  : 'Finish the email verification'}
              </h2>
              <p className={styles.verificationText}>
                {`We sent a 6-digit code to ${verificationRecipient}. Enter it below to finish creating the account.`}
              </p>

              <FormItem>
                <Label htmlFor="verificationCode" className={styles.fieldLabel}>
                  <ShieldCheck size={16} />
                  Verification code
                </Label>
                <Input
                  id="verificationCode"
                  className={styles.input}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                {...register('verificationCode', {
                  required:
                    isPhoneVerification || isEmailVerification
                      ? `Enter the 6-digit code we sent to ${verificationRecipient}.`
                      : 'Enter the 6-digit code we sent to your phone.',
                  validate: (value) =>
                    /^\d{6}$/.test(value.trim()) || 'Enter a valid 6-digit verification code.',
                })}
                type="text"
                />
                <span className={styles.helper}>
                  The account is not created until this code is accepted.
                </span>
                {errors.verificationCode && <FormError message={errors.verificationCode.message} />}
              </FormItem>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button className={styles.primaryButton} disabled={loading} type="submit" variant="default">
            {primaryActionLabel}
            {!loading && <ArrowRight size={16} />}
          </Button>

          <p className={styles.loginHint}>
            Already have an account? <Link href={customerLoginHref}>Log in</Link>.
          </p>

          {phoneValue.trim() && !verificationMode && !verificationCode.trim() ? (
            <p className={styles.loginHint}>
              Because you entered a phone number, the next step will send a verification code before the account is created.
            </p>
          ) : null}

          {emailValue.trim() &&
          !phoneValue.trim() &&
          !verificationMode &&
          !verificationCode.trim() ? (
            <p className={styles.loginHint}>
              Because you entered an email address, the next step will send a verification code before
              the account is created.
            </p>
          ) : null}
        </div>
      </section>
    </form>
  )
}
