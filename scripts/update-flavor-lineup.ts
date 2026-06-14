import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import { defaultMiniPriceInUSD } from '../src/features/products/sizeVariants'
import { ensureSizeAxis } from '../src/features/products/sizeVariantProvisioning'

/**
 * Syncs the owner's flavor lineup: which cookie flavors are always available
 * for individual ordering, which are in the seasonal rotation, and their
 * Large/Mini prices.
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
 * Idempotent and re-run safe: mini prices are only written when the field
 * is still empty or the spec pins one, so owner edits survive re-runs.
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

const ALWAYS_AVAILABLE_FLAVORS: FlavorSpec[] = [
  { slug: 'red-velvet-cheesecake', title: 'Red Velvet Cheesecake' },
  { slug: 'smores', title: "S'mores" },
  { slug: 'brookie', title: 'Brookie' },
  { slug: 'biscoff', title: 'Biscoff' },
  { slug: 'strawberry-cheesecake', title: 'Strawberry Cheesecake' },
]

const SEASONAL_ROTATION_FLAVORS: FlavorSpec[] = [
  { slug: 'toasted-and-tasseled', title: 'Toasted and Tasseled' },
  { slug: 'sticky-mango-rice-krispy-treats', title: 'Sticky Mango Rice Krispy Treats' },
  { slug: 'freshly-baked-dirty-chai-cookie', title: 'Dirty Chai Cookie' },
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
      individualAvailability: 'always' | 'rotation',
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

      const needsUpdate =
        product.individualAvailability !== individualAvailability ||
        product.priceInUSD !== largePrice ||
        product.miniPriceInUSD !== miniPrice

      if (!needsUpdate) {
        payload.logger.info(`- Skipped ${spec.slug}: already up to date`)
        return product
      }

      // A plain product update; the products afterChange hook provisions
      // and prices the size variants, exactly like an admin-panel save.
      await payload.update({
        id: product.id,
        collection: 'products',
        data: {
          individualAvailability,
          miniPriceInUSD: miniPrice,
          priceInUSD: largePrice,
        },
        depth: 0,
        overrideAccess: true,
      })

      payload.logger.info(
        `- Updated ${spec.slug}: ${individualAvailability}, large ${largePrice}, mini ${miniPrice}`,
      )

      return product
    }

    // Per-flavor try/catch: a single product that can't be provisioned (e.g. an
    // environment missing its catalog/variant groundwork) is logged and skipped
    // instead of aborting the whole sync.
    const ensureFlavorSafely = async (
      spec: FlavorSpec,
      individualAvailability: 'always' | 'rotation',
    ) => {
      try {
        return await ensureFlavor(spec, individualAvailability)
      } catch (error) {
        payload.logger.error(
          `- Failed ${spec.slug}: ${error instanceof Error ? error.message : String(error)} (skipping, continuing)`,
        )
        return null
      }
    }

    const alwaysProducts = []

    for (const spec of ALWAYS_AVAILABLE_FLAVORS) {
      const product = await ensureFlavorSafely(spec, 'always')

      if (product) {
        alwaysProducts.push(product)
      }
    }

    const seasonalProducts = []

    for (const spec of SEASONAL_ROTATION_FLAVORS) {
      const product = await ensureFlavorSafely(spec, 'rotation')

      if (product) {
        seasonalProducts.push(product)
      }
    }

    // ---------------------------------------------------------------
    // Point the active rotation's public cookies at the seasonal list,
    // in the exact order configured above.
    // ---------------------------------------------------------------
    if (seasonalProducts.length === 0) {
      payload.logger.warn('- No seasonal products resolved; leaving the rotation untouched')
    } else {
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
      const seasonalIDs = seasonalProducts.map((product) => product.id)

      if (!activeRotation) {
        const created = await payload.create({
          collection: 'flavor-rotations',
          data: {
            individualFlavors: seasonalIDs,
            rotationType: 'seasonal',
            showcaseProducts: [
              ...seasonalIDs,
              ...alwaysProducts.map((product) => product.id),
            ],
            status: 'active',
            title: 'Seasonal rotation (set by update:flavor-lineup)',
          },
          overrideAccess: true,
        })
        payload.logger.info(`- Created active rotation #${created.id} with the seasonal lineup`)
      } else {
        const currentShowcaseIDs = (
          Array.isArray(activeRotation.showcaseProducts) ? activeRotation.showcaseProducts : []
        ).map((entry) => (typeof entry === 'object' && entry ? entry.id : entry))
        const currentIndividualIDs = (
          Array.isArray(activeRotation.individualFlavors) ? activeRotation.individualFlavors : []
        ).map((entry) => (typeof entry === 'object' && entry ? entry.id : entry))
        const showcaseWithSeasonal = Array.from(
          new Set([...currentShowcaseIDs, ...seasonalIDs]),
        )
        const individualMatches =
          currentIndividualIDs.length === seasonalIDs.length &&
          seasonalIDs.every((id, index) => currentIndividualIDs[index] === id)

        if (individualMatches && showcaseWithSeasonal.length === currentShowcaseIDs.length) {
          payload.logger.info(
            `- Skipped rotation #${activeRotation.id}: public cookies already match the seasonal lineup`,
          )
        } else {
          await payload.update({
            id: activeRotation.id,
            collection: 'flavor-rotations',
            data: {
              individualFlavors: seasonalIDs,
              showcaseProducts: showcaseWithSeasonal,
            },
            depth: 0,
            overrideAccess: true,
          })
          payload.logger.info(
            `- Updated rotation #${activeRotation.id}: public cookies -> [${seasonalProducts
              .map((product) => product.title)
              .join(', ')}]`,
          )
        }
      }
    }
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => {
    console.log('Flavor lineup synced (availability, prices, seasonal rotation).')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
