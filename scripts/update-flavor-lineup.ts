import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import { SIZE_OPTIONS, SIZE_VARIANT_TYPE } from '../src/features/products/sizeVariants'

/**
 * Syncs the owner's flavor lineup: which cookie flavors are always available
 * for individual ordering, which are in the seasonal rotation, and the
 * Large/Mini size variants (with prices) that the regular-order menu sells.
 *
 * The lineup is data, not code — edit the lists/prices below and re-run:
 *
 *   pnpm update:flavor-lineup            (local Docker database)
 *
 * Hosted databases are owner-managed via the admin panel. Per repo policy,
 * only point this at preview/prod when explicitly asked, via
 * `vercel env run -e preview -- pnpm update:flavor-lineup`.
 *
 * Idempotent and re-run safe:
 * - missing size variants are created with default prices
 * - existing variant prices are NOT overwritten unless the spec pins a price,
 *   so the owner's admin-panel price edits survive re-runs
 */

type FlavorSpec = {
  /** Cents. Omit to keep the product's current price as the Large price. */
  largePriceInUSD?: number
  /** Cents. Omit to derive from the Large price via MINI_PRICE_RATIO. */
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

/**
 * Default Mini price as a share of Large, rounded to the nearest quarter.
 * 0.6 mirrors the owner's own tray pricing (mini tray $3/cookie vs jumbo
 * $5/cookie). Pin miniPriceInUSD on a flavor above to override.
 */
const MINI_PRICE_RATIO = 0.6

const roundToQuarter = (cents: number) => Math.round(cents / 25) * 25

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
    // ---------------------------------------------------------------
    // 1. Ensure the Size variant axis and its options exist.
    // ---------------------------------------------------------------
    const existingSizeType = await payload.find({
      collection: 'variantTypes',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { name: { equals: SIZE_VARIANT_TYPE.name } },
    })

    const sizeType =
      existingSizeType.docs[0] ??
      (await payload.create({
        collection: 'variantTypes',
        data: { label: SIZE_VARIANT_TYPE.label, name: SIZE_VARIANT_TYPE.name },
        overrideAccess: true,
      }))

    payload.logger.info(
      `- Size variant type #${sizeType.id} ${existingSizeType.docs[0] ? 'found' : 'created'}`,
    )

    const sizeOptionIDByValue = new Map<string, number>()

    for (const option of SIZE_OPTIONS) {
      const existingOption = await payload.find({
        collection: 'variantOptions',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            { value: { equals: option.value } },
            { variantType: { equals: sizeType.id } },
          ],
        },
      })

      const optionDoc =
        existingOption.docs[0] ??
        (await payload.create({
          collection: 'variantOptions',
          data: { label: option.label, value: option.value, variantType: sizeType.id },
          overrideAccess: true,
        }))

      sizeOptionIDByValue.set(option.value, optionDoc.id)
      payload.logger.info(
        `- Size option "${option.label}" #${optionDoc.id} ${existingOption.docs[0] ? 'found' : 'created'}`,
      )
    }

    // ---------------------------------------------------------------
    // 2. Resolve the lineup's products by slug, then by title.
    // ---------------------------------------------------------------
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

      const miniPrice = spec.miniPriceInUSD ?? roundToQuarter(largePrice * MINI_PRICE_RATIO)

      // Product flags first: variants validate their options against the
      // product's variantTypes, so the type must be linked before variants
      // are created.
      const currentVariantTypeIDs = (
        Array.isArray(product.variantTypes) ? product.variantTypes : []
      ).map((entry) => (typeof entry === 'object' && entry ? entry.id : entry))
      const productNeedsUpdate =
        product.enableVariants !== true ||
        product.individualAvailability !== individualAvailability ||
        !currentVariantTypeIDs.includes(sizeType.id)

      if (productNeedsUpdate) {
        await payload.update({
          id: product.id,
          collection: 'products',
          data: {
            enableVariants: true,
            individualAvailability,
            variantTypes: Array.from(new Set([...currentVariantTypeIDs, sizeType.id])),
          },
          depth: 0,
          overrideAccess: true,
        })
        payload.logger.info(
          `- Updated ${spec.slug}: individualAvailability=${individualAvailability}, size variants enabled`,
        )
      } else {
        payload.logger.info(`- Skipped ${spec.slug}: product flags already set`)
      }

      const existingVariants = await payload.find({
        collection: 'variants',
        depth: 0,
        limit: 0,
        overrideAccess: true,
        pagination: false,
        where: { product: { equals: product.id } },
      })

      const priceBySizeValue: Record<string, number> = {
        large: largePrice,
        mini: miniPrice,
      }

      for (const option of SIZE_OPTIONS) {
        const optionID = sizeOptionIDByValue.get(option.value)

        if (optionID == null) {
          continue
        }

        const matching = existingVariants.docs.find((variant) =>
          (Array.isArray(variant.options) ? variant.options : []).some(
            (variantOption) =>
              (typeof variantOption === 'object' && variantOption
                ? variantOption.id
                : variantOption) === optionID,
          ),
        )
        const targetPrice = priceBySizeValue[option.value]
        const pinnedPrice =
          option.value === 'large' ? spec.largePriceInUSD : spec.miniPriceInUSD

        if (!matching) {
          const created = await payload.create({
            collection: 'variants',
            data: {
              _status: 'published',
              options: [optionID],
              priceInUSD: targetPrice,
              priceInUSDEnabled: true,
              product: product.id,
              title: `${product.title} — ${option.label}`,
            },
            depth: 0,
            overrideAccess: true,
          })
          payload.logger.info(
            `- Created ${spec.slug} ${option.label} variant #${created.id} at ${targetPrice} cents`,
          )
          continue
        }

        if (typeof pinnedPrice === 'number' && matching.priceInUSD !== pinnedPrice) {
          await payload.update({
            id: matching.id,
            collection: 'variants',
            data: { _status: 'published', priceInUSD: pinnedPrice, priceInUSDEnabled: true },
            depth: 0,
            overrideAccess: true,
          })
          payload.logger.info(
            `- Updated ${spec.slug} ${option.label} variant: ${matching.priceInUSD ?? 'unset'} -> ${pinnedPrice} cents`,
          )
          continue
        }

        payload.logger.info(
          `- Skipped ${spec.slug} ${option.label} variant: exists at ${matching.priceInUSD ?? 'unset'} cents (owner-editable)`,
        )
      }

      return product
    }

    const alwaysProducts = []

    for (const spec of ALWAYS_AVAILABLE_FLAVORS) {
      const product = await ensureFlavor(spec, 'always')

      if (product) {
        alwaysProducts.push(product)
      }
    }

    const seasonalProducts = []

    for (const spec of SEASONAL_ROTATION_FLAVORS) {
      const product = await ensureFlavor(spec, 'rotation')

      if (product) {
        seasonalProducts.push(product)
      }
    }

    // ---------------------------------------------------------------
    // 3. Point the active rotation's public cookies at the seasonal list.
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
    console.log('Flavor lineup synced (availability flags, size variants, seasonal rotation).')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
