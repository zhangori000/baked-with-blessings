import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { BakeryPageLead, BakeryPageSurface, BakeryPageTitle } from '@/design-system/bakery'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { AccountForm } from '@/components/forms/AccountForm'
import { Order } from '@/payload-types'
import { OrderItem } from '@/components/OrderItem'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'

export default async function AccountPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const user = await getAuthenticatedCustomer(payload, headers)

  let orders: Order[] | null = null

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 5,
      user,
      overrideAccess: false,
      pagination: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (_error) {
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // so swallow the error here and simply render the page with fallback data where necessary
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

  return (
    <>
      <BakeryPageSurface spacing="lg" width="full">
        <BakeryPageTitle className="mb-8">Account settings</BakeryPageTitle>
        <AccountForm />
      </BakeryPageSurface>

      <BakeryPageSurface spacing="lg" width="full">
        <BakeryPageTitle as="h2" className="mb-8">
          Recent Orders
        </BakeryPageTitle>

        <BakeryPageLead className="mb-8">
          These are the most recent orders you have placed. Each order is associated with a payment.
          As you place more orders, they will appear in your orders list.
        </BakeryPageLead>

        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <p className="mb-8">You have no orders.</p>
        )}

        {orders && orders.length > 0 && (
          <ul className="flex flex-col gap-6 mb-8">
            {orders?.map((order) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="default">
          <Link href="/orders">View all orders</Link>
        </Button>
      </BakeryPageSurface>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
