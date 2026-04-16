import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())

import { importCookieMedia } from '../src/endpoints/seed/cookie-media'

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

const runImport = async () => {
  const { createLocalReq, getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  try {
    const admins = await payload.find({
      collection: 'admins',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
    })

    const admin = admins.docs[0]

    if (!admin) {
      throw new Error(
        'No admin exists yet. Run `pnpm bootstrap:admin` first, then run `pnpm import:cookie-media`.',
      )
    }

    const req = await createLocalReq({ user: admin }, payload)
    const result = await importCookieMedia({ payload, req })

    console.log(
      `Cookie media import finished. Created: ${result.created}, updated: ${result.updated}, skipped: ${result.skipped}.`,
    )
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void runImport()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
