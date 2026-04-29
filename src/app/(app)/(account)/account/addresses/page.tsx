import type { Metadata } from 'next'

import { BakeryPageSurface, BakeryPageTitle } from '@/design-system/bakery'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { AddressListing } from '@/components/addresses/AddressListing'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'

export default async function AddressesPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const user = await getAuthenticatedCustomer(payload, headers)

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  return (
    <>
      <BakeryPageSurface spacing="lg" width="full">
        <BakeryPageTitle className="mb-8">Addresses</BakeryPageTitle>

        <div className="mb-8">
          <AddressListing />
        </div>

        <CreateAddressModal />
      </BakeryPageSurface>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Manage your addresses.',
  openGraph: mergeOpenGraph({
    title: 'Addresses',
    url: '/account/addresses',
  }),
  title: 'Addresses',
}
