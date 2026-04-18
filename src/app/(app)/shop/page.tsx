import { CloudCluster } from '@/components/CloudCluster'
import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { CookiePosterGrid } from './cookie-poster-grid'
import { buildCookiePosterAssets } from './cookiePosterData'
import { shopSectionGroups } from './menuSections'

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

type DecorativeCloud = {
  compact: boolean
  drift: 'left' | 'right'
  style: React.CSSProperties
  variant: 'story' | 'halfEgg' | 'stacked'
}

const nonSquareCategorySlugs = ['entrees']

const cloudsPerViewport = 6
const cloudFieldViewportCount = 5

const seededFloat = (seed: number) => {
  const value = Math.sin(seed * 999.91) * 43758.5453
  return value - Math.floor(value)
}

const decorativeClouds: DecorativeCloud[] = Array.from(
  { length: cloudFieldViewportCount * cloudsPerViewport },
  (_, cloudIndex) => {
    const viewportIndex = Math.floor(cloudIndex / cloudsPerViewport)
    const bandIndex = cloudIndex % cloudsPerViewport
    const seedBase = viewportIndex * 53 + bandIndex * 17 + 11
    const lane = (['left', 'center', 'right'] as const)[bandIndex % 3]
    const drift: DecorativeCloud['drift'] = seededFloat(seedBase + 1) > 0.5 ? 'right' : 'left'
    const baseTop = 7 + bandIndex * 15
    const topJitter = (seededFloat(seedBase + 2) - 0.5) * 9
    const scale = 0.98 + seededFloat(seedBase + 3) * 0.42
    const travelX = 5.5 + seededFloat(seedBase + 4) * 5.5
    const travelY = -0.8 - seededFloat(seedBase + 5) * 1.2
    const duration = 20 + Math.round(seededFloat(seedBase + 6) * 7) * 2
    const anchorRanges = {
      center: [30, 70],
      left: [5, 28],
      right: [72, 95],
    } as const
    const [anchorMin, anchorMax] = anchorRanges[lane]
    const anchorPercent = anchorMin + seededFloat(seedBase + 7) * (anchorMax - anchorMin)
    const width = `clamp(12.5rem, ${13.5 + seededFloat(seedBase + 9) * 5.5}vw, 18.5rem)`
    const shouldSkipOpeningRightCloud = viewportIndex === 0 && bandIndex === 2

    if (shouldSkipOpeningRightCloud) {
      return null
    }

    return {
      compact: true,
      drift,
      style: {
        '--cloud-anchor-x': '-50%',
        '--cloud-drift-x': `${travelX.toFixed(2)}rem`,
        '--cloud-drift-y': `${travelY.toFixed(2)}rem`,
        '--cloud-duration': `${duration}s`,
        '--cloud-scale': scale.toFixed(2),
        '--cloud-tilt': drift === 'right' ? '-3deg' : '3deg',
        left: `${anchorPercent.toFixed(2)}%`,
        top: `calc(${viewportIndex * 100}vh + ${(baseTop + topJitter).toFixed(2)}vh)`,
        width,
      } as React.CSSProperties,
      variant: 'halfEgg' as const,
    }
  },
).flatMap((cloud) => (cloud ? [cloud] : []))

const normalizeSlug = (value: unknown): string => {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

const queryValue = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value
}

const isNonSquareCategory = (category: unknown) => {
  return (
    typeof category === 'object' &&
    category !== null &&
    nonSquareCategorySlugs.includes(normalizeSlug((category as { slug?: unknown }).slug))
  )
}

export const metadata = {
  description: 'Browse the menu.',
  title: 'Menu',
}

export default async function ShopPage({ searchParams }: Props) {
  const rawParams = await searchParams
  const searchValue = queryValue(rawParams.q)
  const sort = queryValue(rawParams.sort)
  const category = queryValue(rawParams.category)
  const requestedSection = queryValue(rawParams.section)
  const payload = await getPayload({ config: configPromise })
  const isFilteredView = Boolean(searchValue || category)

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    pagination: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      meta: true,
      priceInUSD: true,
      variants: true,
    },
    ...(sort ? { sort } : { sort: 'title' }),
    ...(isFilteredView
      ? {
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              ...(searchValue
                ? [
                    {
                      or: [
                        {
                          title: {
                            like: searchValue,
                          },
                        },
                        {
                          description: {
                            like: searchValue,
                          },
                        },
                      ],
                    },
                  ]
                : []),
              ...(category
                ? [
                    {
                      categories: {
                        contains: category,
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : {}),
  })

  if (!products.docs?.length) {
    return <p className="text-sm text-[#6b5947]">No menu items matched the current search.</p>
  }

  const categories = await payload.find({
    collection: 'categories',
    pagination: false,
    sort: 'menuOrder',
    select: {
      title: true,
      slug: true,
      menuOrder: true,
    },
  })

  const categorySections = categories.docs
    .map((categoryDoc) => {
      const sectionProducts = products.docs.filter((product) => {
        const productCategoryIDs =
          product.categories?.map((productCategory) =>
            typeof productCategory === 'object'
              ? String(productCategory.id)
              : String(productCategory),
          ) ?? []

        return productCategoryIDs.includes(String(categoryDoc.id))
      })

      return {
        category: categoryDoc,
        products: sectionProducts,
      }
    })
    .filter((section) => section.products.length > 0)

  const categorySectionBySlug = new Map(
    categorySections.map((section) => [normalizeSlug(section.category.slug), section]),
  )

  const groupedMenuSections = shopSectionGroups
    .map((sectionGroup) => {
      const groupedCategories = sectionGroup.categorySlugs
        .map((slug) => categorySectionBySlug.get(slug))
        .filter(
          (
            categorySection,
          ): categorySection is NonNullable<ReturnType<typeof categorySectionBySlug.get>> =>
            Boolean(categorySection),
        )

      return {
        ...sectionGroup,
        categories: groupedCategories,
      }
    })
    .filter((sectionGroup) => sectionGroup.categories.length > 0)

  const activeSectionId = groupedMenuSections.some(
    (sectionGroup) => sectionGroup.id === requestedSection,
  )
    ? requestedSection
    : groupedMenuSections[0]?.id

  const visibleSection = groupedMenuSections.find(
    (sectionGroup) => sectionGroup.id === activeSectionId,
  )

  if (!visibleSection) {
    return null
  }

  return (
    <div
      className="shopSkyScene overflow-visible"
      style={{ '--shop-section-nav-height': '4.5rem' } as React.CSSProperties}
    >
      <div aria-hidden="true" className="shopSkyField">
        {decorativeClouds.map((cloud, index) => (
          <CloudCluster
            className={`shopSkyCloud ${
              cloud.drift === 'right' ? 'shopSkyCloud--drift-right' : 'shopSkyCloud--drift-left'
            }`}
            data-cloud-compact={cloud.compact ? 'true' : 'false'}
            key={`${cloud.variant}-${index}`}
            style={cloud.style}
            variant={cloud.variant}
          />
        ))}
      </div>

      <div className="shopSkyContent">
        <div className="container">
          <section className="space-y-12" id={visibleSection.id}>
            {visibleSection.categories.map((categorySection) => {
              const categorySlug = normalizeSlug(categorySection.category.slug)

              if (categorySlug === 'cookies') {
                return (
                  <CookiePosterGrid
                    key={categorySection.category.id}
                    posters={buildCookiePosterAssets(categorySection.products)}
                  />
                )
              }

              return (
                <Grid
                  className={
                    isNonSquareCategory(categorySection.category)
                      ? 'grid grid-cols-1 gap-3 lg:grid-cols-2'
                      : 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4'
                  }
                  key={categorySection.category.id}
                >
                  {categorySection.products.map((product) => (
                    <ProductGridItem
                      key={product.id}
                      product={product}
                      quickView={!isNonSquareCategory(categorySection.category)}
                      variant={isNonSquareCategory(categorySection.category) ? 'default' : 'square'}
                    />
                  ))}
                </Grid>
              )
            })}
          </section>
        </div>
      </div>
    </div>
  )
}
