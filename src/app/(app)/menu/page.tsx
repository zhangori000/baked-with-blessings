import configPromise from '@payload-config'
import type { Product } from '@/payload-types'
import { measureServerStep } from '@/utilities/devTiming'
import { Cormorant_Garamond } from 'next/font/google'
import { getPayload } from 'payload'
import React from 'react'

import { CateringMenuSection } from './_components/catering-menu-section.client'
import './_components/catering-menu-hero.css'

const cateringSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export const metadata = {
  description:
    'Browse the catering menu with transparent pricing, expandable item notes, and tray builders for cookies and mini cookies.',
  title: 'Catering Menu',
}

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

export default async function CateringMenuPage() {
  const payload = await measureServerStep('payload init: catering menu', () =>
    getPayload({ config: configPromise }),
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

  if (!cateringCategory) {
    return (
      <div className="container py-16">
        <p className="max-w-[42rem] text-base leading-8 text-[#6b5947]">
          The catering category has not been seeded yet. Run the seed flow, then refresh this page.
        </p>
      </div>
    )
  }

  const products = await measureServerStep('payload.find products: catering menu', () =>
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

  if (!products.docs.length) {
    return (
      <div className="container py-16">
        <p className="max-w-[42rem] text-base leading-8 text-[#6b5947]">
          The catering menu is seeded, but no published catering products were found yet.
        </p>
      </div>
    )
  }

  return (
    <div className={cateringSerif.variable}>
      <CateringMenuSection products={products.docs as Partial<Product>[]} />
    </div>
  )
}
