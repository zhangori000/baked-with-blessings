import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import {
  BUNDLES_CATEGORY_SLUG,
  CATERING_PACKAGES_CATEGORY_SLUG,
} from '../src/features/products/cateringPackages'

type PackageSpec = {
  capacity: number
  galleryFromSlug: string
  portionLabel: string
  priceCents: number
  size: string
  slug: string
  summary: string
  title: string
  unit: 'large' | 'mini'
}

const PACKAGE_CATEGORY = { slug: CATERING_PACKAGES_CATEGORY_SLUG, title: 'Catering' }
const BUNDLES_CATEGORY = { slug: BUNDLES_CATEGORY_SLUG, title: 'Bundles' }

const buildSpec = (
  unit: 'large' | 'mini',
  size: 'Small' | 'Large' | 'XL',
  capacity: number,
  priceCents: number,
): PackageSpec => {
  const group = unit === 'large' ? 'Large Cookie Catering' : 'Mini Cookie Catering'
  const noun = unit === 'large' ? 'large cookies' : 'mini cookies'

  return {
    capacity,
    galleryFromSlug: unit === 'large' ? 'cookie-tray' : 'mini-cookie-tray',
    portionLabel: `${capacity} ${noun}`,
    priceCents,
    size,
    slug: `${unit}-cookie-catering-${size.toLowerCase()}`,
    summary: `${capacity} ${noun} in any mix of flavors — this week’s lineup or past favorites from the Hall of Fame.`,
    title: `${group} — ${size}`,
    unit,
  }
}

const PACKAGE_SPECS: PackageSpec[] = [
  buildSpec('large', 'Small', 18, 7500),
  buildSpec('large', 'Large', 36, 15000),
  buildSpec('large', 'XL', 60, 24000),
  buildSpec('mini', 'Small', 30, 4500),
  buildSpec('mini', 'Large', 60, 8500),
  buildSpec('mini', 'XL', 100, 14000),
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

const pitchFor = (spec: PackageSpec) => [
  `Fill all ${spec.capacity} with any flavors you like — including past favorites that are off the weekly menu. Catering is the only way to order a flavor that is not in this week’s rotation.`,
  'Pick your flavors below, add the package to your cart, and we will bake the whole order fresh for your event.',
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
    const findCategory = async (slug: string) =>
      (
        await payload.find({
          collection: 'categories',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where: { slug: { equals: slug } },
        })
      ).docs[0]

    const bundlesCategory = await findCategory(BUNDLES_CATEGORY.slug)

    if (bundlesCategory && bundlesCategory.title !== BUNDLES_CATEGORY.title) {
      await payload.update({
        id: bundlesCategory.id,
        collection: 'categories',
        data: { title: BUNDLES_CATEGORY.title },
        overrideAccess: true,
      })
      console.log(`- Retitled category ${BUNDLES_CATEGORY.slug} -> "${BUNDLES_CATEGORY.title}"`)
    }

    let packageCategory = await findCategory(PACKAGE_CATEGORY.slug)

    if (!packageCategory) {
      packageCategory = await payload.create({
        collection: 'categories',
        data: { slug: PACKAGE_CATEGORY.slug, title: PACKAGE_CATEGORY.title },
        overrideAccess: true,
      })
      console.log(`- Created category ${PACKAGE_CATEGORY.slug} (#${packageCategory.id})`)
    }

    const cookieCategory = await findCategory('cookies')

    if (!cookieCategory) {
      console.error('No cookies category found — seed the cookie catalog first.')
      return
    }

    const flavorResult = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 0,
      overrideAccess: true,
      pagination: false,
      select: { slug: true },
      sort: 'title',
      where: {
        and: [
          { categories: { contains: cookieCategory.id } },
          { menuBehavior: { not_equals: 'batchBuilder' } },
          { _status: { equals: 'published' } },
        ],
      },
    })
    const flavorIDs = flavorResult.docs.map((flavor) => flavor.id)

    if (flavorIDs.length === 0) {
      console.error('No cookie flavors resolved — seed the cookie catalog first.')
      return
    }

    const galleryCache = new Map<string, { image: number }[]>()
    const galleryFrom = async (slug: string) => {
      if (!galleryCache.has(slug)) {
        const source = await payload.find({
          collection: 'products',
          depth: 0,
          draft: true,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where: { slug: { equals: slug } },
        })
        const gallery = (source.docs[0]?.gallery ?? [])
          .map((entry) => (typeof entry.image === 'object' ? entry.image?.id : entry.image))
          .filter((id): id is number => typeof id === 'number')
          .map((image) => ({ image }))
        galleryCache.set(slug, gallery)
      }

      return galleryCache.get(slug) ?? []
    }

    for (const spec of PACKAGE_SPECS) {
      const coreData = {
        _status: 'published' as const,
        categories: [packageCategory.id],
        flavorSelection: 'mixAndMatch' as const,
        menuBehavior: 'batchBuilder' as const,
        menuExpandedPitch: buildPitch(pitchFor(spec)),
        menuPortionLabel: spec.portionLabel,
        meta: { description: spec.summary },
        priceInUSD: spec.priceCents,
        priceInUSDEnabled: true,
        requiredSelectionCount: spec.capacity,
        selectableProducts: flavorIDs,
        title: spec.title,
      }

      const existing = await payload.find({
        collection: 'products',
        depth: 0,
        draft: true,
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
          `- Updated ${spec.slug} (#${existing.docs[0].id}): ${spec.capacity} for ${spec.priceCents} cents, ${flavorIDs.length} flavors`,
        )
        continue
      }

      const gallery = await galleryFrom(spec.galleryFromSlug)
      const created = await payload.create({
        collection: 'products',
        data: { ...coreData, gallery, slug: spec.slug },
        overrideAccess: true,
      })
      console.log(
        `- Created ${spec.slug} (#${created.id}): ${spec.capacity} for ${spec.priceCents} cents, ${flavorIDs.length} flavors, ${gallery.length} photos`,
      )
    }
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => {
    console.log('Catering packages seeded.')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
