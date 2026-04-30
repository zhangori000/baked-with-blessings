import type { CollectionSlug, Payload, PayloadRequest } from 'payload'

import { seedBlogPosts } from './blog-posts'
import { ensureBlessingsNetworkStarterContent } from '@/features/blessings-network/services/networkData'
import { importCateringMedia } from './catering-media'
import { seedCateringProducts } from './catering-products'
import { importCookieMedia } from './cookie-media'
import { seedCookieProducts } from './cookie-products'
import { clearLegacyMedia } from './legacy-media'

const productCollectionsToReset: CollectionSlug[] = [
  'transactions',
  'orders',
  'carts',
  'addresses',
  'variants',
  'products',
  'categories',
  'variantOptions',
  'variantTypes',
]

const clearProductCollections = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  for (const collection of productCollectionsToReset) {
    await payload.db.deleteMany({ collection, req, where: {} })

    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }
}

export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding cookie catalog...')
  payload.logger.info('- Resetting product-related collections...')

  await clearProductCollections({ payload, req })

  payload.logger.info('- Removing legacy starter media...')

  const removedLegacyMedia = await clearLegacyMedia({ payload, req })

  payload.logger.info(`- Removed ${removedLegacyMedia} legacy media documents`)

  payload.logger.info('- Importing cookie media...')

  const mediaImportResult = await importCookieMedia({ payload, req })
  const cateringMediaImportResult = await importCateringMedia({ payload, req })
  const mediaBySlug = {
    ...mediaImportResult.mediaBySlug,
    ...cateringMediaImportResult.mediaBySlug,
  }

  payload.logger.info(
    `- Media import summary: cookies(created=${mediaImportResult.created}, updated=${mediaImportResult.updated}, skipped=${mediaImportResult.skipped}), catering(created=${cateringMediaImportResult.created}, updated=${cateringMediaImportResult.updated}, skipped=${cateringMediaImportResult.skipped})`,
  )

  payload.logger.info('- Seeding cookie products...')

  const cookieSeedResult = await seedCookieProducts({
    mediaBySlug,
    payload,
    req,
  })

  payload.logger.info('- Seeding catering products...')

  await seedCateringProducts({
    cookieProductsBySlug: cookieSeedResult.productsBySlug,
    mediaBySlug,
    payload,
    req,
  })

  payload.logger.info('- Seeding blog posts...')

  await seedBlogPosts({ payload, req })

  payload.logger.info('- Seeding Community Advice starter content...')

  await ensureBlessingsNetworkStarterContent(payload)

  payload.logger.info('Seeded cookie, catering, blog, and Community Advice content successfully!')
}
