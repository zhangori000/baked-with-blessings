import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/**
 * Brings an environment's cookie catalog up to the committed source of truth in
 * `src/endpoints/seed/cookie-catalog.ts` — without disturbing existing data.
 * Built so a divergent environment (e.g. a preview DB seeded before the owner
 * added the signature flavors) can gain the missing flavors with one command.
 *
 *   pnpm sync:cookie-catalog                                  (local Docker DB)
 *   vercel env run -e preview -- pnpm sync:cookie-catalog
 *
 * Idempotent:
 *   - Media: importCookieMedia uploads any image whose filename is not present
 *     yet (matched by sourceFilename), and reuses the rest. No duplicates on an
 *     environment that already has the flavor.
 *   - Products: a cookie product is CREATED only if its slug is missing. Ones
 *     that already exist are left exactly as the owner has them (this never
 *     overwrites admin edits).
 *
 * After this, run `pnpm sync:menu-content` to set availability / sizes /
 * rotation / boxes for the now-present flavors.
 */

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
  const { createLocalReq, getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const { cookieCatalog, cookieCategory } = await import('../src/endpoints/seed/cookie-catalog')
  const { importCookieMedia } = await import('../src/endpoints/seed/cookie-media')
  const { buildCookieProductData } = await import('../src/endpoints/seed/cookie-products')
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
      throw new Error('No admin exists yet. Run `pnpm bootstrap:admin` first.')
    }
    const req = await createLocalReq({ user: admin }, payload)

    // 1. Ensure the cookies category exists (find or create).
    const existingCategory = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: { slug: { equals: cookieCategory.slug } },
    })
    const category =
      existingCategory.docs[0] ??
      (await payload.create({ collection: 'categories', data: cookieCategory, depth: 0, req }))

    // 2. Ensure every catalog image exists (idempotent by filename).
    const { mediaBySlug } = await importCookieMedia({ payload, req })

    // 3. Create only the cookie products whose slug is missing.
    let created = 0
    let skipped = 0
    for (const spec of cookieCatalog) {
      const existing = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: { slug: { equals: spec.slug } },
      })

      if (existing.docs[0]) {
        skipped += 1
        continue
      }

      const image = mediaBySlug[spec.slug]
      if (!image) {
        payload.logger.warn(`- Skipped ${spec.slug}: no media resolved`)
        continue
      }

      await payload.create({
        collection: 'products',
        data: buildCookieProductData({ category, image, spec }),
        depth: 0,
        req,
      })
      created += 1
      payload.logger.info(`- Created cookie product ${spec.slug}`)
    }

    console.log(`Cookie catalog synced. Created ${created}, left ${skipped} existing untouched.`)
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
