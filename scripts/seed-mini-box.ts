import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/**
 * Provisions the "Build-Your-Own Mini Box": a mix-and-match batch-builder
 * product (4 mini cookies for $10, any combination). The business owner can
 * adjust the price, the box capacity (Tray quantity), and the flavor choices
 * in the admin panel afterwards.
 *
 *   pnpm seed:mini-box            (local Docker database)
 *
 * Idempotent: re-running updates the core fields and leaves owner edits to
 * other fields alone. Hosted databases are owner-managed; only run this
 * against preview/prod when explicitly asked.
 */

const BOX_SLUG = 'build-your-own-mini-box'
const BOX_TITLE = 'Build-Your-Own Mini Box'
const BOX_PRICE_CENTS = 1000
const BOX_CAPACITY = 4

// The flavors a customer can drop into the box. These mirror the
// individually-orderable menu flavors; the owner can widen/narrow this in
// the admin panel.
const BOX_FLAVOR_SLUGS = [
  'red-velvet-cheesecake',
  'smores',
  'brookie',
  'biscoff',
  'strawberry-cheesecake',
  'toasted-and-tasseled',
  'sticky-mango-rice-krispy-treats',
  'freshly-baked-dirty-chai-cookie',
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

const pitch = {
  root: {
    children: [
      paragraph(
        'Build a box of four mini cookies and mix the flavors however you like — all minis, your call.',
      ),
      paragraph(
        'Add the box to your cart, then build another. Each box is its own order line, so the kitchen sees exactly which minis to bake.',
      ),
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
}

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

    const flavorResult = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 0,
      overrideAccess: true,
      pagination: false,
      select: { id: true, slug: true },
      where: { slug: { in: BOX_FLAVOR_SLUGS } },
    })
    const flavorIDs = flavorResult.docs
      .slice()
      .sort((a, b) => BOX_FLAVOR_SLUGS.indexOf(a.slug ?? '') - BOX_FLAVOR_SLUGS.indexOf(b.slug ?? ''))
      .map((flavor) => flavor.id)

    if (flavorIDs.length === 0) {
      console.error('No box flavors resolved — seed the cookie catalog first.')
      return
    }

    const coreData = {
      _status: 'published' as const,
      categories: [cateringCategoryID],
      flavorSelection: 'mixAndMatch' as const,
      menuBehavior: 'batchBuilder' as const,
      menuExpandedPitch: pitch,
      menuPortionLabel: `${BOX_CAPACITY} mini cookies`,
      priceInUSD: BOX_PRICE_CENTS,
      priceInUSDEnabled: true,
      requiredSelectionCount: BOX_CAPACITY,
      selectableProducts: flavorIDs,
    }

    const existing = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: BOX_SLUG } },
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
        `- Updated ${BOX_SLUG} (#${existing.docs[0].id}): ${flavorIDs.length} flavors, ${BOX_CAPACITY} for ${BOX_PRICE_CENTS} cents`,
      )
    } else {
      const created = await payload.create({
        collection: 'products',
        data: { ...coreData, slug: BOX_SLUG, title: BOX_TITLE },
        overrideAccess: true,
      })
      console.log(
        `- Created ${BOX_SLUG} (#${created.id}): ${flavorIDs.length} flavors, ${BOX_CAPACITY} for ${BOX_PRICE_CENTS} cents`,
      )
    }
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => {
    console.log('Mini box seeded.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
