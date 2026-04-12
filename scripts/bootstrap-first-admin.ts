import 'dotenv/config'

import { getPayload } from 'payload'

import { FIRST_ADMIN_BOOTSTRAP_CONTEXT } from '../src/collections/Admins/hooks/requireExplicitFirstAdminBootstrap'
import config from '../src/payload.config'

/*
 * Local usage:
 *   1. Set BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD / BOOTSTRAP_ADMIN_NAME in .env
 *   2. Run: pnpm bootstrap:admin
 *
 * Later, for hosted Vercel environments, run the same script with environment injection:
 *   - Preview:    vercel env run -e preview -- pnpm bootstrap:admin
 *   - Production: vercel env run -e production -- pnpm bootstrap:admin
 */

const requiredEnv = ['BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PASSWORD'] as const

const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim())

if (missingEnv.length > 0) {
  throw new Error(
    `Missing required env vars for admin bootstrap: ${missingEnv.join(', ')}. Add them to your .env before running this script.`,
  )
}

const bootstrap = async () => {
  const payload = await getPayload({ config })
  try {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL!.trim().toLowerCase()
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD!.trim()
    const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'Site Admin'

    const existingAdmins = await payload.find({
      collection: 'admins',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
    })

    if (existingAdmins.docs.length > 0) {
      console.log('An admin already exists. Skipping bootstrap.')
      return
    }

    const admin = await payload.create({
      collection: 'admins',
      context: {
        [FIRST_ADMIN_BOOTSTRAP_CONTEXT]: true,
      },
      data: {
        email,
        name,
        password,
      },
      overrideAccess: true,
    })

    console.log(`Created first admin: ${admin.email}`)
  } finally {
    await payload.destroy()
  }
}

void bootstrap().catch((error) => {
  console.error(error)
  process.exit(1)
})
