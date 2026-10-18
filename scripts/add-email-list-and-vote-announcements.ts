import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/**
 * Adds the "How to join our email list" and flavor vote notes from
 * src/endpoints/seed/announcements.ts to an environment's Announcements.
 * Unlike sync:announcement, this keeps every existing row as it is and only
 * adds a note whose title is not already in the list. Safe to run more than once.
 *
 *   tsx scripts/add-email-list-and-vote-announcements.ts
 *   vercel env run -e preview -- tsx scripts/add-email-list-and-vote-announcements.ts
 *   vercel env run -e production -- tsx scripts/add-email-list-and-vote-announcements.ts
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
  const { emailListAnnouncement, flavorVoteAnnouncement } =
    await import('../src/endpoints/seed/announcements')
  const payload = await getPayload({ config })

  try {
    const current = await payload.findGlobal({
      slug: 'announcements',
      depth: 0,
      overrideAccess: true,
    })
    const items = current.items ?? []
    const existingTitles = new Set(items.map((item) => item.title.trim().toLowerCase()))
    const missing = [emailListAnnouncement, flavorVoteAnnouncement].filter(
      (note) => !existingTitles.has(note.title.trim().toLowerCase()),
    )

    if (missing.length === 0) {
      console.log('Both notes are already in Announcements. Nothing changed.')
      return
    }

    await payload.updateGlobal({
      slug: 'announcements',
      data: { items: [...missing, ...items] },
      depth: 0,
      overrideAccess: true,
    })

    for (const note of missing) console.log(`Added announcement: "${note.title}"`)
    console.log(`Kept ${items.length} existing announcement row(s).`)
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
