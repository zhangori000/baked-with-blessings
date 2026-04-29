import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { BakeryPageSurface, BakeryPageTitle } from '@/design-system/bakery'

import { OrderItem } from '@/components/OrderItem'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'

export default async function Orders() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const user = await getAuthenticatedCustomer(payload, headers)

  let orders: Order[] | null = null

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Please login to access your orders.')}`)
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 0,
      pagination: false,
      user,
      overrideAccess: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (_error) {}

  return (
    <>
      <BakeryPageSurface spacing="lg" width="full">
        <BakeryPageTitle className="mb-8">Orders</BakeryPageTitle>
        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <p className="">You have no orders.</p>
        )}

        {orders && orders.length > 0 && (
          <ul className="flex flex-col gap-6">
            {orders?.map((order) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}
      </BakeryPageSurface>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Your orders.',
  openGraph: mergeOpenGraph({
    title: 'Orders',
    url: '/orders',
  }),
  title: 'Orders',
}
