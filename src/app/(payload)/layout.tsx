/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { AdminBootError } from '@/components/admin/AdminBootError'
import { checkAdminBoot } from '@/utilities/adminBoot'

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
 * Payload's RootLayout calls initReq + getClientConfig before login can
 * mount. A throw there lands in an empty Suspense boundary over Payload's
 * dark CSS — a blank black /admin. Diagnose first and render a real page.
 */
const Layout = async ({ children }: Args) => {
  const bootError = await checkAdminBoot(config)

  if (bootError) {
    return (
      <html lang="en">
        <body style={{ background: '#111', color: '#d5d5d5', margin: 0 }}>
          <AdminBootError error={bootError} />
        </body>
      </html>
    )
  }

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}

export default Layout
