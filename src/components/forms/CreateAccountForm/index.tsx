'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  name: string
  password: string
  passwordConfirm: string
  phone: string
  verificationCode: string
}

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const { create } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [maskedPhone, setMaskedPhone] = useState<null | string>(null)
  const [requiresPhoneVerification, setRequiresPhoneVerification] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      const redirect = searchParams.get('redirect')

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        const result = await create(data)
        clearTimeout(timer)

        if (result.requiresPhoneVerification) {
          setMaskedPhone(result.maskedPhone || data.phone)
          setRequiresPhoneVerification(true)
          setLoading(false)
          return
        }

        if (redirect) router.push(redirect)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch (_) {
        clearTimeout(timer)
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [create, router, searchParams],
  )

  return (
    <form className="max-w-lg py-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="prose dark:prose-invert mb-6">
        <p>
          {`Create your account with an email address, a phone number, or both. If you sign up with a phone number, we'll text you a verification code before the account is created. To manage all users, `}
          <Link href="/admin">login to the admin dashboard</Link>.
        </p>
      </div>

      <Message error={error} />

      <div className="flex flex-col gap-8 mb-8">
        <FormItem>
          <Label htmlFor="name" className="mb-2">
            Name
          </Label>
          <Input id="name" {...register('name')} type="text" />
          {errors.name && <FormError message={errors.name.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="email" className="mb-2">
            Email Address
          </Label>
          <Input id="email" {...register('email')} type="email" />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="phone" className="mb-2">
            Phone Number
          </Label>
          <Input id="phone" {...register('phone')} type="tel" />
          {errors.phone && <FormError message={errors.phone.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="password" className="mb-2">
            New password
          </Label>
          <Input
            id="password"
            {...register('password', { required: 'Password is required.' })}
            type="password"
          />
          {errors.password && <FormError message={errors.password.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="passwordConfirm" className="mb-2">
            Confirm Password
          </Label>
          <Input
            id="passwordConfirm"
            {...register('passwordConfirm', {
              required: 'Please confirm your password.',
              validate: (value) => value === password.current || 'The passwords do not match',
            })}
            type="password"
          />
          {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
        </FormItem>

        {requiresPhoneVerification && (
          <FormItem>
            <Label htmlFor="verificationCode" className="mb-2">
              Verification Code
            </Label>
            <Input
              id="verificationCode"
              {...register('verificationCode', {
                required: 'Enter the 6-digit code we sent to your phone.',
              })}
              inputMode="numeric"
              type="text"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {`Enter the code we sent to ${maskedPhone || 'your phone number'} to finish creating the account.`}
            </p>
            {errors.verificationCode && <FormError message={errors.verificationCode.message} />}
          </FormItem>
        )}
      </div>
      <Button disabled={loading} type="submit" variant="default">
        {loading ? 'Processing' : requiresPhoneVerification ? 'Verify and create account' : 'Create Account'}
      </Button>

      <div className="prose dark:prose-invert mt-8">
        <p>
          {'Already have an account? '}
          <Link href={`/login${allParams}`}>Login</Link>
        </p>
      </div>
    </form>
  )
}
