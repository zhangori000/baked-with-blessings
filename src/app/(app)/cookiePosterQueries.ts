import configPromise from '@payload-config'
import { getPayload, type CollectionSlug, type DefaultDocumentIDType, type Payload } from 'payload'
import { measureServerStep } from '@/utilities/devTiming'
import { menuHref } from '@/utilities/routes'

import {
  buildCookiePosterAssets,
  cookiePosterMetas,
  type CookiePosterAsset,
} from './menu/_components/cookiePosterData'

type ProductRelationship = DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null | undefined

type ActiveFlavorRotation = {
  displayLabel?: null | string
  individualFlavors?: ProductRelationship[] | null
  lockedDescription?: null | string
  lockedLabel?: null | string
  menuLinkLabel?: null | string
  monthlyFlavorLabel?: null | string
  title?: null | string
}

const getRelationshipID = (value: ProductRelationship) => {
  if (!value) {
    return undefined
  }

  return typeof value === 'object' ? value.id : value
}

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

const applyRotationAvailability = ({
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
    (activeRotation.individualFlavors ?? [])
      .map((flavor) => getRelationshipID(flavor))
      .filter((flavorID): flavorID is DefaultDocumentIDType => flavorID != null)
      .map((flavorID) => String(flavorID)),
  )
  const monthlyFlavorOrder = new Map(
    (activeRotation.individualFlavors ?? [])
      .map((flavor) => getRelationshipID(flavor))
      .filter((flavorID): flavorID is DefaultDocumentIDType => flavorID != null)
      .map((flavorID, index) => [String(flavorID), index] as const),
  )

  return posters
    .map((poster) => {
      const productID = typeof poster.productId === 'number' ? String(poster.productId) : null
      const isMonthlyFlavor = Boolean(productID && monthlyFlavorIDs.has(productID))

      return {
        ...poster,
        amount: isMonthlyFlavor ? poster.amount : 'Catering only',
        canBuyCatering: true,
        canBuyIndividually: isMonthlyFlavor,
        isMonthlyFlavor,
        lockedDescription:
          activeRotation.lockedDescription?.trim() ||
          'This flavor is outside the current rotation, but you can still order it in batches of 10 from the menu.',
        lockedLabel: activeRotation.lockedLabel?.trim() || 'Catering only this month',
        menuHref,
        menuLinkLabel: activeRotation.menuLinkLabel?.trim() || 'View menu',
        monthlyFlavorLabel:
          activeRotation.monthlyFlavorLabel?.trim() ||
          activeRotation.displayLabel?.trim() ||
          "This month's flavor",
      }
    })
    .sort((left, right) => {
      const leftOrder =
        typeof left.productId === 'number' ? monthlyFlavorOrder.get(String(left.productId)) : undefined
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

export const buildFallbackHomeCookiePosters = (): CookiePosterAsset[] =>
  cookiePosterMetas.map((meta) => ({
    ...meta,
    amount: 'Fresh weekly',
    href: `/cookies/${meta.slug}`,
    image: null,
  }))

export const queryHomeCookiePosters = async () => {
  const payload = await measureServerStep('payload init: rotating cookie posters', () =>
    getPayload({ config: configPromise }),
  )
  const activeRotation = await queryActiveFlavorRotation(payload)
  const result = await measureServerStep('payload.find products: rotating cookie posters', () =>
    payload.find({
      collection: 'products',
      draft: false,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      select: {
        gallery: true,
        id: true,
        meta: true,
        poster: true,
        priceInUSD: true,
        slug: true,
        title: true,
      },
      sort: 'title',
    }),
  )

  const posters = buildCookiePosterAssets(result.docs)
  const postersWithAvailability = applyRotationAvailability({
    activeRotation,
    posters,
  })

  return postersWithAvailability.length > 0 ? postersWithAvailability : buildFallbackHomeCookiePosters()
}
