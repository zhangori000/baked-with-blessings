import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import { cookieCatalog, defaultCookieMiniPriceInUSD } from '../src/endpoints/seed/cookie-catalog'

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
    for (const spec of cookieCatalog) {
      const existing = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          slug: {
            equals: spec.slug,
          },
        },
      })

      const product = existing.docs[0]

      if (!product) {
        payload.logger.warn(`- Skipped ${spec.slug}: product not found`)
        continue
      }

      const miniPriceInUSD = spec.miniPriceInUSD ?? defaultCookieMiniPriceInUSD

      if (product.priceInUSD === spec.priceInUSD && product.miniPriceInUSD === miniPriceInUSD) {
        payload.logger.info(
          `- Skipped ${spec.slug}: large already ${spec.priceInUSD}, mini already ${miniPriceInUSD}`,
        )
        continue
      }

      await payload.update({
        id: product.id,
        collection: 'products',
        data: {
          miniPriceInUSD,
          priceInUSD: spec.priceInUSD,
          priceInUSDEnabled: true,
        },
        depth: 0,
        overrideAccess: true,
      })

      payload.logger.info(
        `- Updated ${spec.slug}: large ${product.priceInUSD ?? 'unset'} -> ${spec.priceInUSD}, mini ${product.miniPriceInUSD ?? 'unset'} -> ${miniPriceInUSD}`,
      )
    }
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => {
    console.log('Cookie prices synced from cookieCatalog.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
