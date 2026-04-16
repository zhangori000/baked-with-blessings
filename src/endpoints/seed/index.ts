import type { CollectionSlug, Payload, PayloadRequest } from 'payload'

import { importCookieMedia } from './cookie-media'
import { seedCookieProducts } from './cookie-products'

const productCollectionsToReset: CollectionSlug[] = [
  'products',
  'categories',
  'variants',
  'variantOptions',
  'variantTypes',
  'carts',
  'transactions',
  'addresses',
  'orders',
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

  payload.logger.info('- Importing cookie media...')

  const mediaImportResult = await importCookieMedia({ payload, req })

  payload.logger.info(
    `- Cookie media import summary: created=${mediaImportResult.created}, updated=${mediaImportResult.updated}, skipped=${mediaImportResult.skipped}`,
  )

  payload.logger.info('- Seeding cookie products...')

  await seedCookieProducts({
    mediaBySlug: mediaImportResult.mediaBySlug,
    payload,
    req,
  })

  payload.logger.info('Seeded cookie catalog successfully!')
}
