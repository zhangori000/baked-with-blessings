import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import { MIX_BOX_SPECS } from './lib/mix-box-specs'

/**
 * Provisions the "Build-Your-Own" mix-and-match boxes listed in
 * `scripts/lib/mix-box-specs.ts` (sizes and prices live there).
 *
 * It also moves the retired one-flavor 10-packs (Cookie Tray, Mini Cookie
 * Tray) back to draft. Any-flavor orders now go through Catering.
 *
 *   pnpm seed:mix-boxes            (local Docker database)
 *
 * A box missing from the database is created and published, with no gallery
 * image or summary (add those in the admin panel).
 *
 * All of them are batch-builder products with flavorSelection 'mixAndMatch'. Their
 * selectableProducts is the FULL cookie catalog; the storefront restricts the
 * pickable flavors to the currently-available ones (always + active rotation)
 * at render/validation time, so the box auto-includes new in-rotation flavors
 * and excludes legacy ones with no manual list to maintain. (Legacy flavors
 * are only orderable in the one-flavor "binge" trays.)
 *
 * Idempotent: re-running updates the core fields and leaves owner edits to
 * other fields alone. Hosted databases are owner-managed; only run this
 * against preview/prod when explicitly asked.
 */

const RETIRED_TRAY_SLUGS = ['cookie-tray', 'mini-cookie-tray']

const text = (value: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal' as const,
  style: '',
  text: value,
  type: 'text' as const,
  version: 1,
})

const paragraph = (value: string) => ({
  children: [text(value)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  type: 'paragraph' as const,
  version: 1,
})

const buildPitch = (paragraphs: string[]) => ({
  root: {
    children: paragraphs.map(paragraph),
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
})

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
    const cateringCategory = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: 'catering' } },
    })
    const cateringCategoryID = cateringCategory.docs[0]?.id

    if (!cateringCategoryID) {
      console.error('No catering category found — seed the catalog first.')
      return
    }

    const cookieCategory = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: 'cookies' } },
    })
    const cookieCategoryID = cookieCategory.docs[0]?.id

    if (!cookieCategoryID) {
      console.error('No cookies category found — seed the cookie catalog first.')
      return
    }

    // Every cookie flavor is a candidate; the storefront narrows mix boxes to
    // the currently-available ones at render/validation time. (Non-cookie bakery
    // items live in their own category, so they never show up here.)
    const flavorResult = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 0,
      overrideAccess: true,
      pagination: false,
      select: { slug: true },
      where: { categories: { contains: cookieCategoryID } },
    })
    const flavorIDs = flavorResult.docs.map((flavor) => flavor.id)

    if (flavorIDs.length === 0) {
      console.error('No cookie flavors resolved — seed the cookie catalog first.')
      return
    }

    for (const spec of MIX_BOX_SPECS) {
      const coreData = {
        _status: 'published' as const,
        categories: [cateringCategoryID],
        flavorSelection: 'mixAndMatch' as const,
        menuBehavior: 'batchBuilder' as const,
        menuExpandedPitch: buildPitch(spec.pitchParagraphs),
        menuPortionLabel: spec.portionLabel,
        priceInUSD: spec.priceCents,
        priceInUSDEnabled: true,
        requiredSelectionCount: spec.capacity,
        selectableProducts: flavorIDs,
        title: spec.title,
      }

      const existing = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { slug: { equals: spec.slug } },
      })

      if (existing.docs[0]) {
        await payload.update({
          id: existing.docs[0].id,
          collection: 'products',
          data: coreData,
          depth: 0,
          overrideAccess: true,
        })
        console.log(
          `- Updated ${spec.slug} (#${existing.docs[0].id}): ${flavorIDs.length} flavors, ${spec.capacity} for ${spec.priceCents} cents`,
        )
      } else {
        const created = await payload.create({
          collection: 'products',
          data: { ...coreData, slug: spec.slug },
          overrideAccess: true,
        })
        console.log(
          `- Created ${spec.slug} (#${created.id}): ${flavorIDs.length} flavors, ${spec.capacity} for ${spec.priceCents} cents`,
        )
      }
    }

    for (const slug of RETIRED_TRAY_SLUGS) {
      const tray = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { slug: { equals: slug } },
      })
      const doc = tray.docs[0]

      if (!doc) {
        continue
      }

      if (doc._status === 'draft') {
        console.log(`- ${slug} (#${doc.id}) already draft`)
        continue
      }

      await payload.update({
        id: doc.id,
        collection: 'products',
        data: { _status: 'draft' },
        depth: 0,
        overrideAccess: true,
      })
      console.log(`- Moved ${slug} (#${doc.id}) to draft`)
    }
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => {
    console.log('Mix boxes seeded.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
