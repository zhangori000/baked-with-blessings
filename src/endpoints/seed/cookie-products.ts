import type { Category, Media, Product } from '@/payload-types'
import { type Payload, type PayloadRequest, RequiredDataFromCollectionSlug } from 'payload'

import {
  cookieCatalog,
  cookieCategory,
  type CookieSeedSpec,
  defaultCookieMiniPriceInUSD,
} from './cookie-catalog'
import { getCookieAllergens } from '@/features/products/cookieDisplayData'

import { createParagraphRichText, createSegmentedParagraphsRichText } from './richText'

const allergyNoteBySlug: Record<string, string> = {
  'banana-choc-chip-walnut':
    'Allergy: contains walnuts and is baked in a shared kitchen with wheat, milk, eggs, soy, peanuts, and tree nuts.',
  'dubai-chocolate':
    'Allergy: contains pistachio cream and is baked in a shared kitchen with wheat, milk, eggs, soy, peanuts, and tree nuts.',
  'peanut-butter-cup':
    'Allergy: contains peanut butter and peanut butter cup pieces.',
  smores:
    'Allergy: marshmallow may contain gelatin; baked in a shared kitchen with wheat, milk, eggs, soy, peanuts, and tree nuts.',
}

const SHARED_KITCHEN = ['wheat', 'milk', 'eggs', 'soy', 'peanuts', 'tree nuts']

const getAllergyNote = (slug: string) =>
  allergyNoteBySlug[slug] ??
  'Allergy: baked in a shared kitchen with wheat, milk, eggs, soy, peanuts, and tree nuts.'

const formatList = (items: string[]) => {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

const mentions = (text: string, item: string) => text.toLowerCase().includes(item.toLowerCase())

// Written into Payload poster.receiptBody. The storefront prints that field as-is.
const buildStoredAllergenLine = (slug: string) => {
  const contains = getCookieAllergens(slug)
  const extra = getAllergyNote(slug)
    .replace(/^Allergy:\s*/i, '')
    .replace(/baked in a shared kitchen with wheat, milk, eggs, soy, peanuts, and tree nuts\.?/i, '')
    .replace(/^contains\s+/i, '')
    .replace(/\s+and is\s*$/i, '')
    .replace(/[.;]\s*$/g, '')
    .trim()
  const named = contains.filter((item) => !extra || !mentions(extra, item))
  const also = SHARED_KITCHEN.filter(
    (item) =>
      !contains.some((namedItem) => mentions(namedItem, item) || mentions(item, namedItem)) &&
      !mentions(extra, item),
  )
  const parts = [
    extra ? extra.charAt(0).toUpperCase() + extra.slice(1) : '',
    named.length > 0 ? `Contains ${formatList(named)}` : '',
    also.length > 0 ? `Baked in a shared kitchen with ${formatList(also)}` : '',
  ].filter(Boolean)

  return `${parts.join('. ')}.`
}

const createCookieInfoBody = (spec: CookieSeedSpec) =>
  createSegmentedParagraphsRichText([[spec.summary], [buildStoredAllergenLine(spec.slug)]])

export const buildPosterData = (spec: CookieSeedSpec) => {
  return {
    receiptBody: createCookieInfoBody(spec),
  }
}

export const buildCookieProductData = ({
  category,
  image,
  spec,
}: {
  category: Category
  image: Media
  spec: CookieSeedSpec
}): RequiredDataFromCollectionSlug<'products'> => {
  return {
    _status: 'published',
    categories: [category],
    description: createParagraphRichText(spec.summary),
    gallery: [{ image }],
    layout: [],
    meta: {
      description: spec.metaDescription,
      image,
      title: `${spec.title} | Baked with Blessings`,
    },
    miniPriceInUSD: spec.miniPriceInUSD ?? defaultCookieMiniPriceInUSD,
    poster: buildPosterData(spec),
    priceInUSD: spec.priceInUSD,
    priceInUSDEnabled: true,
    relatedProducts: [],
    slug: spec.slug,
    title: spec.title,
  }
}

export const seedCookieProducts = async ({
  mediaBySlug,
  payload,
  req,
}: {
  mediaBySlug: Record<string, Media>
  payload: Payload
  req: PayloadRequest
}) => {
  const category = await payload.create({
    collection: 'categories',
    data: cookieCategory,
    depth: 0,
    req,
  })
  const productsBySlug: Record<string, Product> = {}

  for (const spec of cookieCatalog) {
    const image = mediaBySlug[spec.slug]

    if (!image) {
      throw new Error(`Missing media document for cookie slug "${spec.slug}".`)
    }

    const product = await payload.create({
      collection: 'products',
      data: buildCookieProductData({
        category,
        image,
        spec,
      }),
      depth: 0,
      req,
    })

    productsBySlug[spec.slug] = product

    payload.logger.info(`- Seeded product ${spec.slug}`)
  }

  return {
    category,
    productsBySlug,
  }
}
