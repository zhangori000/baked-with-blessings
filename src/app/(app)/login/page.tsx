import type { Metadata } from 'next'

import {
  BakeryPageHeader,
  BakeryPageLead,
  BakeryPageShell,
  BakeryPageSurface,
  BakeryPageTitle,
} from '@/design-system/bakery'
import { RenderParams } from '@/components/RenderParams'
import Link from 'next/link'
import React from 'react'

import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { LoginForm } from '@/components/forms/LoginForm'
import { redirect } from 'next/navigation'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'

export default async function Login() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const user = await getAuthenticatedCustomer(payload, headers)

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <BakeryPageShell as="main" spacing="lg" width="narrow">
      <BakeryPageSurface spacing="lg">
        <RenderParams />

        <BakeryPageHeader className="mb-8">
          <BakeryPageTitle>Log in</BakeryPageTitle>
          <BakeryPageLead>
            {`Use an email address or phone number to manage your account, review order history, and keep checkout details current. To manage staff and customers, `}
            <Link href="/admin">login to the admin dashboard</Link>.
          </BakeryPageLead>
        </BakeryPageHeader>

        <LoginForm />
      </BakeryPageSurface>
    </BakeryPageShell>
  )
}

export const metadata: Metadata = {
  description: 'Login or create an account to get started.',
  openGraph: {
    title: 'Login',
    url: '/login',
  },
  title: 'Login',
}
