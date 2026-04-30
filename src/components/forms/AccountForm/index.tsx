'use client'

import type { CollectionAuthUser } from '@/access/utilities'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type StorefrontCustomer = CollectionAuthUser & {
  email?: null | string
  id: number | string
  name?: null | string
  phone?: null | string
}

type FormData = {
  email: string
  name: null | string | undefined
  password: string
  passwordConfirm: string
}

export const AccountForm: React.FC = () => {
  const { setUser, user } = useAuth()
  const [changePassword, setChangePassword] = useState(false)

  const {
    formState: { errors, isLoading, isSubmitting, isDirty },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const router = useRouter()

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (user) {
        const response = await fetch(`/api/customers/${user.id}`, {
          // Make sure to include cookies with fetch
          body: JSON.stringify(data),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        })

        if (response.ok) {
          const json = await response.json()
          setUser(json.doc as StorefrontCustomer)
          toast.success('Successfully updated account.')
          setChangePassword(false)
          reset({
            name: json.doc.name,
            email: json.doc.email,
            password: '',
            passwordConfirm: '',
          })
        } else {
          toast.error('There was a problem updating your account.')
        }
      }
    },
    [user, setUser, reset],
  )

  useEffect(() => {
    if (user === null) {
      router.push(
        `/login?error=${encodeURIComponent(
          'You must be logged in to view this page.',
        )}&redirect=${encodeURIComponent('/account')}`,
      )
    }

    // Once user is loaded, reset form to have default values
    if (user) {
      reset({
        name: user.name,
        email: user.email || '',
        password: '',
        passwordConfirm: '',
      })
    }
  }, [user, router, reset, changePassword])

  return (
    <form className="accountSettingsForm" onSubmit={handleSubmit(onSubmit)}>
      {!changePassword ? (
        <Fragment>
          <div className="accountSettingsFormIntro">
            <p>
              {'Change your account details below, or '}
              <Button
                className="accountSettingsInlineButton"
                onClick={() => setChangePassword(!changePassword)}
                type="button"
                variant="link"
              >
                click here
              </Button>
              {' to change your password.'}
            </p>
          </div>

          <div className="accountSettingsFields">
            <FormItem>
              <Label htmlFor="email" className="accountSettingsLabel">
                Email Address
              </Label>
              <Input className="accountSettingsInput" id="email" {...register('email')} type="email" />
              {errors.email && <FormError message={errors.email.message} />}
            </FormItem>

            <FormItem>
              <Label htmlFor="phone" className="accountSettingsLabel">
                Verified Phone
              </Label>
              <Input
                className="accountSettingsInput"
                id="phone"
                value={user?.phone || ''}
                disabled
                readOnly
                type="tel"
              />
            </FormItem>

            <FormItem>
              <Label htmlFor="name" className="accountSettingsLabel">
                Name
              </Label>
              <Input
                className="accountSettingsInput"
                id="name"
                {...register('name', { required: 'Please provide a name.' })}
                type="text"
              />
              {errors.name && <FormError message={errors.name.message} />}
            </FormItem>
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div className="accountSettingsFormIntro">
            <p>
              {'Change your password below, or '}
              <Button
                className="accountSettingsInlineButton"
                onClick={() => setChangePassword(!changePassword)}
                type="button"
                variant="link"
              >
                cancel
              </Button>
              .
            </p>
          </div>

          <div className="accountSettingsFields">
            <FormItem>
              <Label htmlFor="password" className="accountSettingsLabel">
                New password
              </Label>
              <Input
                className="accountSettingsInput"
                id="password"
                {...register('password', { required: 'Please provide a new password.' })}
                type="password"
              />
              {errors.password && <FormError message={errors.password.message} />}
            </FormItem>

            <FormItem>
              <Label htmlFor="passwordConfirm" className="accountSettingsLabel">
                Confirm password
              </Label>
              <Input
                className="accountSettingsInput"
                id="passwordConfirm"
                {...register('passwordConfirm', {
                  required: 'Please confirm your new password.',
                  validate: (value) => value === password.current || 'The passwords do not match',
                })}
                type="password"
              />
              {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
            </FormItem>
          </div>
        </Fragment>
      )}
      <Button
        className="accountSettingsSubmit"
        disabled={isLoading || isSubmitting || !isDirty}
        type="submit"
        variant="default"
      >
        {isLoading || isSubmitting
          ? 'Processing'
          : changePassword
            ? 'Change Password'
            : 'Update Account'}
      </Button>
    </form>
  )
}
