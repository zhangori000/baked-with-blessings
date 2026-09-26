import type { Metadata } from 'next'

import { redirect } from 'next/navigation'

import { buildCustomerLoginHref } from '@/utilities/routes'

type CreateAccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function CreateAccount({ searchParams }: CreateAccountPageProps) {
  const params = await searchParams

  redirect(
    buildCustomerLoginHref({
      mode: 'create',
      redirect: firstParam(params?.redirect),
      warning: firstParam(params?.warning),
    }),
  )
}

export const metadata: Metadata = {
  description: 'Create a Baked with Blessings account.',
  title: 'Create account',
}
