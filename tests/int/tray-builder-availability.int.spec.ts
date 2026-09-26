import { describe, expect, it, vi } from 'vitest'

import { createTrayBuilderValidationHook } from '@/plugins/ecommerce/trayBuilder'

const COOKIE_CATEGORY_ID = 77
const CATERING_PACKAGES_CATEGORY_ID = 88

type MockProduct = {
  _status?: 'draft' | 'published'
  categories?: number[]
  flavorSelection?: 'mixAndMatch' | 'single'
  id: number
  individualAvailability?: 'always' | 'rotation' | null
  menuBehavior?: 'batchBuilder' | 'simple'
  requiredSelectionCount?: number
  selectableProducts?: number[]
  title: string
}

/**
 * Mocks the slice of req.payload the availability validation touches:
 * product lookups, the active flavor rotation, and the cookies category.
 */
const makeReq = ({
  products,
  rotationFlavorIDs,
}: {
  products: MockProduct[]
  rotationFlavorIDs: null | number[]
}) => {
  const productsByID = new Map(products.map((product) => [String(product.id), product]))

  const find = vi.fn(
    async ({
      collection,
      where,
    }: {
      collection: string
      where?: { slug?: { equals?: string } }
    }) => {
      if (collection === 'flavor-rotations') {
        return {
          docs: rotationFlavorIDs === null ? [] : [{ individualFlavors: rotationFlavorIDs }],
        }
      }

      if (collection === 'categories') {
        if (where?.slug?.equals === 'catering-packages') {
          return { docs: [{ id: CATERING_PACKAGES_CATEGORY_ID, slug: 'catering-packages' }] }
        }

        return { docs: [{ id: COOKIE_CATEGORY_ID, slug: 'cookies' }] }
      }

      return { docs: [] }
    },
  )

  const findByID = vi.fn(async ({ id }: { id: number | string }) => {
    const product = productsByID.get(String(id))

    if (!product) {
      throw new Error(`Unexpected product lookup: ${String(id)}`)
    }

    return product
  })

  return { payload: { find, findByID } } as never
}

const runHook = async ({
  items,
  products,
  rotationFlavorIDs,
}: {
  items: Record<string, unknown>[]
  products: MockProduct[]
  rotationFlavorIDs: null | number[]
}) => {
  const hook = createTrayBuilderValidationHook()

  return hook({
    data: { items },
    req: makeReq({ products, rotationFlavorIDs }),
  } as never)
}

describe('individual cookie availability (cart/order validation)', () => {
  const alwaysFlavor: MockProduct = {
    categories: [COOKIE_CATEGORY_ID],
    id: 5,
    individualAvailability: 'always',
    menuBehavior: 'simple',
    title: "S'mores",
  }
  const rotationFlavor: MockProduct = {
    categories: [COOKIE_CATEGORY_ID],
    id: 6,
    individualAvailability: 'rotation',
    menuBehavior: 'simple',
    title: 'Dirty Chai',
  }

  it('rejects legacy always-available flavors when the rotation excludes them', async () => {
    await expect(
      runHook({
        items: [{ product: alwaysFlavor.id, quantity: 3 }],
        products: [alwaysFlavor],
        rotationFlavorIDs: [999],
      }),
    ).rejects.toThrow(/catering-only/)
  })

  it('allows rotation flavors while they are in the active rotation', async () => {
    await expect(
      runHook({
        items: [{ product: rotationFlavor.id, quantity: 1 }],
        products: [rotationFlavor],
        rotationFlavorIDs: [rotationFlavor.id],
      }),
    ).resolves.toBeTruthy()
  })

  it('rejects rotation-scoped flavors that left the rotation', async () => {
    await expect(
      runHook({
        items: [{ product: rotationFlavor.id, quantity: 1 }],
        products: [rotationFlavor],
        rotationFlavorIDs: [999],
      }),
    ).rejects.toThrow(/catering-only/i)
  })

  it('treats legacy flavors without the field as rotation-scoped', async () => {
    const legacyFlavor: MockProduct = { ...rotationFlavor, individualAvailability: null }

    await expect(
      runHook({
        items: [{ product: legacyFlavor.id, quantity: 1 }],
        products: [legacyFlavor],
        rotationFlavorIDs: [999],
      }),
    ).rejects.toThrow(/catering-only/i)
  })

  it('keeps allowing everything when no rotation is active', async () => {
    await expect(
      runHook({
        items: [{ product: rotationFlavor.id, quantity: 1 }],
        products: [rotationFlavor],
        rotationFlavorIDs: null,
      }),
    ).resolves.toBeTruthy()
  })
})

describe('mix-and-match flavor availability', () => {
  const currentFlavor: MockProduct = {
    categories: [COOKIE_CATEGORY_ID],
    id: 6,
    menuBehavior: 'simple',
    title: 'Biscoff',
  }
  const pastFlavor: MockProduct = {
    categories: [COOKIE_CATEGORY_ID],
    id: 7,
    menuBehavior: 'simple',
    title: 'Brookie',
  }
  const mixBox: MockProduct = {
    categories: [],
    flavorSelection: 'mixAndMatch',
    id: 20,
    menuBehavior: 'batchBuilder',
    requiredSelectionCount: 3,
    selectableProducts: [currentFlavor.id, pastFlavor.id],
    title: 'Build-Your-Own Cookie Box',
  }
  const cateringPackage: MockProduct = {
    ...mixBox,
    categories: [CATERING_PACKAGES_CATEGORY_ID],
    id: 21,
    requiredSelectionCount: 18,
    title: 'Full-Size Cookies — 18 Cookies',
  }

  it('rejects past flavors in build-your-own boxes', async () => {
    await expect(
      runHook({
        items: [
          {
            batchSelections: [
              { product: currentFlavor.id, quantity: 2 },
              { product: pastFlavor.id, quantity: 1 },
            ],
            product: mixBox.id,
            quantity: 1,
          },
        ],
        products: [currentFlavor, pastFlavor, mixBox],
        rotationFlavorIDs: [currentFlavor.id],
      }),
    ).rejects.toThrow(/past flavor/i)
  })

  it('allows past flavors in catering packages', async () => {
    await expect(
      runHook({
        items: [
          {
            batchSelections: [
              { product: currentFlavor.id, quantity: 6 },
              { product: pastFlavor.id, quantity: 12 },
            ],
            product: cateringPackage.id,
            quantity: 1,
          },
        ],
        products: [currentFlavor, pastFlavor, cateringPackage],
        rotationFlavorIDs: [currentFlavor.id],
      }),
    ).resolves.toBeTruthy()
  })

  it('allows newly added cookie flavors in catering packages without editing the package', async () => {
    const newFlavor: MockProduct = {
      categories: [COOKIE_CATEGORY_ID],
      id: 8,
      menuBehavior: 'simple',
      title: 'Lemon Crinkle',
    }

    await expect(
      runHook({
        items: [
          {
            batchSelections: [{ product: newFlavor.id, quantity: 18 }],
            product: cateringPackage.id,
            quantity: 1,
          },
        ],
        products: [newFlavor, cateringPackage],
        rotationFlavorIDs: [currentFlavor.id],
      }),
    ).resolves.toBeTruthy()
  })

  it('rejects non-cookie and unpublished products in catering packages', async () => {
    const pudding: MockProduct = {
      categories: [],
      id: 9,
      menuBehavior: 'simple',
      title: 'Banana Pudding 10-Pack',
    }
    const draftFlavor: MockProduct = {
      _status: 'draft',
      categories: [COOKIE_CATEGORY_ID],
      id: 10,
      menuBehavior: 'simple',
      title: 'Unreleased Cookie',
    }

    for (const product of [pudding, draftFlavor]) {
      await expect(
        runHook({
          items: [
            {
              batchSelections: [{ product: product.id, quantity: 18 }],
              product: cateringPackage.id,
              quantity: 1,
            },
          ],
          products: [product, cateringPackage],
          rotationFlavorIDs: [currentFlavor.id],
        }),
      ).rejects.toThrow(/not allowed/)
    }
  })
})
