import type { Category, Media, Product } from '@/payload-types'
import { type Payload, type PayloadRequest, RequiredDataFromCollectionSlug } from 'payload'

import { cookieCatalog, cookieCategory, type CookieSeedSpec } from './cookie-catalog'
import { createParagraphRichText } from './richText'

const buildCookieProductData = ({
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
