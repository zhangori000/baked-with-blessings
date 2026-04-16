import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

import { createLocalReq, getPayload } from 'payload'

import config from '../src/payload.config'
import { seed } from '../src/endpoints/seed'

const runSeed = async () => {
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
      throw new Error('No admin exists yet. Run `pnpm bootstrap:admin` first, then run `pnpm seed`.')
    }

    const req = await createLocalReq({ user: admin }, payload)

    await seed({ payload, req })

    console.log('Database seeded successfully.')
  } finally {
    await payload.destroy()
  }
}

void runSeed().catch((error) => {
  console.error(error)
  process.exit(1)
})
