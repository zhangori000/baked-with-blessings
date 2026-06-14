import { describe, expect, it, vi } from 'vitest'

import { createTrayBuilderValidationHook } from '@/plugins/ecommerce/trayBuilder'

const COOKIE_CATEGORY_ID = 77

type MockProduct = {
  categories?: number[]
  id: number
  individualAvailability?: 'always' | 'rotation' | null
  menuBehavior?: 'batchBuilder' | 'simple'
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

  const find = vi.fn(async ({ collection }: { collection: string }) => {
    if (collection === 'flavor-rotations') {
      return {
        docs:
          rotationFlavorIDs === null
            ? []
            : [{ individualFlavors: rotationFlavorIDs }],
      }
    }

    if (collection === 'categories') {
      return { docs: [{ id: COOKIE_CATEGORY_ID, slug: 'cookies' }] }
    }

    return { docs: [] }
  })

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

  it('allows always-available flavors even when the rotation excludes them', async () => {
    await expect(
      runHook({
        items: [{ product: alwaysFlavor.id, quantity: 3 }],
        products: [alwaysFlavor],
        rotationFlavorIDs: [999],
      }),
    ).resolves.toBeTruthy()
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
