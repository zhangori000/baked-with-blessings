/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* Wrapped on purpose: unauthenticated /admin must not enter RootLayout.
   `pnpm generate:importmap` can rewrite this file — keep the getAdminShellState
   branch if that happens. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { AdminStandaloneDocument } from '@/components/admin/AdminStandaloneDocument'
import { getAdminShellState } from '@/utilities/getAdminShellState'

import { importMap } from './admin/importMap.js'
import './custom.scss'

export const dynamic = 'force-dynamic'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

/**
 * Payload RootLayout + Next 16 leaves an empty Suspense slot
 * (`<!--$--><!--/$-->`) for logged-out /admin. Authenticated visitors still
 * use RootLayout. Logged-out visitors get a real HTML document instead.
 */
const Layout = async ({ children }: Args) => {
  const shell = await getAdminShellState()

  if (shell.kind !== 'ready') {
    return <AdminStandaloneDocument>{children}</AdminStandaloneDocument>
  }

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}

export default Layout
