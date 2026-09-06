import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  DefaultDocumentIDType,
  FieldHook,
  PayloadRequest,
} from 'payload'

import {
  ensureProductSizeVariants,
  ensureSizeAxis,
} from '@/features/products/sizeVariantProvisioning'
import { defaultMiniPriceInUSD } from '@/features/products/sizeVariants'
import { lastCookieInLineupError, noActiveLineupError } from '@/utilities/bakerMenuAdmin'

type SizeAxis = Awaited<ReturnType<typeof ensureSizeAxis>>

/**
 * Owner-facing menu automation. The baker edits three plain fields on the
 * product form — Price (large), Mini size price, and "Where does this
 * flavor live?" — and these hooks keep the underlying machinery in step:
 * the plugin's size variants (which the cart actually prices) and the
 * active rotation's public cookie list.
 */

/** Set on req.context to stop the automation from re-triggering itself. */
export const MENU_AUTOMATION_SKIP = 'bwbSkipProductMenuAutomation'

const ROTATION_CACHE = 'bwbActiveRotationSnapshot'
const COOKIE_CATEGORY_CACHE = 'bwbCookieCategoryID'
const PENDING_PLACEMENT = 'bwbPendingMenuPlacement'

export type MenuPlacement = 'always' | 'backlog' | 'currentRotation'

type ActiveRotationSnapshot = null | {
  id: DefaultDocumentIDType
  individualFlavorIDs: string[]
  showcaseProductIDs: string[]
}

type RelationshipLike = DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null | undefined

const getRelationshipID = (value: RelationshipLike) => {
  if (!value) {
    return undefined
  }

  return typeof value === 'object' ? value.id : value
}

const getRelationshipIDs = (values: unknown): DefaultDocumentIDType[] =>
  (Array.isArray(values) ? values : [])
    .map((value) => getRelationshipID(value as RelationshipLike))
    .filter((id): id is DefaultDocumentIDType => id != null)

/** Postgres IDs travel as numbers; restore them after string-keyed set math. */
const toDocID = (id: string): number => Number(id)

const getContext = (req: PayloadRequest): Record<string, unknown> => {
  if (!req.context) {
    req.context = {}
  }

  return req.context as Record<string, unknown>
}

/** One rotation read per request, shared across hooks and list rows. */
const loadActiveRotation = (req: PayloadRequest): Promise<ActiveRotationSnapshot> => {
  const context = getContext(req)

  if (!context[ROTATION_CACHE]) {
    context[ROTATION_CACHE] = req.payload
      .find({
        collection: 'flavor-rotations',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        select: {
          individualFlavors: true,
          showcaseProducts: true,
        },
        sort: '-updatedAt',
        where: { status: { equals: 'active' } },
      })
      .then((result) => {
        const rotation = result.docs[0]

        if (!rotation) {
          return null
        }

        return {
          id: rotation.id,
          individualFlavorIDs: getRelationshipIDs(rotation.individualFlavors).map(String),
          showcaseProductIDs: getRelationshipIDs(rotation.showcaseProducts).map(String),
        }
      })
  }

  return context[ROTATION_CACHE] as Promise<ActiveRotationSnapshot>
}

const invalidateRotationCache = (req: PayloadRequest) => {
  delete getContext(req)[ROTATION_CACHE]
}

const SIZE_AXIS_CACHE = 'bwbSizeAxis'

/** One size-axis lookup (or creation) per request. */
const loadSizeAxis = (req: PayloadRequest): Promise<SizeAxis> => {
  const context = getContext(req)

  if (!context[SIZE_AXIS_CACHE]) {
    context[SIZE_AXIS_CACHE] = ensureSizeAxis({ payload: req.payload, req })
  }

  return context[SIZE_AXIS_CACHE] as Promise<SizeAxis>
}

const loadCookieCategoryID = (req: PayloadRequest): Promise<DefaultDocumentIDType | null> => {
  const context = getContext(req)

  if (!context[COOKIE_CATEGORY_CACHE]) {
    context[COOKIE_CATEGORY_CACHE] = req.payload
      .find({
        collection: 'categories',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: { slug: { equals: 'cookies' } },
      })
      .then((result) => result.docs[0]?.id ?? null)
  }

  return context[COOKIE_CATEGORY_CACHE] as Promise<DefaultDocumentIDType | null>
}

const isCookieFlavor = async ({
  categories,
  req,
}: {
  categories: unknown
  req: PayloadRequest
}) => {
  const cookieCategoryID = await loadCookieCategoryID(req)

  if (cookieCategoryID == null) {
    return false
  }

  return getRelationshipIDs(categories).map(String).includes(String(cookieCategoryID))
}

/**
 * Derives the virtual "Where does this flavor live?" value from the stored
 * availability field plus the active rotation's public cookie list.
 */
export const menuPlacementAfterRead: FieldHook = async ({ data, req }) => {
  if (!data || data.menuBehavior === 'batchBuilder' || !req) {
    return null
  }

  if (data.individualAvailability === 'always') {
    return 'always'
  }

  const rotation = await loadActiveRotation(req)

  if (rotation && data.id != null && rotation.individualFlavorIDs.includes(String(data.id))) {
    return 'currentRotation'
  }

  return 'backlog'
}

/**
 * Maps the placement select onto the stored availability field, prechecks
 * rotation moves so failures surface BEFORE anything is written, and fills
 * in the default mini price for cookie flavors.
 */
export const applyMenuPlacementBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data || typeof data !== 'object') {
    return data
  }

  const placement = data.menuPlacement as MenuPlacement | null | undefined
  const productID = data.id ?? originalDoc?.id

  if (typeof placement === 'string') {
    data.individualAvailability = placement === 'always' ? 'always' : 'rotation'

    const rotation = await loadActiveRotation(req)

    if (placement === 'currentRotation' && !rotation) {
      throw new Error(noActiveLineupError)
    }

    const isCurrentMember =
      rotation != null &&
      productID != null &&
      rotation.individualFlavorIDs.includes(String(productID))

    if (
      placement !== 'currentRotation' &&
      isCurrentMember &&
      rotation.individualFlavorIDs.length <= 1
    ) {
      throw new Error(lastCookieInLineupError)
    }

    // Stash for afterChange, which applies the rotation move once the
    // product row is safely written.
    getContext(req)[PENDING_PLACEMENT] = placement
  }

  const currentMini = data.miniPriceInUSD ?? originalDoc?.miniPriceInUSD
  const currentPrice = data.priceInUSD ?? originalDoc?.priceInUSD
  const isPricedCookieFlavor =
    typeof currentPrice === 'number' &&
    currentPrice > 0 &&
    (data.menuBehavior ?? originalDoc?.menuBehavior) !== 'batchBuilder' &&
    (await isCookieFlavor({ categories: data.categories ?? originalDoc?.categories, req }))

  if (isPricedCookieFlavor) {
    // Default the mini price so the baker sees a real number instead of an
    // empty box. Only fills blanks - never overwrites.
    if (currentMini == null) {
      data.miniPriceInUSD = defaultMiniPriceInUSD(currentPrice)
    }

    // Link the size axis directly in the incoming data (instead of a nested
    // self-update later, which breaks inside the create transaction).
    const axis = await loadSizeAxis(req)
    const linkedTypeIDs = getRelationshipIDs(data.variantTypes ?? originalDoc?.variantTypes).map(
      String,
    )

    if (data.enableVariants !== true || !linkedTypeIDs.includes(String(axis.sizeTypeID))) {
      data.enableVariants = true
      data.variantTypes = Array.from(
        new Set([
          ...getRelationshipIDs(data.variantTypes ?? originalDoc?.variantTypes).map(String),
          String(axis.sizeTypeID),
        ]),
      ).map(toDocID)
    }
  }

  return data
}

/**
 * After a cookie flavor is published: keep its Large/Mini variants in step
 * with the price fields, and apply any requested rotation move.
 */
export const syncMenuAutomationAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  const context = getContext(req)
  const placement = context[PENDING_PLACEMENT] as MenuPlacement | undefined
  delete context[PENDING_PLACEMENT]

  if (context[MENU_AUTOMATION_SKIP]) {
    return doc
  }

  if (doc?._status !== 'published' || doc.menuBehavior === 'batchBuilder') {
    return doc
  }

  if (!(await isCookieFlavor({ categories: doc.categories, req }))) {
    return doc
  }

  const payload = req.payload

  // --- 1. Size variants follow the product's price fields. -------------
  // (beforeChange already linked the size axis onto the product itself.)
  //
  // Never attempted during 'create': the plugin's variant hooks look the
  // product up without the request's transaction, so they cannot see a row
  // that is still uncommitted - and a failing nested operation kills the
  // shared transaction, which would silently lose the whole create. The
  // admin panel always creates a draft first (so Publish is an update);
  // one-shot API creates get their variants on the first save after.
  if (
    operation !== 'create' &&
    typeof doc.priceInUSD === 'number' &&
    doc.priceInUSD > 0 &&
    typeof doc.id === 'number'
  ) {
    const axis = await loadSizeAxis(req)

    const miniPrice =
      typeof doc.miniPriceInUSD === 'number' && doc.miniPriceInUSD > 0
        ? doc.miniPriceInUSD
        : defaultMiniPriceInUSD(doc.priceInUSD)

    await ensureProductSizeVariants({
      axis,
      payload,
      productID: doc.id,
      productTitle: doc.title,
      req,
      sizes: [
        { priceInUSD: doc.priceInUSD, syncPrice: true, value: 'large' },
        { priceInUSD: miniPrice, syncPrice: true, value: 'mini' },
      ],
    })
  }

  // --- 2. Rotation membership follows the placement select. ------------
  if (placement && doc.id != null) {
    const rotation = await loadActiveRotation(req)

    if (rotation) {
      const idAsString = String(doc.id)
      const isMember = rotation.individualFlavorIDs.includes(idAsString)

      if (placement === 'currentRotation' && !isMember) {
        await payload.update({
          id: rotation.id,
          collection: 'flavor-rotations',
          data: {
            individualFlavors: [...rotation.individualFlavorIDs, idAsString].map(toDocID),
            showcaseProducts: Array.from(new Set([...rotation.showcaseProductIDs, idAsString])).map(
              toDocID,
            ),
          },
          depth: 0,
          overrideAccess: true,
          req,
        })
        invalidateRotationCache(req)
      }

      if (placement !== 'currentRotation' && isMember) {
        await payload.update({
          id: rotation.id,
          collection: 'flavor-rotations',
          data: {
            individualFlavors: rotation.individualFlavorIDs
              .filter((id) => id !== idAsString)
              .map(toDocID),
          },
          depth: 0,
          overrideAccess: true,
          req,
        })
        invalidateRotationCache(req)
      }
    }
  }

  return doc
}
