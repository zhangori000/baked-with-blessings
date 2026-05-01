import type { Metadata } from 'next'

import { BakeryPageShell, BakeryPageSurface } from '@/design-system/bakery'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'
import { ConfirmOrder } from '@/components/checkout/ConfirmOrder'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ConfirmOrderPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: SearchParams
}) {
  await searchParamsPromise

  return (
    <BakeryPageShell as="main" className="min-h-[90vh] flex" spacing="lg" width="container">
      <BakeryPageSurface className="flex" spacing="lg" width="full">
        <ConfirmOrder />
      </BakeryPageSurface>
    </BakeryPageShell>
  )
}

export const metadata: Metadata = {
  description: 'Confirm order.',
  openGraph: mergeOpenGraph({
    title: 'Confirming order',
    url: '/checkout/confirm-order',
  }),
  title: 'Confirming order',
}
