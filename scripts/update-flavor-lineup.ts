import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import { WEEKLY_ROTATION_LABELS } from '../src/endpoints/seed/flavor-rotations'
import { defaultMiniPriceInUSD } from '../src/features/products/sizeVariants'
import { ensureSizeAxis } from '../src/features/products/sizeVariantProvisioning'

/**
 * Syncs the owner's flavor lineup: which flavors are in the current rotation
 * (the only ones orderable individually), and the Large/Mini cookie prices.
 * Every other cookie flavor is moved to the backlog, where it stays orderable
 * through Catering and shows in the Flavor Hall of Fame.
 *
 * The script only writes the simple product fields (the same ones the owner
 * edits in the admin panel). The products afterChange hook then provisions
 * and prices the underlying size variants automatically — the exact same
 * path an admin-panel save takes.
 *
 * The lineup is data, not code — edit the lists/prices below and re-run:
 *
 *   pnpm update:flavor-lineup            (local Docker database)
 *
 * Hosted databases are owner-managed via the admin panel. Per repo policy,
 * only point this at preview/prod when explicitly asked, via
 * `vercel env run -e preview -- pnpm update:flavor-lineup`.
 *
 * Idempotent and re-run safe.
 */

type FlavorSpec = {
  /** Cents. Omit to keep the product's current price as the Large price. */
  largePriceInUSD?: number
  /** Cents. Omit to fill empty fields with the 60% default. */
  miniPriceInUSD?: number
  /** Matched by slug first, then by exact case-insensitive title. */
  slug: string
  title: string
}

const COOKIE_LARGE_PRICE_IN_USD = 500

const ROTATION_FLAVORS: FlavorSpec[] = [
  {
    largePriceInUSD: COOKIE_LARGE_PRICE_IN_USD,
    slug: 'red-velvet-cheesecake',
    title: 'Red Velvet Cheesecake',
  },
  { largePriceInUSD: COOKIE_LARGE_PRICE_IN_USD, slug: 'smores', title: "S'mores" },
  { largePriceInUSD: COOKIE_LARGE_PRICE_IN_USD, slug: 'biscoff', title: 'Biscoff' },
  {
    largePriceInUSD: 700,
    slug: 'roasted-pesto-focaccia',
    title: 'Roasted Pesto Focaccia',
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
    // Make sure the size axis (variant type + Large/Mini options) exists and is
    // COMMITTED before any product save. On a fresh environment the product's
    // afterChange would otherwise create it inside its own transaction, which
    // the ecommerce variant hook can't see (it looks options up without that
    // transaction) -> NotFound. Pre-committing here unblocks first-run sizing.
    await ensureSizeAxis({ payload })
    payload.logger.info('- Ensured size variant axis (large / mini)')

    // Ensure an active rotation exists before any 'currentRotation' placement
    // below (the product beforeChange hook throws if none is active). Its exact
    // flavor list is set at the end; no-op when a rotation already exists.
    const activeRotationCheck = await payload.find({
      collection: 'flavor-rotations',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      sort: '-updatedAt',
      where: { status: { equals: 'active' } },
    })
    if (!activeRotationCheck.docs[0]) {
      await payload.create({
        collection: 'flavor-rotations',
        data: {
          ...WEEKLY_ROTATION_LABELS,
          individualFlavors: [],
          rotationType: 'seasonal',
          showcaseProducts: [],
          status: 'active',
          title: 'Weekly specials (set by update:flavor-lineup)',
        },
        overrideAccess: true,
      })
      payload.logger.info('- Created an empty active rotation (populated below)')
    }

    const resolveProduct = async (spec: FlavorSpec) => {
      const bySlug = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { slug: { equals: spec.slug } },
      })

      if (bySlug.docs[0]) {
        return bySlug.docs[0]
      }

      const byTitle = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { title: { like: spec.title } },
      })

      return byTitle.docs[0]
    }

    const ensureFlavor = async (
      spec: FlavorSpec,
      placement: 'backlog' | 'currentRotation',
    ) => {
      const product = await resolveProduct(spec)

      if (!product) {
        payload.logger.warn(`- Skipped ${spec.slug}: product not found in this environment`)
        return null
      }

      const largePrice =
        spec.largePriceInUSD ??
        (typeof product.priceInUSD === 'number' && product.priceInUSD > 0
          ? product.priceInUSD
          : null)

      if (largePrice == null) {
        payload.logger.warn(`- Skipped ${spec.slug}: no price on product and none pinned`)
        return null
      }

      // Pin wins; otherwise only fill an empty field so owner edits survive.
      const miniPrice =
        spec.miniPriceInUSD ??
        (typeof product.miniPriceInUSD === 'number' && product.miniPriceInUSD > 0
          ? product.miniPriceInUSD
          : defaultMiniPriceInUSD(largePrice))

      // Write through menuPlacement — the owner-facing field the product hooks
      // key off — NOT individualAvailability directly. The beforeChange hook
      // re-derives individualAvailability from menuPlacement, so setting the
      // stored field directly silently reverts to 'rotation'. Running the
      // update every time (no skip) also guarantees the afterChange provisions
      // the Large/Mini variants, even when price/availability already match.
      await payload.update({
        id: product.id,
        collection: 'products',
        data: {
          menuPlacement: placement,
          miniPriceInUSD: miniPrice,
          priceInUSD: largePrice,
        },
        depth: 0,
        overrideAccess: true,
      })

      payload.logger.info(
        `- Synced ${spec.slug}: ${placement}, large ${largePrice}, mini ${miniPrice}`,
      )

      return product
    }

    // Per-flavor try/catch: a single product that can't be provisioned (e.g. an
    // environment missing its catalog/variant groundwork) is logged and skipped
    // instead of aborting the whole sync.
    const ensureFlavorSafely = async (
      spec: FlavorSpec,
      placement: 'backlog' | 'currentRotation',
    ) => {
      try {
        return await ensureFlavor(spec, placement)
      } catch (error) {
        payload.logger.error(
          `- Failed ${spec.slug}: ${error instanceof Error ? error.message : String(error)} (skipping, continuing)`,
        )
        return null
      }
    }

    const rotationProducts = []

    for (const spec of ROTATION_FLAVORS) {
      const product = await ensureFlavorSafely(spec, 'currentRotation')

      if (product) {
        rotationProducts.push(product)
      }
    }

    if (rotationProducts.length === 0) {
      payload.logger.warn('- No rotation products resolved; leaving the rotation untouched')
      return
    }

    const activeRotationResult = await payload.find({
      collection: 'flavor-rotations',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      sort: '-updatedAt',
      where: { status: { equals: 'active' } },
    })

    const activeRotation = activeRotationResult.docs[0]
    const rotationIDs = rotationProducts.map((product) => product.id)

    if (activeRotation) {
      const currentShowcaseIDs = (
        Array.isArray(activeRotation.showcaseProducts) ? activeRotation.showcaseProducts : []
      ).map((entry) => (typeof entry === 'object' && entry ? entry.id : entry))

      await payload.update({
        id: activeRotation.id,
        collection: 'flavor-rotations',
        data: {
          ...WEEKLY_ROTATION_LABELS,
          individualFlavors: rotationIDs,
          showcaseProducts: Array.from(new Set([...currentShowcaseIDs, ...rotationIDs])),
        },
        depth: 0,
        overrideAccess: true,
      })
      payload.logger.info(
        `- Updated rotation #${activeRotation.id}: public cookies -> [${rotationProducts
          .map((product) => product.title)
          .join(', ')}]`,
      )
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

    if (cookieCategoryID == null) {
      payload.logger.warn('- No cookies category; skipped backlog + price sync')
      return
    }

    const rotationIDSet = new Set(rotationIDs.map(String))
    const cookieFlavors = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 0,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { categories: { contains: cookieCategoryID } },
          { menuBehavior: { not_equals: 'batchBuilder' } },
        ],
      },
    })

    for (const product of cookieFlavors.docs) {
      if (rotationIDSet.has(String(product.id))) {
        continue
      }

      await ensureFlavorSafely(
        {
          largePriceInUSD: COOKIE_LARGE_PRICE_IN_USD,
          slug: product.slug ?? String(product.id),
          title: product.title,
        },
        'backlog',
      )
    }
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => {
    console.log('Flavor lineup synced (rotation, backlog, prices).')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
