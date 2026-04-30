import type { Metadata } from 'next'

import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import { buildCustomerLoginHref } from '@/utilities/routes'

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function Login({ searchParams }: LoginPageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const user = await getAuthenticatedCustomer(payload, headers)
  const params = await searchParams

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  redirect(
    buildCustomerLoginHref({
      redirect: firstParam(params?.redirect),
      warning: firstParam(params?.warning),
    }),
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
