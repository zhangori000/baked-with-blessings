/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* Wrapped on purpose so RootPage does not run for logged-out visitors. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

import { AdminBootError } from '@/components/admin/AdminBootError'
import { AdminLoginPage } from '@/components/admin/AdminLoginPage'
import { getAdminShellState } from '@/utilities/getAdminShellState'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  const shell = await getAdminShellState()

  if (shell.kind === 'error') {
    return { robots: { follow: false, index: false }, title: 'Admin could not load' }
  }

  if (shell.kind === 'login') {
    return { robots: { follow: false, index: false }, title: 'Admin login' }
  }

  return generatePageMetadata({ config, params, searchParams })
}

const Page = async ({ params, searchParams }: Args) => {
  const shell = await getAdminShellState()

  if (shell.kind === 'error') {
    return <AdminBootError error={shell.error} />
  }

  if (shell.kind === 'login') {
    return <AdminLoginPage />
  }

  return RootPage({ config, params, searchParams, importMap })
}

export default Page
