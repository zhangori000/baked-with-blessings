import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import { CATERING_PACKAGE_SPECS } from './lib/catering-package-specs'

const destroyWithTimeout = async (destroy: () => Promise<void>) => {
  await Promise.race([
    destroy(),
    new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('Payload shutdown timed out after 2s. Forcing process exit.')
        resolve()
      }, 2000)
    }),
  ])
}

const run = async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  try {
    for (const spec of CATERING_PACKAGE_SPECS) {
      const existing = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { slug: { equals: spec.slug } },
      })
      const product = existing.docs[0]

      if (!product) {
        payload.logger.warn(`- Skipped ${spec.slug}: product not found`)
        continue
      }

      const meta = product.meta && typeof product.meta === 'object' ? product.meta : {}
      if (
        product.title === spec.title &&
        !product.menuPortionLabel &&
        meta.description === spec.summary
      ) {
        payload.logger.info(`- Skipped ${spec.slug}: already "${spec.title}"`)
        continue
      }

      await payload.update({
        id: product.id,
        collection: 'products',
        data: {
          menuPortionLabel: null,
          meta: { ...meta, description: spec.summary },
          title: spec.title,
        },
        depth: 0,
        overrideAccess: true,
      })
      payload.logger.info(`- Renamed ${spec.slug}: "${product.title}" -> "${spec.title}"`)
    }
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
