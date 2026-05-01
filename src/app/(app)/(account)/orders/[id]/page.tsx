import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { BakeryPageSurface } from '@/design-system/bakery'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { ProductItem } from '@/components/ProductItem'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { OrderStatus } from '@/components/OrderStatus'
import { AddressItem } from '@/components/addresses/AddressItem'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

const hasAddressContent = (address: Order['shippingAddress']) => {
  if (!address || typeof address !== 'object') return false

  const addressRecord = address as Record<string, unknown>
  const relevantFields = [
    'name',
    'addressLine1',
    'addressLine2',
    'city',
    'state',
    'postalCode',
    'country',
    'phone',
  ]

  return relevantFields.some((field) => {
    const value = addressRecord[field]
    return typeof value === 'string' && value.trim().length > 0
  })
}

export default async function Order({ params, searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const user = await getAuthenticatedCustomer(payload, headers)

  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams

  let order: Order | null = null

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user,
      overrideAccess: !Boolean(user),
      depth: 2,
      where: {
        and: [
          {
            id: {
              equals: id,
            },
          },
          ...(user
            ? [
                {
                  customer: {
                    equals: user.id,
                  },
                },
              ]
            : [
                {
                  accessToken: {
                    equals: accessToken,
                  },
                },
                ...(email
                  ? [
                      {
                        customerEmail: {
                          equals: email,
                        },
                      },
                    ]
                  : []),
              ]),
        ],
      },
      select: {
        amount: true,
        currency: true,
        items: true,
        customerEmail: true,
        customer: true,
        status: true,
        manualPaymentHandle: true,
        manualPaymentMethod: true,
        manualPaymentReportedAt: true,
        manualPaymentStatus: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true,
      },
    })

    const canAccessAsGuest =
      !user &&
      email &&
      accessToken &&
      orderResult &&
      orderResult.customerEmail &&
      orderResult.customerEmail === email
    const canAccessAsUser =
      user &&
      orderResult &&
      orderResult.customer &&
      (typeof orderResult.customer === 'object'
        ? orderResult.customer.id
        : orderResult.customer) === user.id

    if (orderResult && (canAccessAsGuest || canAccessAsUser)) {
      order = orderResult
    }
  } catch (error) {
    console.error(error)
  }

  if (!order) {
    notFound()
  }

  const hasShippingAddress = hasAddressContent(order.shippingAddress)
  const isVenmoOrder = order.manualPaymentMethod === 'venmo'
  const itemCount =
    order.items?.reduce(
      (total, item) => total + (typeof item.quantity === 'number' ? item.quantity : 0),
      0,
    ) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        {user ? (
          <div className="flex gap-4">
            <Button
              asChild
              className="rounded-full border border-[#d8c9a5] bg-[#fff8e8] px-4 text-[#4a421d] shadow-sm hover:bg-[#f7edcf]"
              variant="ghost"
            >
              <Link href="/orders">
                <ChevronLeftIcon className="h-4 w-4" />
                All orders
              </Link>
            </Button>
          </div>
        ) : (
          <div></div>
        )}

        <h1 className="rounded-full bg-[#edf2d5] px-3 py-1.5 font-mono text-sm tracking-[0.12em] text-[#45481d] uppercase">
          <span className="">{`Order #${order.id}`}</span>
        </h1>
      </div>

      <section className="relative mx-auto h-[clamp(18rem,35vh,24rem)] max-w-[1180px] overflow-hidden rounded-[2rem] border border-[#d6c99f] bg-[#b7ddf3] shadow-[0_22px_70px_rgba(63,53,31,0.14)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,#8cc8e8_0%,#b9ddf2_62%,#e9d05e_63%,#f0d764_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute left-[8%] top-[68%] h-10 w-10 rounded-full bg-white/90 shadow-[1.6rem_-0.45rem_0_0.15rem_rgba(255,255,255,0.82),3rem_0_0_-0.15rem_rgba(255,255,255,0.78)]"
        />
        <div
          aria-hidden="true"
          className="absolute right-[12%] top-[24%] h-8 w-16 rounded-full bg-white/90 shadow-[1.7rem_0.15rem_0_-0.1rem_rgba(255,255,255,0.84),0.55rem_0.55rem_0_-0.18rem_rgba(232,200,213,0.8)]"
        />
        <div className="relative z-[1] flex h-full items-center p-5 sm:p-6 lg:p-8">
          <div className="relative max-w-3xl rounded-[1.8rem] border border-white/60 bg-[#fff8e8]/95 p-5 shadow-[0_18px_50px_rgba(62,54,24,0.16)] backdrop-blur-md sm:p-6">
            <span
              aria-hidden="true"
              className="absolute -left-4 -top-4 h-10 w-10 rounded-full bg-[#ffde3f] shadow-[0_-1rem_0_-0.35rem_#ffde3f,1rem_0_0_-0.35rem_#ffde3f,0_1rem_0_-0.35rem_#ffde3f,-1rem_0_0_-0.35rem_#ffde3f]"
            />
            <span
              aria-hidden="true"
              className="absolute -right-3 bottom-5 h-8 w-8 rounded-full bg-[#f05d91] shadow-[0_-0.7rem_0_-0.28rem_#f05d91,0.7rem_0_0_-0.28rem_#f05d91,0_0.7rem_0_-0.28rem_#f05d91,-0.7rem_0_0_-0.28rem_#f05d91]"
            />
            <p className="font-mono text-xs font-bold tracking-[0.24em] text-[#7c8232] uppercase">
              Baked with Blessings
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif text-4xl leading-none tracking-[-0.04em] text-[#4a421d] sm:text-5xl">
                  {isVenmoOrder ? 'Venmo order recorded.' : 'Order received.'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5632] sm:text-base">
                  {isVenmoOrder
                    ? `We saved this order after you reported a Venmo payment to ${
                        order.manualPaymentHandle || '@bakedwithblessings'
                      }. The bakery will verify the payment and contact you through your account contact method.`
                    : 'Payment went through. We saved this order and marked it as processing so the bakery can prepare it.'}
                </p>
              </div>
              <span className="w-fit rounded-full bg-[#f7e7b6] px-3 py-1.5 font-mono text-xs font-bold tracking-[0.16em] text-[#4a421d] uppercase">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <BakeryPageSurface
        className="flex flex-col gap-6 rounded-[2rem] border border-[#e3d4b4] bg-[#fff9ed] shadow-[0_18px_55px_rgba(63,53,31,0.1)]"
        spacing="lg"
        width="full"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <section className="rounded-[1.4rem] border border-[#eadfc8] bg-white/70 p-4">
            <p className="mb-2 font-mono text-xs font-bold tracking-[0.18em] text-[#9bad6a] uppercase">
              Order date
            </p>
            <p className="text-lg font-semibold text-[#43451e]">
              <time dateTime={order.createdAt}>
                {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
              </time>
            </p>
          </section>

          <section className="rounded-[1.4rem] border border-[#eadfc8] bg-white/70 p-4">
            <p className="mb-2 font-mono text-xs font-bold tracking-[0.18em] text-[#9bad6a] uppercase">
              Total
            </p>
            {order.amount && (
              <Price className="text-lg font-semibold text-[#43451e]" amount={order.amount} />
            )}
          </section>

          {order.status && (
            <section className="rounded-[1.4rem] border border-[#eadfc8] bg-white/70 p-4">
              <p className="mb-2 font-mono text-xs font-bold tracking-[0.18em] text-[#9bad6a] uppercase">
                Status
              </p>
              <OrderStatus className="text-sm" status={order.status} />
            </section>
          )}

          {isVenmoOrder ? (
            <section className="rounded-[1.4rem] border border-[#eadfc8] bg-white/70 p-4 md:col-span-3">
              <p className="mb-2 font-mono text-xs font-bold tracking-[0.18em] text-[#75853d] uppercase">
                Payment
              </p>
              <p className="text-sm leading-6 text-[#4b421d]">
                Venmo reported to {order.manualPaymentHandle || '@bakedwithblessings'}.
                {order.manualPaymentStatus === 'verified'
                  ? ' The bakery has marked this payment as verified.'
                  : ' This still needs manual verification by the bakery before it is treated as paid.'}
              </p>
            </section>
          ) : null}
        </div>

        {order.items && (
          <section className="rounded-[1.6rem] border border-[#eadfc8] bg-[#fffdf6] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-mono text-sm font-bold tracking-[0.18em] text-[#9bad6a] uppercase">
                What you ordered
              </h2>
              <span className="rounded-full bg-[#f2e8c9] px-3 py-1 text-xs font-bold text-[#51471f]">
                {itemCount} total
              </span>
            </div>
            <ul className="flex flex-col gap-3">
              {order.items?.map((item, index) => {
                if (typeof item.product === 'string') {
                  return null
                }

                if (!item.product || typeof item.product !== 'object') {
                  return (
                    <li
                      className="rounded-2xl border border-[#eadfc8] bg-white/75 p-4 text-[#5f5632]"
                      key={index}
                    >
                      This item is no longer available.
                    </li>
                  )
                }

                const variant =
                  item.variant && typeof item.variant === 'object' ? item.variant : undefined

                return (
                  <li
                    className="rounded-2xl border border-[#eadfc8] bg-white/75 p-4 shadow-[0_10px_26px_rgba(63,53,31,0.06)]"
                    key={item.id}
                  >
                    <ProductItem
                      product={item.product}
                      quantity={item.quantity}
                      variant={variant}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="rounded-[1.6rem] border border-[#eadfc8] bg-[#fffdf6] p-4 sm:p-5">
          <h2 className="mb-4 font-mono text-sm font-bold tracking-[0.18em] text-[#9bad6a] uppercase">
            Delivery details
          </h2>
          {hasShippingAddress ? (
            <>
              {/* @ts-expect-error - some kind of type hell */}
              <AddressItem address={order.shippingAddress} hideActions />
            </>
          ) : (
            <p className="max-w-2xl rounded-2xl border border-dashed border-[#d8c9a5] bg-[#fff8e8] p-4 text-sm leading-6 text-[#5f5632]">
              No delivery address was collected for this order. Treat this as a pickup or manually
              coordinated order unless delivery is added later.
            </p>
          )}
        </section>
      </BakeryPageSurface>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    description: `Order details for order ${id}.`,
    openGraph: mergeOpenGraph({
      title: `Order ${id}`,
      url: `/orders/${id}`,
    }),
    title: `Order ${id}`,
  }
}
