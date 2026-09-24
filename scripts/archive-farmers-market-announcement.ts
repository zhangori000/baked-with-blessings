import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/**
 * Hides farmers-market announcement rows without deleting them.
 * Safe to run more than once. Does not replace the rest of the list.
 *
 *   tsx scripts/archive-farmers-market-announcement.ts
 *   vercel env run -e preview -- tsx scripts/archive-farmers-market-announcement.ts
 *   vercel env run -e production -- tsx scripts/archive-farmers-market-announcement.ts
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
  const { sql } = await import('@payloadcms/db-postgres')
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  try {
    await payload.db.drizzle.execute(sql`
      ALTER TABLE "announcements_items" ADD COLUMN IF NOT EXISTS "posted_on" timestamp(3) with time zone;
      ALTER TABLE "announcements_items" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false;
      ALTER TABLE "announcements_items" ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false;

      UPDATE "announcements_items" AS items
      SET "posted_on" = COALESCE(parent."updated_at", parent."created_at", NOW())
      FROM "announcements" AS parent
      WHERE items."_parent_id" = parent."id"
        AND items."posted_on" IS NULL;

      UPDATE "announcements_items" SET "pinned" = false WHERE "pinned" IS NULL;
      UPDATE "announcements_items" SET "archived" = false WHERE "archived" IS NULL;
    `)
    const current = await payload.findGlobal({
      slug: 'announcements',
      depth: 0,
      overrideAccess: true,
    })
    const items = current.items ?? []
    let archivedCount = 0
    const nextItems = items.map((item) => {
      const title = typeof item.title === 'string' ? item.title : ''
      const shouldArchive = /farmers market/i.test(title)
      if (shouldArchive) archivedCount += 1
      return {
        ...item,
        archived: shouldArchive ? true : Boolean(item.archived),
      }
    })

    if (archivedCount === 0) {
      console.log('No farmers market announcement row found. Nothing changed.')
      return
    }

    await payload.updateGlobal({
      slug: 'announcements',
      data: { items: nextItems },
      depth: 0,
      overrideAccess: true,
    })

    console.log(`Archived ${archivedCount} farmers market announcement row(s).`)
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
