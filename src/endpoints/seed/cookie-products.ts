import type { Category, Media, Product } from '@/payload-types'
import { type Payload, type PayloadRequest, RequiredDataFromCollectionSlug } from 'payload'

import {
  cookieCatalog,
  cookieCategory,
  type CookieSeedSpec,
  defaultCookieMiniPriceInUSD,
} from './cookie-catalog'
import { createParagraphRichText, createSegmentedParagraphsRichText } from './richText'

const textureNoteBySlug: Record<string, string> = {
  'apple-snickerdoodle': 'Apple pie meets snickerdoodle',
  'banana-choc-chip-walnut': 'Banana bread cookie',
  'banana-crumble': 'Soft banana streusel cookie',
  biscoff: 'Cookie butter loaded',
  brookie: 'Brownie cookie mashup',
  'cinnamon-roll': 'Bakery roll in cookie form',
  'dubai-chocolate': 'Pistachio chocolate cookie',
  'oreo-cheesecake': 'Creamy Oreo center',
  'peanut-butter-cup': 'Chocolate peanut butter cookie',
  'salted-caramel-nest': 'Salted caramel nest cookie',
  smores: 'Campfire cookie',
  'strawberry-cheesecake': 'Berry cheesecake cookie',
  'strawberry-matcha': 'Matcha berry swirl',
  'strawberry-matcha-marble': 'Marbled berry matcha cookie',
  'red-velvet-cheesecake': 'Red velvet cheesecake cookie',
  'toasted-and-tasseled': 'S’more graduation cookie',
  'sticky-mango-rice-krispy-treats': 'Mango mochi krispy cookie',
  'freshly-baked-dirty-chai-cookie': 'Chai espresso cookie',
}

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

const getAllergyNote = (slug: string) =>
  allergyNoteBySlug[slug] ??
  'Allergy: baked in a shared kitchen with wheat, milk, eggs, soy, peanuts, and tree nuts.'

const createCookieInfoBody = (spec: CookieSeedSpec) =>
  createSegmentedParagraphsRichText([
    [spec.summary],
    [
      'Texture: ',
      { bold: true, text: textureNoteBySlug[spec.slug] ?? 'Bakery-style cookie' },
      '. Best served warm.',
    ],
    [{ bold: true, text: 'Allergy: ' }, getAllergyNote(spec.slug).replace(/^Allergy:\s*/, '')],
  ])

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
