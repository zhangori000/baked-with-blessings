import type { Metadata } from 'next'

import { BakeryPageShell, BakeryPageSurface } from '@/design-system/bakery'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'
import { FindOrderForm } from '@/components/forms/FindOrderForm'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'

export default async function FindOrderPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const user = await getAuthenticatedCustomer(payload, headers)

  return (
    <BakeryPageShell as="main" spacing="lg" width="narrow">
      <BakeryPageSurface spacing="lg">
        <FindOrderForm initialEmail={user?.email || undefined} />
      </BakeryPageSurface>
    </BakeryPageShell>
  )
}

export const metadata: Metadata = {
  description: 'Find your order using your email and order ID.',
  openGraph: mergeOpenGraph({
    title: 'Find order',
    url: '/find-order',
  }),
  title: 'Find order',
}
