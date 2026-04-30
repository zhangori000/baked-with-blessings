'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  identifier: string
  password: string
  passwordConfirm: string
  verificationCode: string
}

export const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword } = useAuth()
  const [error, setError] = useState('')
  const [maskedPhone, setMaskedPhone] = useState<null | string>(null)
  const [requiresPhoneVerification, setRequiresPhoneVerification] = useState(false)
  const [resetSuccessful, setResetSuccessful] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(async (data: FormData) => {
    try {
      const result = await forgotPassword(data)

      setError('')

      if (result.requiresPhoneVerification) {
        setMaskedPhone(result.maskedPhone || data.identifier)
        setRequiresPhoneVerification(true)
        return
      }

      if (result.recoveryChannel === 'phone' && result.reset) {
        setResetSuccessful(true)
        setSuccess(true)
        return
      }

      setSuccess(true)
    } catch {
      setError('There was a problem while attempting to recover your account. Please try again.')
    }
  }, [forgotPassword])

  return (
    <Fragment>
      {!success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Forgot Password</h1>
          <div className="prose dark:prose-invert mb-8">
            <p>
              Enter the email address or phone number connected to your account. Email-based
              accounts will receive a reset email. Phone-based accounts will receive a 6-digit
              verification code.
            </p>
          </div>
          <form className="max-w-lg" onSubmit={handleSubmit(onSubmit)}>
            <Message className="mb-8" error={error} />

            <FormItem className="mb-8">
              <Label htmlFor="identifier" className="mb-2">
                Email address or phone number
              </Label>
              <Input
                id="identifier"
                {...register('identifier', {
                  required: 'Please provide the email address or phone number connected to your account.',
                })}
                type="text"
              />
              {errors.identifier && <FormError message={errors.identifier.message} />}
            </FormItem>

            {requiresPhoneVerification && (
              <>
                <FormItem className="mb-8">
                  <Label htmlFor="verificationCode" className="mb-2">
                    Verification code
                  </Label>
                  <Input
                    id="verificationCode"
                    {...register('verificationCode', {
                      required: 'Enter the verification code we sent to your phone.',
                    })}
                    inputMode="numeric"
                    type="text"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {`Enter the code we sent to ${maskedPhone || 'your phone number'}, then choose a new password.`}
                  </p>
                  {errors.verificationCode && (
                    <FormError message={errors.verificationCode.message} />
                  )}
                </FormItem>

                <FormItem className="mb-8">
                  <Label htmlFor="password" className="mb-2">
                    New password
                  </Label>
                  <Input
                    id="password"
                    {...register('password', { required: 'Please enter a new password.' })}
                    type="password"
                  />
                  {errors.password && <FormError message={errors.password.message} />}
                </FormItem>

                <FormItem className="mb-8">
                  <Label htmlFor="passwordConfirm" className="mb-2">
                    Confirm new password
                  </Label>
                  <Input
                    id="passwordConfirm"
                    {...register('passwordConfirm', {
                      required: 'Please confirm your new password.',
                      validate: (value, values) =>
                        value === values.password || 'The passwords do not match',
                    })}
                    type="password"
                  />
                  {errors.passwordConfirm && (
                    <FormError message={errors.passwordConfirm.message} />
                  )}
                </FormItem>
              </>
            )}

            <Button type="submit" variant="default">
              {requiresPhoneVerification ? 'Verify and reset password' : 'Recover account'}
            </Button>
          </form>
        </React.Fragment>
      )}
      {success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Request submitted</h1>
          <div className="prose dark:prose-invert">
            <p>
              {resetSuccessful
                ? 'Your password has been reset. You can now log in with your new password.'
                : 'If your account uses email recovery, check your inbox for a password reset link.'}
            </p>
          </div>
        </React.Fragment>
      )}
    </Fragment>
  )
}
