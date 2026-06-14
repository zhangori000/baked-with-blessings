import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/**
 * One-time convenience: pushes the current farmers-market announcement to an
 * environment so the owner does not have to retype it. Announcements are
 * otherwise OWNER-MANAGED and change week to week — edit them in the admin
 * panel (Announcements) going forward; do NOT wire this into a recurring sync,
 * or it will clobber the owner's latest note.
 *
 *   pnpm sync:announcement            (local Docker database)
 *   vercel env run -e preview -- pnpm sync:announcement
 *
 * Overwrites the announcements list with the single entry below.
 */

const ANNOUNCEMENTS = [
  {
    title: 'Farmers market — Wednesday, June 17',
    message:
      'Find us at the downtown farmers market on Wednesday, June 17, from 9am to 1pm. Preorder by Tuesday night and your cookies will be waiting at the stand with your name on them.',
    linkLabel: 'Preorder now',
    linkHref: '/menu',
  },
]

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
    await payload.updateGlobal({
      slug: 'announcements',
      data: { items: ANNOUNCEMENTS },
      overrideAccess: true,
    })
    console.log(`Announcement synced: "${ANNOUNCEMENTS[0]?.title}"`)
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
