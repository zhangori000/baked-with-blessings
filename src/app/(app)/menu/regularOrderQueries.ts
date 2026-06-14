import type {
  CollectionSlug,
  DefaultDocumentIDType,
  Payload,
  Where,
} from 'payload'

import { queryPublishedSizeVariantsByProduct } from '@/app/(app)/cookiePosterQueries'
import { buildCookiePosterAsset } from '@/features/products/cookieDisplayData'
import { summarizeSizeVariants } from '@/features/products/sizeVariants'
import { measureServerStep } from '@/utilities/devTiming'

import type { RegularOrderItem } from './_components/catering-menu-types'

type ProductRelationship = DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null | undefined

const getRelationshipIDs = (values?: ProductRelationship[] | null) =>
  (values ?? [])
    .map((value) => (value && typeof value === 'object' ? value.id : value))
    .filter((id): id is DefaultDocumentIDType => id != null)

const regularProductSelect = {
  description: true,
  gallery: true,
  id: true,
  individualAvailability: true,
  meta: true,
  poster: true,
  priceInUSD: true,
  slug: true,
  title: true,
} as const

export type RegularOrderMenuData = {
  items: RegularOrderItem[]
  /** Group heading + badge for the rotation flavors, owner-editable on the rotation doc. */
  seasonalLabel: string
}

/**
 * The flavors customers can order individually on /menu: every
 * always-available flavor plus whatever the active rotation features.
 * Each item carries its published Large/Mini sizes so the storefront can
 * sell exact variants instead of bare products.
 */
export const queryRegularOrderItems = async (payload: Payload): Promise<RegularOrderMenuData> => {
  const rotationResult = await measureServerStep(
    'payload.find flavor-rotations: regular order menu',
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
          monthlyFlavorLabel: true,
        },
        sort: '-updatedAt',
        where: {
          status: {
            equals: 'active',
          },
        },
      }),
  )

  const activeRotation = rotationResult.docs[0] as
    | {
        displayLabel?: null | string
        individualFlavors?: ProductRelationship[] | null
        monthlyFlavorLabel?: null | string
      }
    | undefined
  const rotationFlavorIDs = getRelationshipIDs(activeRotation?.individualFlavors)
  const rotationFlavorOrder = new Map(
    rotationFlavorIDs.map((flavorID, index) => [String(flavorID), index] as const),
  )
  const seasonalLabel =
    activeRotation?.monthlyFlavorLabel?.trim() ||
    activeRotation?.displayLabel?.trim() ||
    "This month's flavor"

  const cookieCategoryResult = await measureServerStep(
    'payload.find categories: regular order menu',
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
  const cookieCategoryID = cookieCategoryResult.docs[0]?.id

  if (cookieCategoryID == null) {
    return { items: [], seasonalLabel }
  }

  const availabilityOr: Where[] = [
    {
      individualAvailability: {
        equals: 'always',
      },
    },
  ]

  if (rotationFlavorIDs.length > 0) {
    availabilityOr.push({
      id: {
        in: rotationFlavorIDs,
      },
    })
  }

  const productsResult = await measureServerStep('payload.find products: regular order menu', () =>
    payload.find({
      collection: 'products',
      draft: false,
      overrideAccess: false,
      pagination: false,
      select: regularProductSelect,
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
          {
            menuBehavior: {
              not_equals: 'batchBuilder',
            },
          },
          {
            or: availabilityOr,
          },
        ],
      },
    }),
  )

  const variantsByProduct = await queryPublishedSizeVariantsByProduct({
    payload,
    productIDs: productsResult.docs.map((product) => product.id),
  })

  const items = productsResult.docs
    .map((product): null | RegularOrderItem => {
      const poster = buildCookiePosterAsset(product)

      if (!poster || typeof product.id !== 'number') {
        return null
      }

      // Rotation membership wins the badge: a standing flavor that is also
      // featured this rotation reads as featured, and stays orderable later.
      const isSeasonal = rotationFlavorOrder.has(String(product.id))

      return {
        allergens: poster.allergens,
        availability: isSeasonal ? 'seasonal' : 'always',
        badgeLabel: isSeasonal ? seasonalLabel : 'Always available',
        bodyFallbackSrc: poster.bodyFallbackSrc,
        id: product.id,
        image: poster.image,
        infoButtonLabel: poster.infoButtonLabel,
        priceInUSD: typeof product.priceInUSD === 'number' ? product.priceInUSD : null,
        receiptBody: poster.receiptBody,
        sizes: summarizeSizeVariants(variantsByProduct.get(String(product.id)) ?? []).map(
          (size) => ({
            label: size.label,
            priceInUSD: size.priceInUSD,
            value: size.value,
            variantId: size.id,
          }),
        ),
        slug: poster.slug,
        summary: poster.summary,
        title: poster.title,
      }
    })
    .filter((item): item is RegularOrderItem => Boolean(item))
    .sort((left, right) => {
      // Standing menu first (alphabetical from the query sort), then the
      // rotation flavors in the order the owner arranged them.
      if (left.availability !== right.availability) {
        return left.availability === 'always' ? -1 : 1
      }

      if (left.availability === 'seasonal') {
        return (
          (rotationFlavorOrder.get(String(left.id)) ?? Number.MAX_SAFE_INTEGER) -
          (rotationFlavorOrder.get(String(right.id)) ?? Number.MAX_SAFE_INTEGER)
        )
      }

      return 0
    })

  return { items, seasonalLabel }
}
