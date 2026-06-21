import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/**
 * Provisions the two "Build-Your-Own" mix-and-match boxes:
 *   - Build-Your-Own Mini Box   (6 mini cookies,  $14)
 *   - Build-Your-Own Cookie Box (4 large cookies, $25)
 *
 *   pnpm seed:mix-boxes            (local Docker database)
 *
 * Both are batch-builder products with flavorSelection 'mixAndMatch'. Their
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

type BoxSpec = {
  capacity: number
  portionLabel: string
  priceCents: number
  slug: string
  title: string
  pitchParagraphs: string[]
}

const BOX_SPECS: BoxSpec[] = [
  {
    capacity: 6,
    portionLabel: '6 mini cookies · mix & match',
    priceCents: 1400,
    slug: 'build-your-own-mini-box',
    title: 'Build-Your-Own Mini Box',
    pitchParagraphs: [
      'Build a box of six mini cookies and mix the flavors however you like — all six the same or six different, your call.',
      'Add the box to your cart, then build another. Each box is its own order line, so the kitchen sees exactly which minis to bake.',
    ],
  },
  {
    capacity: 4,
    portionLabel: '4 large cookies · mix & match',
    priceCents: 2500,
    slug: 'build-your-own-cookie-box',
    title: 'Build-Your-Own Cookie Box',
    pitchParagraphs: [
      'Build a box of four full-size cookies and mix the flavors however you like — sample four different ones or stock up on a favorite.',
      'Add the box to your cart, then build another. Each box is its own order line, so the kitchen knows exactly what to bake.',
    ],
  },
]

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

    for (const spec of BOX_SPECS) {
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
