import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import { seedProduction } from '../src/endpoints/seed/production'

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

const runSeed = async () => {
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
        'No admin exists yet. Run `pnpm bootstrap:admin` first, then run `pnpm seed:prod`.',
      )
    }

    const req = await createLocalReq({ user: admin }, payload)

    await seedProduction({ payload, req })

    console.log('Production database seeded successfully.')
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void runSeed()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
