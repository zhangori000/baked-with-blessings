import type { Metadata } from 'next'

import { BakeryPageShell, BakeryPageSurface } from '@/design-system/bakery'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'

import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'

export default async function ForgotPasswordPage() {
  return (
    <BakeryPageShell as="main" spacing="lg" width="narrow">
      <BakeryPageSurface spacing="lg">
        <ForgotPasswordForm />
      </BakeryPageSurface>
    </BakeryPageShell>
  )
}

export const metadata: Metadata = {
  description: 'Recover your password with an email address or verified phone number.',
  openGraph: mergeOpenGraph({
    title: 'Forgot Password',
    url: '/forgot-password',
  }),
  title: 'Forgot Password',
}
