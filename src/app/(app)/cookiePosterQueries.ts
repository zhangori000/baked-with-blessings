import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  buildCookiePosterAssets,
  cookiePosterMetas,
  type CookiePosterAsset,
} from './shop/cookiePosterData'

export const buildFallbackHomeCookiePosters = (): CookiePosterAsset[] =>
  cookiePosterMetas.map((meta) => ({
    ...meta,
    amount: 'Fresh weekly',
    href: `/cookies/${meta.slug}`,
    image: null,
    productHref: `/products/${meta.slug}`,
  }))

export const queryHomeCookiePosters = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'products',
    draft: false,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: {
      gallery: true,
      id: true,
      meta: true,
      priceInUSD: true,
      slug: true,
      title: true,
    },
    sort: 'title',
  })

  const posters = buildCookiePosterAssets(result.docs)

  return posters.length > 0 ? posters : buildFallbackHomeCookiePosters()
}
