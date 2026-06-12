import configPromise from '@payload-config'
import type { Product } from '@/payload-types'
import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { buildStaticMetadata } from '@/utilities/buildStaticMetadata'
import { measureServerStep } from '@/utilities/devTiming'
import { Cormorant_Garamond } from 'next/font/google'
import { getPayload } from 'payload'
import React from 'react'

import { CateringMenuSection } from './_components/catering-menu-section.client'
import { queryRegularOrderItems } from './regularOrderQueries'
import './_components/catering-menu-hero.css'

const cateringSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export const metadata = buildStaticMetadata({
  description:
    'Order always-available and seasonal cookie flavors individually in large or mini sizes, or browse catering trays with transparent pricing and tray builders.',
  path: '/menu',
  title: 'Menu',
})

const cateringProductSelect = {
  categories: true,
  gallery: true,
  id: true,
  menuBehavior: true,
  menuExpandedPitch: true,
  menuPortionLabel: true,
  meta: true,
  priceInUSD: true,
  requiredSelectionCount: true,
  selectableProducts: true,
  slug: true,
  title: true,
} as const

export default async function CateringMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>
}) {
  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const { section } = await searchParams
  const initialSection = section === 'catering' ? 'catering' : 'regular'
  const payload = await measureServerStep('payload init: catering menu', () =>
    getPayload({ config: configPromise }),
  )

  const regularOrderData = await measureServerStep('query regular order items: menu', () =>
    queryRegularOrderItems(payload),
  )

  const cateringCategoryResult = await measureServerStep(
    'payload.find categories: catering menu',
    () =>
      payload.find({
        collection: 'categories',
        draft: false,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        select: {
          id: true,
          slug: true,
          title: true,
        },
        where: {
          slug: {
            equals: 'catering',
          },
        },
      }),
  )

  const cateringCategory = cateringCategoryResult.docs[0]

  const cateringProducts = cateringCategory
    ? (
        await measureServerStep('payload.find products: catering menu', () =>
          payload.find({
            collection: 'products',
            draft: false,
            overrideAccess: false,
            pagination: false,
            select: cateringProductSelect,
            sort: 'title',
            where: {
              and: [
                {
                  _status: {
                    equals: 'published',
                  },
                },
                {
                  categories: {
                    contains: cateringCategory.id,
                  },
                },
              ],
            },
          }),
        )
      ).docs
    : []

  if (!cateringProducts.length && !regularOrderData.items.length) {
    return (
      <div className="container py-16">
        <p className="max-w-[42rem] text-base leading-8 text-[#6b5947]">
          {cateringCategory
            ? 'The menu is seeded, but no published products were found yet.'
            : 'The catering category has not been seeded yet. Run the seed flow, then refresh this page.'}
        </p>
      </div>
    )
  }

  return (
    <div className={cateringSerif.variable}>
      <CateringMenuSection
        initialSceneryTone={initialSceneryTone}
        initialSection={initialSection}
        products={cateringProducts as Partial<Product>[]}
        regularItems={regularOrderData.items}
        seasonalLabel={regularOrderData.seasonalLabel}
      />
    </div>
  )
}
