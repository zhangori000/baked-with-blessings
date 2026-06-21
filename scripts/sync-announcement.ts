import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/**
 * Pushes the committed announcement (src/endpoints/seed/announcements.ts) to an
 * environment so the owner does not have to retype it. Announcements are
 * OWNER-MANAGED day to day — edit them in the admin panel (Announcements) going
 * forward; do NOT wire this into a recurring sync, or it will clobber the
 * owner's latest note.
 *
 *   pnpm sync:announcement                                     (local Docker DB)
 *   vercel env run -e preview -- pnpm sync:announcement
 *   vercel env run -e production -- pnpm sync:announcement
 *
 * Overwrites the announcements list with the committed entries below.
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
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const { announcementItems, seedAnnouncements } = await import(
    '../src/endpoints/seed/announcements'
  )
  const payload = await getPayload({ config })

  try {
    await seedAnnouncements({ payload })
    console.log(`Announcement synced: "${announcementItems[0]?.title}"`)
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
