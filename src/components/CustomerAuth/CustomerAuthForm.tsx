'use client'

import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'

import { BakeryCheckbox, BakeryPressable } from '@/design-system/bakery'
import { bakeryTextsDisclosure, emailUpdatesSignupNote } from '@/utilities/messageConsent'
import { privacyHref, termsHref } from '@/utilities/routes'

import {
  type CustomerAuthFormState,
  type CustomerAuthMode,
  useCustomerAuthForm,
} from './useCustomerAuthForm'

type IntroCopy = Record<CustomerAuthMode, string>

const defaultIntro: IntroCopy = {
  create:
    'Create a customer account without leaving this page. Send a code to your email or phone, then finish your password while it arrives. Phone-only works too (the baker texts you personally), but automatic emails like receipts and announcements need an email on file.',
  login:
    'Use the email or phone number connected to your account. We will keep you on this page unless your account opens a management workspace.',
}

export const customerAuthTitle = (
  auth: Pick<CustomerAuthFormState, 'mode' | 'needsVerification'>,
) =>
  auth.mode === 'create' ? (auth.needsVerification ? 'Verify code' : 'Create account') : 'Sign in'

export function CustomerAuthForm({
  auth,
  className,
  intro = defaultIntro,
  notice,
}: {
  auth: CustomerAuthFormState
  className?: string
  intro?: IntroCopy
  notice?: string | null
}) {
  const isCreate = auth.mode === 'create'
  const isBusy = auth.isLoggingIn || auth.isCreating

  return (
    <form
      className={className ? `siteHeaderAuthPanel ${className}` : 'siteHeaderAuthPanel'}
      onSubmit={isCreate ? auth.handleCreateSubmit : auth.handleLoginSubmit}
    >
      <p className="siteHeaderAuthIntro">{intro[auth.mode]}</p>

      {!isCreate && auth.loginError ? (
        <p className="siteHeaderAuthError" role="alert">
          {auth.loginError}
        </p>
      ) : null}

      {isCreate && auth.createError ? (
        <p className="siteHeaderAuthError" role="alert">
          {auth.createError}
        </p>
      ) : null}

      {isCreate && auth.createNotice ? (
        <p className="siteHeaderAuthNotice">{auth.createNotice}</p>
      ) : null}

      {!isCreate && !auth.loginError && notice ? (
        <p className="siteHeaderAuthNotice">{notice}</p>
      ) : null}

      {isCreate ? (
        <>
          <div className="siteHeaderAuthContactGroup">
            <label className="siteHeaderAuthField">
              <span>Email or phone</span>
              <input
                autoComplete="username"
                className="siteHeaderAuthInput"
                inputMode="email"
                onChange={(event) => auth.setCreateContact(event.target.value)}
                placeholder="you@example.com or 555-123-4567"
                type="text"
                value={auth.createContact}
              />
            </label>
            <button
              className="siteHeaderAuthInlineButton"
              disabled={auth.isResending || auth.resendSeconds > 0}
              onClick={auth.handleSendCode}
              type="button"
            >
              {auth.isResending
                ? 'Sending...'
                : auth.resendSeconds > 0
                  ? `Resend ${auth.resendSeconds}s`
                  : auth.needsVerification
                    ? 'Resend code'
                    : 'Send code'}
            </button>
          </div>

          {auth.needsVerification ? null : (
            <p className="siteHeaderAuthMicrocopy">{emailUpdatesSignupNote}</p>
          )}

          {auth.textsOffered ? (
            <div className="siteHeaderAuthConsent">
              <BakeryCheckbox
                checked={auth.smsOptIn && auth.contactIsPhone}
                description={`Optional. You agree to get recurring marketing texts from Baked with Blessings at this number. Consent is not a condition of purchase. ${bakeryTextsDisclosure}`}
                disabled={!auth.contactIsPhone}
                onChange={(event) => auth.setSmsOptIn(event.target.checked)}
                size="sm"
              >
                Text me when you drop a flavor or post a market date
              </BakeryCheckbox>
              <p className="siteHeaderAuthMicrocopy">
                {auth.contactIsPhone ? null : 'Sign up with a phone number to choose texts. '}
                See our <Link href={termsHref}>Terms</Link> and{' '}
                <Link href={privacyHref}>Privacy Policy</Link>.
              </p>
            </div>
          ) : null}

          <AnimatePresence initial={false} mode="wait">
            {auth.needsVerification ? (
              <motion.div
                animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                className="siteHeaderAuthVerificationStep"
                exit={{ filter: 'blur(4px)', opacity: 0, y: -8 }}
                initial={{ filter: 'blur(4px)', opacity: 0, y: -10 }}
                key="customer-create-verification"
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="siteHeaderAuthMicrocopy">
                  Code sent to {auth.verificationRecipient || 'your contact method'}.
                </p>
                <label className="siteHeaderAuthField">
                  <span>Verification code</span>
                  <input
                    autoComplete="one-time-code"
                    className="siteHeaderAuthInput siteHeaderVerificationInput"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => auth.setVerificationCode(event.target.value)}
                    pattern="[0-9]*"
                    placeholder="6-digit code"
                    type="text"
                    value={auth.verificationCode}
                  />
                </label>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : (
        <label className="siteHeaderAuthField">
          <span>Email or phone</span>
          <input
            autoComplete="username"
            className="siteHeaderAuthInput"
            inputMode="email"
            onChange={(event) => auth.setLoginIdentifier(event.target.value)}
            placeholder="you@example.com"
            type="text"
            value={auth.loginIdentifier}
          />
        </label>
      )}

      <label className="siteHeaderAuthField">
        <span>Password</span>
        <span className="siteHeaderPasswordShell">
          <input
            autoComplete={isCreate ? 'new-password' : 'current-password'}
            className="siteHeaderAuthInput siteHeaderPasswordInput"
            onChange={(event) =>
              isCreate
                ? auth.setCreatePassword(event.target.value)
                : auth.setLoginPassword(event.target.value)
            }
            placeholder="Enter password"
            type={auth.showPassword ? 'text' : 'password'}
            value={isCreate ? auth.createPassword : auth.loginPassword}
          />
          <BakeryPressable
            aria-label={auth.showPassword ? 'Hide password' : 'Show password'}
            className="siteHeaderPasswordToggle"
            onClick={() => auth.setShowPassword((current) => !current)}
            type="button"
          >
            {auth.showPassword ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
          </BakeryPressable>
        </span>
      </label>

      {isCreate ? (
        <label className="siteHeaderAuthField">
          <span>Verify password</span>
          <input
            autoComplete="new-password"
            className="siteHeaderAuthInput"
            onChange={(event) => auth.setCreatePasswordConfirm(event.target.value)}
            placeholder="Re-enter password"
            type={auth.showPassword ? 'text' : 'password'}
            value={auth.createPasswordConfirm}
          />
        </label>
      ) : null}

      <button className="siteHeaderAuthSubmit" disabled={isBusy || auth.isResending} type="submit">
        {isBusy ? (
          <>
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            {isCreate ? 'Creating account' : 'Signing in'}
          </>
        ) : isCreate ? (
          auth.needsVerification ? (
            'Create account'
          ) : (
            'Send code to continue'
          )
        ) : (
          'Sign in'
        )}
      </button>

      {!auth.needsVerification ? (
        <div className="siteHeaderAuthLinks">
          <button className="siteHeaderAuthLinkButton" onClick={auth.switchMode} type="button">
            {isCreate ? 'Already have an account? Sign in' : 'Create an account'}
          </button>
        </div>
      ) : null}
    </form>
  )
}

export function CustomerAuthPanel({
  className,
  initialMode,
  intro,
  onSignedIn,
  textsOffered,
}: {
  className?: string
  initialMode?: CustomerAuthMode
  intro?: IntroCopy
  onSignedIn?: (kind: CustomerAuthMode) => void
  textsOffered?: boolean
}) {
  const auth = useCustomerAuthForm({ initialMode, onSignedIn, textsOffered })

  return <CustomerAuthForm auth={auth} className={className} intro={intro} />
}
