import configPromise from '@payload-config'
import type { Product } from '@/payload-types'
import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import {
  BUNDLES_CATEGORY_SLUG,
  CATERING_FLAVOR_CATEGORY_SLUG,
  CATERING_PACKAGES_CATEGORY_SLUG,
} from '@/features/products/cateringPackages'
import { buildStaticMetadata } from '@/utilities/buildStaticMetadata'
import { measureServerStep } from '@/utilities/devTiming'
import { Cormorant_Garamond } from 'next/font/google'
import { getPayload, type Payload } from 'payload'
import React from 'react'

import { CateringMenuSection } from './_components/catering-menu-section.client'
import type { MenuSection } from './_components/catering-menu-types'
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
    'Order this week’s cookie flavors individually, build your own boxes, or order catering in any flavor we’ve ever baked.',
  path: '/menu',
  title: 'Menu',
})

const cateringProductSelect = {
  categories: true,
  flavorSelection: true,
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

const parseInitialSection = (section?: string | string[]): MenuSection => {
  const value = Array.isArray(section) ? section[0] : section

  if (value === 'catering' || value === 'bundles') {
    return value
  }

  return 'regular'
}

const queryPublishedProductsInCategory = async (payload: Payload, categorySlug: string) => {
  const categoryResult = await measureServerStep(
    `payload.find categories: menu ${categorySlug}`,
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
            equals: categorySlug,
          },
        },
      }),
  )

  const category = categoryResult.docs[0]

  if (!category) {
    return { category: null, products: [] as Partial<Product>[] }
  }

  const productsResult = await measureServerStep(
    `payload.find products: menu ${categorySlug}`,
    () =>
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
                contains: category.id,
              },
            },
          ],
        },
      }),
  )

  return { category, products: productsResult.docs as Partial<Product>[] }
}

const queryCateringFlavors = async (payload: Payload) => {
  const categoryResult = await measureServerStep('payload.find categories: catering flavors', () =>
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      select: { slug: true },
      where: { slug: { equals: CATERING_FLAVOR_CATEGORY_SLUG } },
    }),
  )
  const categoryID = categoryResult.docs[0]?.id

  if (categoryID == null) {
    return [] as Product[]
  }

  const flavorsResult = await measureServerStep('payload.find products: catering flavors', () =>
    payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      overrideAccess: false,
      pagination: false,
      sort: 'title',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { categories: { contains: categoryID } },
          { menuBehavior: { not_equals: 'batchBuilder' } },
        ],
      },
    }),
  )

  return flavorsResult.docs as Product[]
}

export default async function CateringMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>
}) {
  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const { section } = await searchParams
  const initialSection = parseInitialSection(section)
  const payload = await measureServerStep('payload init: catering menu', () =>
    getPayload({ config: configPromise }),
  )

  const [regularOrderData, bundles, cateringPackages, cateringFlavors] = await Promise.all([
    measureServerStep('query regular order items: menu', () => queryRegularOrderItems(payload)),
    queryPublishedProductsInCategory(payload, BUNDLES_CATEGORY_SLUG),
    queryPublishedProductsInCategory(payload, CATERING_PACKAGES_CATEGORY_SLUG),
    queryCateringFlavors(payload),
  ])
  const cateringPackagesWithFlavors = cateringFlavors.length
    ? cateringPackages.products.map((cateringPackage) => ({
        ...cateringPackage,
        selectableProducts: cateringFlavors,
      }))
    : cateringPackages.products

  if (
    !bundles.products.length &&
    !cateringPackages.products.length &&
    !regularOrderData.items.length
  ) {
    return (
      <div className="container py-16">
        <p className="max-w-[42rem] text-base leading-8 text-[#6b5947]">
          {bundles.category
            ? 'The menu is seeded, but no published products were found yet.'
            : 'The catering category has not been seeded yet. Run the seed flow, then refresh this page.'}
        </p>
      </div>
    )
  }

  return (
    <div className={cateringSerif.variable}>
      <CateringMenuSection
        cateringPackages={cateringPackagesWithFlavors}
        initialSceneryTone={initialSceneryTone}
        initialSection={initialSection}
        products={bundles.products}
        regularItems={regularOrderData.items}
        seasonalLabel={regularOrderData.seasonalLabel}
      />
    </div>
  )
}
