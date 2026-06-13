import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/**
 * Syncs the catering tray / pudding CONTENT (price, copy, portion label, meta
 * description) from the single source of truth in
 * `src/endpoints/seed/catering-catalog.ts`. This is the part of the agreed menu
 * state the create-only catalog seed cannot re-apply to an already-populated
 * database — e.g. the Cookie Tray's $50 one-flavor reprice and the binge copy.
 *
 *   pnpm sync:catering-content            (local Docker database)
 *
 * Hosted databases are owner-managed; only point this at preview/prod when
 * explicitly asked, via `vercel env run -e preview -- pnpm sync:catering-content`.
 *
 * Idempotent and safe to re-run. Matches products by slug and updates ONLY the
 * text/price fields — it never touches gallery images, categories, or a tray's
 * selectable flavors, so owner-managed media and the mix-box flavor lists stay
 * intact. Products that do not exist in the target environment are skipped with
 * a warning (run `pnpm seed:prod` first if the catalog was never seeded there).
 *
 * The two build-your-own mix boxes live in `pnpm seed:mix-boxes`; the cookie
 * flavor lineup / rotation lives in `pnpm update:flavor-lineup`.
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
  const { cateringCatalog } = await import('../src/endpoints/seed/catering-catalog')
  const { createHeadingAndParagraphsRichText, createParagraphRichText } = await import(
    '../src/endpoints/seed/richText'
  )
  const payload = await getPayload({ config })

  try {
    for (const spec of cateringCatalog) {
      const found = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { slug: { equals: spec.slug } },
      })

      const doc = found.docs[0]
      if (!doc) {
        payload.logger.warn(
          `- Skipped ${spec.slug}: not found in this environment (run pnpm seed:prod if the catalog was never seeded here)`,
        )
        continue
      }

      const existingMeta = (doc as { meta?: Record<string, unknown> }).meta ?? {}

      await payload.update({
        id: doc.id,
        collection: 'products',
        data: {
          description: createParagraphRichText(spec.summary),
          menuExpandedPitch: createHeadingAndParagraphsRichText({
            heading: `Why order the ${spec.title}?`,
            paragraphs: spec.expandedPitchParagraphs,
          }),
          menuPortionLabel: spec.menuPortionLabel,
          meta: { ...existingMeta, description: spec.metaDescription },
          priceInUSD: spec.priceInUSD,
          priceInUSDEnabled: true,
          title: spec.title,
          ...(spec.menuBehavior === 'batchBuilder' && spec.requiredSelectionCount
            ? { requiredSelectionCount: spec.requiredSelectionCount }
            : {}),
        },
        depth: 0,
        overrideAccess: true,
      })

      payload.logger.info(`- Synced ${spec.slug} (#${doc.id}): ${spec.priceInUSD} cents`)
    }
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => {
    console.log('Catering content synced.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
