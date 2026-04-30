import { defaultCartItemMatcher, type CartItemMatcher } from '@payloadcms/plugin-ecommerce'
import type {
  CollectionBeforeValidateHook,
  CollectionSlug,
  DefaultDocumentIDType,
  Endpoint,
  Field,
  PayloadRequest,
} from 'payload'
import { addDataAndFileToRequest } from 'payload'

type BatchSelectionLike = {
  product?: DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null
  quantity?: number | null
}

type ActiveFlavorRotationLike = {
  individualFlavors?:
    | (DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null)[]
    | null
}

type CategoryConfigLike = {
  id?: DefaultDocumentIDType
  slug?: null | string
}

type TrayBuilderItemLike = {
  batchSelections?: BatchSelectionLike[] | null
  product?: DefaultDocumentIDType | ProductConfigLike | null
  quantity?: number | null
  variant?: DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null
}

type ProductConfigLike = {
  categories?:
    | (DefaultDocumentIDType | CategoryConfigLike | null)[]
    | null
  id?: DefaultDocumentIDType
  menuBehavior?: 'batchBuilder' | 'simple' | string | null
  requiredSelectionCount?: null | number
  selectableProducts?:
    | (DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null)[]
    | null
  title?: null | string
}

type CartDocumentLike = {
  items?: TrayBuilderItemLike[] | null
  mergedSourceCartIDs?: { sourceCartID?: null | string }[] | null
}

const getRelationshipID = (
  value: DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null | undefined,
): DefaultDocumentIDType | undefined => {
  if (!value) {
    return undefined
  }

  return typeof value === 'object' ? value.id : value
}

const getMergedSourceCartIDSet = (cart: CartDocumentLike) =>
  new Set(
    (Array.isArray(cart.mergedSourceCartIDs) ? cart.mergedSourceCartIDs : [])
      .map((entry) => (typeof entry?.sourceCartID === 'string' ? entry.sourceCartID : ''))
      .filter(Boolean),
  )

const normalizeBatchSelections = (item: TrayBuilderItemLike) => {
  const selections = Array.isArray(item.batchSelections) ? item.batchSelections : []
  const normalizedSelections = new Map<string, number>()

  for (const selection of selections) {
    const productID = getRelationshipID(selection?.product)

    if (!productID) {
      continue
    }

    const quantity = typeof selection?.quantity === 'number' ? selection.quantity : 0
    const existingQuantity = normalizedSelections.get(String(productID)) ?? 0

    normalizedSelections.set(String(productID), existingQuantity + quantity)
  }

  return Array.from(normalizedSelections.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([productID, quantity]) => `${productID}:${quantity}`)
    .join('|')
}

const createBatchSelectionsField = (productsSlug: CollectionSlug): Field => ({
  name: 'batchSelections',
  type: 'array',
  admin: {
    description:
      'For tray-builder products, store which child products were picked for this tray and how many of each.',
    initCollapsed: true,
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: productsSlug,
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 1,
      min: 1,
      required: true,
    },
  ],
  labels: {
    plural: 'Tray Selections',
    singular: 'Tray Selection',
  },
})

const appendBatchSelectionsToItemArrays = ({
  fields,
  productsSlug,
}: {
  fields: Field[]
  productsSlug: CollectionSlug
}): Field[] =>
  fields.map((field) => {
    if (!field || typeof field !== 'object') {
      return field
    }

    const nextField = { ...field } as Field & {
      fields?: Field[]
      name?: string
      tabs?: { fields: Field[] }[]
      type?: string
    }

    if (Array.isArray(nextField.tabs)) {
      nextField.tabs = nextField.tabs.map((tab) => ({
        ...tab,
        fields: appendBatchSelectionsToItemArrays({
          fields: tab.fields,
          productsSlug,
        }),
      }))
    }

    if (Array.isArray(nextField.fields)) {
      nextField.fields = appendBatchSelectionsToItemArrays({
        fields: nextField.fields,
        productsSlug,
      })
    }

    if (nextField.type === 'array' && nextField.name === 'items') {
      const itemFields = Array.isArray(nextField.fields) ? nextField.fields : []
      const alreadyHasBatchSelections = itemFields.some(
        (itemField) =>
          itemField &&
          typeof itemField === 'object' &&
          'name' in itemField &&
          itemField.name === 'batchSelections',
      )

      if (!alreadyHasBatchSelections) {
        nextField.fields = [...itemFields, createBatchSelectionsField(productsSlug)]
      }
    }

    return nextField
  })

const getProductLabel = (product: ProductConfigLike | undefined, fallbackID: DefaultDocumentIDType) => {
  if (product?.title && typeof product.title === 'string') {
    return product.title
  }

  return `Product ${String(fallbackID)}`
}

const validateBatchSelections = async ({
  items,
  productsSlug = 'products',
  req,
}: {
  items: TrayBuilderItemLike[]
  productsSlug?: CollectionSlug
  req: PayloadRequest
}) => {
  const productCache = new Map<string, ProductConfigLike>()
  let activeRotationFlavorIDSetPromise: Promise<Set<string> | null> | null = null
  let cookieCategoryIDPromise: Promise<DefaultDocumentIDType | null> | null = null

  const loadProduct = async (
    relationship:
      | DefaultDocumentIDType
      | ProductConfigLike
      | null
      | undefined,
  ): Promise<ProductConfigLike | undefined> => {
    const productID = getRelationshipID(relationship)

    if (!productID) {
      return undefined
    }

    if (
      typeof relationship === 'object' &&
      relationship &&
      'menuBehavior' in relationship &&
      'categories' in relationship
    ) {
      return relationship
    }

    const cacheKey = String(productID)

    if (productCache.has(cacheKey)) {
      return productCache.get(cacheKey)
    }

    const product = (await req.payload.findByID({
      id: productID,
      collection: productsSlug,
      depth: 0,
      req,
    })) as ProductConfigLike

    productCache.set(cacheKey, product)

    return product
  }

  const loadActiveRotationFlavorIDSet = () => {
    if (!activeRotationFlavorIDSetPromise) {
      activeRotationFlavorIDSetPromise = req.payload
        .find({
          collection: 'flavor-rotations' as CollectionSlug,
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          req,
          select: {
            individualFlavors: true,
          },
          sort: '-updatedAt',
          where: {
            status: {
              equals: 'active',
            },
          },
        })
        .then((result) => {
          const activeRotation = result.docs[0] as ActiveFlavorRotationLike | undefined

          if (!activeRotation) {
            return null
          }

          return new Set(
            (activeRotation.individualFlavors ?? [])
              .map((flavor) => getRelationshipID(flavor))
              .filter((flavorID): flavorID is DefaultDocumentIDType => flavorID != null)
              .map((flavorID) => String(flavorID)),
          )
        })
    }

    return activeRotationFlavorIDSetPromise
  }

  const loadCookieCategoryID = () => {
    if (!cookieCategoryIDPromise) {
      cookieCategoryIDPromise = req.payload
        .find({
          collection: 'categories',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          req,
          select: {
            id: true,
          },
          where: {
            slug: {
              equals: 'cookies',
            },
          },
        })
        .then((result) => {
          const cookieCategory = result.docs[0] as CategoryConfigLike | undefined

          return cookieCategory?.id ?? null
        })
    }

    return cookieCategoryIDPromise
  }

  const validateIndividualCookieAvailability = async ({
    label,
    product,
    productID,
  }: {
    label: string
    product: ProductConfigLike | undefined
    productID: DefaultDocumentIDType
  }) => {
    const activeRotationFlavorIDs = await loadActiveRotationFlavorIDSet()

    if (!activeRotationFlavorIDs) {
      return
    }

    const cookieCategoryID = await loadCookieCategoryID()

    if (!cookieCategoryID) {
      return
    }

    const productCategoryIDs = new Set(
      (Array.isArray(product?.categories) ? product.categories : [])
        .map((category) => getRelationshipID(category))
        .filter((categoryID): categoryID is DefaultDocumentIDType => categoryID != null)
        .map((categoryID) => String(categoryID)),
    )

    if (!productCategoryIDs.has(String(cookieCategoryID))) {
      return
    }

    if (!activeRotationFlavorIDs.has(String(productID))) {
      throw new Error(
        `${label} is catering-only during the current cookie rotation. Order it through a cookie tray on the menu.`,
      )
    }
  }

  for (const [itemIndex, item] of items.entries()) {
    const productID = getRelationshipID(item?.product)

    if (!productID) {
      if (Array.isArray(item?.batchSelections) && item.batchSelections.length > 0) {
        throw new Error(
          `Cart item ${itemIndex + 1} includes tray selections but is missing a parent product.`,
        )
      }

      continue
    }

    const product = await loadProduct(item.product)
    const label = getProductLabel(product, productID)
    const menuBehavior = product?.menuBehavior === 'batchBuilder' ? 'batchBuilder' : 'simple'
    const batchSelections = Array.isArray(item?.batchSelections) ? item.batchSelections : []

    if (menuBehavior !== 'batchBuilder') {
      if (batchSelections.length > 0) {
        throw new Error(`${label} does not accept tray selections.`)
      }

      await validateIndividualCookieAvailability({
        label,
        product,
        productID,
      })

      continue
    }

    if (batchSelections.length === 0) {
      throw new Error(`${label} requires tray selections before it can be saved.`)
    }

    const requiredSelectionCount =
      typeof product?.requiredSelectionCount === 'number' ? product.requiredSelectionCount : null

    if (!requiredSelectionCount || requiredSelectionCount < 1) {
      throw new Error(`${label} is misconfigured. Set a valid required selection count.`)
    }

    const allowedProductIDs = new Set(
      (Array.isArray(product?.selectableProducts) ? product.selectableProducts : [])
        .map((selectionProduct) => getRelationshipID(selectionProduct))
        .filter((selectionProductID): selectionProductID is DefaultDocumentIDType =>
          Boolean(selectionProductID),
        )
        .map((selectionProductID) => String(selectionProductID)),
    )

    if (allowedProductIDs.size === 0) {
      throw new Error(`${label} is misconfigured. Add selectable products for this tray.`)
    }

    let selectedTotal = 0

    for (const [selectionIndex, selection] of batchSelections.entries()) {
      const selectionProductID = getRelationshipID(selection?.product)

      if (!selectionProductID) {
        throw new Error(
          `${label} has a tray selection at row ${selectionIndex + 1} without a product.`,
        )
      }

      if (!allowedProductIDs.has(String(selectionProductID))) {
        throw new Error(`${label} includes a product that is not allowed for this tray.`)
      }

      const quantity = typeof selection?.quantity === 'number' ? selection.quantity : NaN

      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new Error(`${label} has a tray selection with an invalid quantity.`)
      }

      selectedTotal += quantity
    }

    if (selectedTotal !== requiredSelectionCount) {
      throw new Error(
        `${label} requires exactly ${requiredSelectionCount} selected item(s). Received ${selectedTotal}.`,
      )
    }
  }
}

export const extendCollectionItemsWithBatchSelections = ({
  fields,
  productsSlug = 'products',
}: {
  fields: Field[]
  productsSlug?: CollectionSlug
}): Field[] => appendBatchSelectionsToItemArrays({ fields, productsSlug })

export const createTrayBuilderValidationHook = ({
  productsSlug = 'products',
}: {
  productsSlug?: CollectionSlug
} = {}): CollectionBeforeValidateHook => {
  return async ({ data, req }) => {
    const items =
      data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)
        ? (data.items as TrayBuilderItemLike[])
        : []

    if (items.length === 0) {
      return data
    }

    await validateBatchSelections({
      items,
      productsSlug,
      req,
    })

    return data
  }
}

export const trayAwareCartItemMatcher: CartItemMatcher = ({ existingItem, newItem }) => {
  if (!defaultCartItemMatcher({ existingItem, newItem })) {
    return false
  }

  return normalizeBatchSelections(existingItem) === normalizeBatchSelections(newItem)
}

export const createTrayAwareMergeCartEndpoint = ({
  cartsSlug,
}: {
  cartsSlug: CollectionSlug
}): Endpoint => ({
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ message: 'Authentication required', success: false }, { status: 401 })
    }

    await addDataAndFileToRequest(req)

    const targetCartID = req.routeParams?.id as DefaultDocumentIDType | undefined
    const data = req.data as {
      sourceCartID?: DefaultDocumentIDType
      sourceSecret?: string
    }

    if (!targetCartID) {
      return Response.json(
        { message: 'Target cart ID is required', success: false },
        { status: 400 },
      )
    }

    if (!data?.sourceCartID) {
      return Response.json(
        { message: 'Source cart ID is required', success: false },
        { status: 400 },
      )
    }

    if (!data?.sourceSecret) {
      return Response.json(
        { message: 'Source cart secret is required', success: false },
        { status: 400 },
      )
    }

    const targetCart = (await req.payload.findByID({
      id: targetCartID,
      collection: cartsSlug,
      depth: 0,
      overrideAccess: false,
      req,
    })) as CartDocumentLike | null

    if (!targetCart) {
      return Response.json(
        {
          cart: null,
          message: `Target cart with ID ${String(targetCartID)} not found`,
          success: false,
        },
        { status: 404 },
      )
    }

    const sourceCartID = String(data.sourceCartID)
    const mergedSourceCartIDs = getMergedSourceCartIDSet(targetCart)

    if (mergedSourceCartIDs.has(sourceCartID)) {
      return Response.json(
        {
          cart: targetCart,
          message: `Source cart ${sourceCartID} was already merged`,
          success: true,
        },
        { status: 200 },
      )
    }

    const sourceCart = await req.payload.find({
      collection: cartsSlug,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        and: [
          {
            id: {
              equals: data.sourceCartID,
            },
          },
          {
            secret: {
              equals: data.sourceSecret,
            },
          },
        ],
      },
    })

    const guestCart = sourceCart.docs[0] as CartDocumentLike | undefined

    if (!guestCart) {
      return Response.json(
        {
          cart: null,
          message: `Source cart with ID ${String(data.sourceCartID)} not found or secret mismatch`,
          success: false,
        },
        { status: 404 },
      )
    }

    const sourceItems: TrayBuilderItemLike[] = Array.isArray(guestCart.items)
      ? (guestCart.items as TrayBuilderItemLike[])
      : []
    const targetItems: TrayBuilderItemLike[] = Array.isArray(targetCart.items)
      ? (targetCart.items as TrayBuilderItemLike[])
      : []
    const mergedItems: TrayBuilderItemLike[] = [...targetItems]

    for (const sourceItem of sourceItems) {
      const existingIndex = mergedItems.findIndex((targetItem) =>
        trayAwareCartItemMatcher({
          existingItem:
            targetItem as Parameters<typeof trayAwareCartItemMatcher>[0]['existingItem'],
          newItem: sourceItem as Parameters<typeof trayAwareCartItemMatcher>[0]['newItem'],
        }),
      )

      if (existingIndex !== -1) {
        const existingItem = mergedItems[existingIndex]!
        mergedItems[existingIndex] = {
          ...existingItem,
          quantity:
            (typeof existingItem.quantity === 'number' ? existingItem.quantity : 0) +
            (typeof sourceItem.quantity === 'number' ? sourceItem.quantity : 0),
        }
      } else {
        const { id: _omitArrayRowID, ...sourceItemWithoutRowID } = sourceItem as {
          id?: DefaultDocumentIDType
        } & TrayBuilderItemLike
        mergedItems.push(sourceItemWithoutRowID)
      }
    }

    const updatedCart = await req.payload.update({
      id: targetCartID,
      collection: cartsSlug,
      data: {
        items: mergedItems as unknown as Record<string, unknown>[],
        mergedSourceCartIDs: [
          ...Array.from(mergedSourceCartIDs).map((mergedSourceCartID) => ({
            sourceCartID: mergedSourceCartID,
          })),
          {
            sourceCartID,
          },
        ],
      },
      depth: 0,
      overrideAccess: false,
      req,
    })

    try {
      await req.payload.delete({
        id: data.sourceCartID,
        collection: cartsSlug,
        overrideAccess: true,
        req,
      })
    } catch {
      req.payload.logger.warn(
        `Merged guest cart ${String(data.sourceCartID)} but could not delete the source cart afterward.`,
      )
    }

    return Response.json({
      cart: updatedCart,
      message: `Merged ${sourceItems.length} items from guest cart`,
      success: true,
    })
  },
  method: 'post',
  path: '/:id/merge',
})
