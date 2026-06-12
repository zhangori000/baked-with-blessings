import configPromise from '@payload-config'
import {
  getPayload,
  type CollectionSlug,
  type DefaultDocumentIDType,
  type Payload,
  type Where,
} from 'payload'
import {
  buildCookiePosterAssets,
  cookiePosterMetas,
  getCookieAllergens,
  type CookiePosterAsset,
} from '@/features/products/cookieDisplayData'
import {
  pickDefaultSizeVariant,
  summarizeSizeVariants,
} from '@/features/products/sizeVariants'
import type { Variant } from '@/payload-types'
import { measureServerStep } from '@/utilities/devTiming'
import { menuHref } from '@/utilities/routes'

type ProductRelationship = DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null | undefined

type ActiveFlavorRotation = {
  displayLabel?: null | string
  individualFlavors?: ProductRelationship[] | null
  lockedDescription?: null | string
  lockedLabel?: null | string
  menuLinkLabel?: null | string
  monthlyFlavorLabel?: null | string
  showcaseProducts?: ProductRelationship[] | null
  title?: null | string
}

const productSelect = {
  gallery: true,
  id: true,
  individualAvailability: true,
  meta: true,
  poster: true,
  priceInUSD: true,
  slug: true,
  title: true,
} as const

const getRelationshipID = (value: ProductRelationship) => {
  if (!value) {
    return undefined
  }

  return typeof value === 'object' ? value.id : value
}

const getRelationshipIDs = (values?: ProductRelationship[] | null) =>
  (values ?? [])
    .map((value) => getRelationshipID(value))
    .filter((id): id is DefaultDocumentIDType => id != null)

export const getPublicRotationProductIDs = (
  activeRotation: Pick<ActiveFlavorRotation, 'individualFlavors'> | null,
) => getRelationshipIDs(activeRotation?.individualFlavors)

const queryActiveFlavorRotation = async (payload: Payload) => {
  const rotationResult = await measureServerStep(
    'payload.find flavor-rotations: rotating cookie posters',
    () =>
      payload.find({
        collection: 'flavor-rotations' as CollectionSlug,
        depth: 0,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        select: {
          displayLabel: true,
          individualFlavors: true,
          lockedDescription: true,
          lockedLabel: true,
          menuLinkLabel: true,
          monthlyFlavorLabel: true,
          showcaseProducts: true,
          title: true,
        },
        sort: '-updatedAt',
        where: {
          status: {
            equals: 'active',
          },
        },
      }),
  )

  return (rotationResult.docs[0] as ActiveFlavorRotation | undefined) ?? null
}

export const applyRotationAvailability = ({
  activeRotation,
  posters,
}: {
  activeRotation: ActiveFlavorRotation | null
  posters: CookiePosterAsset[]
}) => {
  if (!activeRotation) {
    return posters
  }

  const monthlyFlavorIDs = new Set(
    getRelationshipIDs(activeRotation.individualFlavors).map((flavorID) => String(flavorID)),
  )
  const monthlyFlavorOrder = new Map(
    getRelationshipIDs(activeRotation.individualFlavors).map(
      (flavorID, index) => [String(flavorID), index] as const,
    ),
  )

  return posters
    .map((poster) => {
      const productID = typeof poster.productId === 'number' ? String(poster.productId) : null
      const isMonthlyFlavor = Boolean(productID && monthlyFlavorIDs.has(productID))
      // Standing-menu flavors stay individually orderable even when the
      // active rotation does not feature them.
      const isAlwaysAvailable = poster.individualAvailability === 'always'
      const canBuyIndividually = isMonthlyFlavor || isAlwaysAvailable

      return {
        ...poster,
        amount: canBuyIndividually ? poster.amount : 'Catering only',
        canBuyCatering: true,
        canBuyIndividually,
        isMonthlyFlavor,
        lockedDescription:
          activeRotation.lockedDescription?.trim() ||
          'Outside the monthly rotation, this flavor is available through larger catering batches only. Making a separate dough batch for one small order creates too much waste, and the bakery is not set up with the equipment or production space to do that efficiently yet.',
        lockedLabel: activeRotation.lockedLabel?.trim() || 'Catering only this month',
        menuHref,
        menuLinkLabel: activeRotation.menuLinkLabel?.trim() || 'View menu',
        monthlyFlavorLabel:
          !isMonthlyFlavor && isAlwaysAvailable
            ? 'Always available'
            : activeRotation.monthlyFlavorLabel?.trim() ||
              activeRotation.displayLabel?.trim() ||
              "This month's flavor",
      }
    })
    .sort((left, right) => {
      const leftOrder =
        typeof left.productId === 'number'
          ? monthlyFlavorOrder.get(String(left.productId))
          : undefined
      const rightOrder =
        typeof right.productId === 'number'
          ? monthlyFlavorOrder.get(String(right.productId))
          : undefined

      if (leftOrder != null && rightOrder != null) {
        return leftOrder - rightOrder
      }

      if (leftOrder != null) {
        return -1
      }

      if (rightOrder != null) {
        return 1
      }

      return 0
    })
}

/**
 * Published size variants for a set of products, keyed by product ID.
 * Shared by the rotation surfaces (default size for one-tap add to cart)
 * and reusable by any surface that needs a size picker.
 */
export const queryPublishedSizeVariantsByProduct = async ({
  payload,
  productIDs,
}: {
  payload: Payload
  productIDs: DefaultDocumentIDType[]
}) => {
  const variantsByProduct = new Map<string, Variant[]>()

  if (productIDs.length === 0) {
    return variantsByProduct
  }

  const variantsResult = await measureServerStep('payload.find variants: size variants', () =>
    payload.find({
      collection: 'variants' as CollectionSlug,
      depth: 1,
      limit: 0,
      overrideAccess: false,
      pagination: false,
      where: {
        and: [
          {
            product: {
              in: productIDs,
            },
          },
          {
            _status: {
              equals: 'published',
            },
          },
        ],
      },
    }),
  )

  for (const variant of variantsResult.docs as Variant[]) {
    const productID = getRelationshipID(variant.product as ProductRelationship)

    if (productID == null) {
      continue
    }

    const key = String(productID)
    const existing = variantsByProduct.get(key)

    if (existing) {
      existing.push(variant)
    } else {
      variantsByProduct.set(key, [variant])
    }
  }

  return variantsByProduct
}

/**
 * Gives each buyable poster the variant that one-tap surfaces should add
 * to the cart, so carousel orders carry an explicit size instead of an
 * ambiguous bare product line.
 */
const attachDefaultSizeVariants = async ({
  payload,
  posters,
}: {
  payload: Payload
  posters: CookiePosterAsset[]
}) => {
  const productIDs = posters
    .map((poster) => poster.productId)
    .filter((productID): productID is number => typeof productID === 'number')

  if (productIDs.length === 0) {
    return posters
  }

  const variantsByProduct = await queryPublishedSizeVariantsByProduct({ payload, productIDs })

  if (variantsByProduct.size === 0) {
    return posters
  }

  return posters.map((poster) => {
    const variants =
      typeof poster.productId === 'number'
        ? variantsByProduct.get(String(poster.productId))
        : undefined
    const defaultSize = pickDefaultSizeVariant(summarizeSizeVariants(variants ?? []))

    if (!defaultSize) {
      return poster
    }

    return {
      ...poster,
      addToCartSizeLabel: defaultSize.label,
      addToCartVariantId: defaultSize.id,
    }
  })
}

export const buildFallbackHomeCookiePosters = (): CookiePosterAsset[] =>
  cookiePosterMetas.map((meta) => ({
    ...meta,
    allergens: getCookieAllergens(meta.slug),
    amount: 'Fresh weekly',
    href: `/cookies/${meta.slug}`,
    image: null,
    infoButtonLabel: 'Info',
  }))

const queryCookieCategoryID = async (payload: Payload) => {
  const categoryResult = await measureServerStep(
    'payload.find categories: rotating cookie fallback category',
    () =>
      payload.find({
        collection: 'categories',
        depth: 0,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        where: {
          slug: {
            equals: 'cookies',
          },
        },
      }),
  )

  return categoryResult.docs[0]?.id
}

const queryCateringCategoryID = async (payload: Payload) => {
  const categoryResult = await measureServerStep(
    'payload.find categories: rotating cookie catering exclusion',
    () =>
      payload.find({
        collection: 'categories',
        depth: 0,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        where: {
          slug: {
            equals: 'catering',
          },
        },
      }),
  )

  return categoryResult.docs[0]?.id
}

const queryProductsByIDs = async ({
  payload,
  productIDs,
}: {
  payload: Payload
  productIDs: DefaultDocumentIDType[]
}) => {
  const productOrder = new Map(productIDs.map((productID, index) => [String(productID), index]))
  const cateringCategoryID = await queryCateringCategoryID(payload)
  const and: Where[] = [
    {
      id: {
        in: productIDs,
      },
    },
    {
      _status: {
        equals: 'published',
      },
    },
    {
      menuBehavior: {
        not_equals: 'batchBuilder',
      },
    },
  ]

  if (cateringCategoryID) {
    and.push({
      categories: {
        not_in: [cateringCategoryID],
      },
    })
  }

  const result = await measureServerStep('payload.find products: rotation showcase products', () =>
    payload.find({
      collection: 'products',
      draft: false,
      limit: productIDs.length,
      overrideAccess: false,
      pagination: false,
      select: productSelect,
      where: {
        and,
      },
    }),
  )

  return result.docs.sort((left, right) => {
    const leftOrder = productOrder.get(String(left.id)) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = productOrder.get(String(right.id)) ?? Number.MAX_SAFE_INTEGER

    return leftOrder - rightOrder
  })
}

const queryCookieCategoryProducts = async (payload: Payload) => {
  const cookieCategoryID = await queryCookieCategoryID(payload)

  if (!cookieCategoryID) {
    return []
  }

  const result = await measureServerStep('payload.find products: rotating cookie category', () =>
    payload.find({
      collection: 'products',
      draft: false,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      select: productSelect,
      sort: 'title',
      where: {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            categories: {
              contains: cookieCategoryID,
            },
          },
        ],
      },
    }),
  )

  return result.docs
}

const queryRotationShowcaseProducts = async ({
  activeRotation,
  payload,
}: {
  activeRotation: ActiveFlavorRotation | null
  payload: Payload
}) => {
  const showcaseProductIDs = getRelationshipIDs(activeRotation?.showcaseProducts)

  if (showcaseProductIDs.length > 0) {
    return queryProductsByIDs({
      payload,
      productIDs: showcaseProductIDs,
    })
  }

  return queryCookieCategoryProducts(payload)
}

const queryPublicRotationProducts = async ({
  activeRotation,
  payload,
}: {
  activeRotation: ActiveFlavorRotation | null
  payload: Payload
}) => {
  const publicRotationProductIDs = getPublicRotationProductIDs(activeRotation)

  if (publicRotationProductIDs.length > 0) {
    return queryProductsByIDs({
      payload,
      productIDs: publicRotationProductIDs,
    })
  }

  return []
}

export const queryHomeCookiePosters = async () => {
  const payload = await measureServerStep('payload init: rotating cookie posters', () =>
    getPayload({ config: configPromise }),
  )
  const activeRotation = await queryActiveFlavorRotation(payload)
  const products = await queryRotationShowcaseProducts({
    activeRotation,
    payload,
  })

  const posters = buildCookiePosterAssets(products)
  const postersWithAvailability = applyRotationAvailability({
    activeRotation,
    posters,
  })

  if (postersWithAvailability.length === 0) {
    return buildFallbackHomeCookiePosters()
  }

  return attachDefaultSizeVariants({ payload, posters: postersWithAvailability })
}

export const queryPublicRotationCookiePosters = async () => {
  const payload = await measureServerStep('payload init: public rotation cookie posters', () =>
    getPayload({ config: configPromise }),
  )
  const activeRotation = await queryActiveFlavorRotation(payload)

  if (!activeRotation) {
    return buildFallbackHomeCookiePosters()
  }

  const products = await queryPublicRotationProducts({
    activeRotation,
    payload,
  })

  const posters = buildCookiePosterAssets(products)
  const postersWithAvailability = applyRotationAvailability({
    activeRotation,
    posters,
  })

  return attachDefaultSizeVariants({ payload, posters: postersWithAvailability })
}
