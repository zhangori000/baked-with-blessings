import { describe, expect, it, vi } from 'vitest'

import {
  applyMenuPlacementBeforeChange,
  menuPlacementAfterRead,
  MENU_AUTOMATION_SKIP,
  syncMenuAutomationAfterChange,
} from '@/collections/Products/menuAutomation'

const COOKIE_CATEGORY_ID = 77
const SIZE_TYPE_ID = 1
const LARGE_OPTION_ID = 11
const MINI_OPTION_ID = 12

type FakeRotation = {
  id: number
  individualFlavors: number[]
  showcaseProducts: number[]
}

type RecordedWrite = { collection: string; data: Record<string, unknown>; id?: number | string }

const makeEnv = ({
  rotation = null,
  variants = [],
}: {
  rotation?: FakeRotation | null
  variants?: Record<string, unknown>[]
} = {}) => {
  const creates: RecordedWrite[] = []
  const updates: RecordedWrite[] = []

  const find = vi.fn(async ({ collection, where }: { collection: string; where?: unknown }) => {
    switch (collection) {
      case 'categories':
        return { docs: [{ id: COOKIE_CATEGORY_ID, slug: 'cookies' }] }
      case 'flavor-rotations':
        return { docs: rotation ? [rotation] : [] }
      case 'variantOptions': {
        const conditions = (where as { and?: { value?: { equals?: string } }[] })?.and ?? []
        const value = conditions.find((entry) => entry.value)?.value?.equals

        return {
          docs: [
            {
              id: value === 'large' ? LARGE_OPTION_ID : MINI_OPTION_ID,
              label: value === 'large' ? 'Large' : 'Mini',
              value,
            },
          ],
        }
      }
      case 'variants':
        return { docs: variants }
      case 'variantTypes':
        return { docs: [{ id: SIZE_TYPE_ID, label: 'Size', name: 'size' }] }
      default:
        return { docs: [] }
    }
  })

  const create = vi.fn(async ({ collection, data }: RecordedWrite) => {
    creates.push({ collection, data })
    return { id: 900 + creates.length, ...data }
  })

  const update = vi.fn(async ({ collection, data, id }: RecordedWrite) => {
    updates.push({ collection, data, id })
    return { id, ...data }
  })

  const req = { context: {}, payload: { create, find, update } } as never

  return { create, creates, find, req, update, updates }
}

const cookieDoc = (overrides: Record<string, unknown> = {}) => ({
  _status: 'published',
  categories: [COOKIE_CATEGORY_ID],
  enableVariants: true,
  id: 5,
  individualAvailability: 'rotation',
  menuBehavior: 'simple',
  miniPriceInUSD: 425,
  priceInUSD: 700,
  title: "S'mores",
  variantTypes: [SIZE_TYPE_ID],
  ...overrides,
})

const matchedVariants = [
  { id: 41, options: [{ id: LARGE_OPTION_ID }], priceInUSD: 700 },
  { id: 42, options: [{ id: MINI_OPTION_ID }], priceInUSD: 425 },
]

describe('menuPlacementAfterRead (the derived placement select)', () => {
  it('reads "always" straight from the stored field', async () => {
    const { req } = makeEnv()

    await expect(
      menuPlacementAfterRead({
        data: cookieDoc({ individualAvailability: 'always' }),
        req,
      } as never),
    ).resolves.toBe('always')
  })

  it('reads rotation membership from the active rotation', async () => {
    const { req } = makeEnv({
      rotation: { id: 9, individualFlavors: [5], showcaseProducts: [5] },
    })

    await expect(menuPlacementAfterRead({ data: cookieDoc(), req } as never)).resolves.toBe(
      'currentRotation',
    )
  })

  it('falls back to backlog, and skips tray products', async () => {
    const { req } = makeEnv({
      rotation: { id: 9, individualFlavors: [99], showcaseProducts: [99] },
    })

    await expect(menuPlacementAfterRead({ data: cookieDoc(), req } as never)).resolves.toBe(
      'backlog',
    )
    await expect(
      menuPlacementAfterRead({
        data: cookieDoc({ menuBehavior: 'batchBuilder' }),
        req,
      } as never),
    ).resolves.toBeNull()
  })
})

describe('applyMenuPlacementBeforeChange (mapping + prechecks)', () => {
  it('maps the select onto the stored availability field', async () => {
    const { req } = makeEnv({
      rotation: { id: 9, individualFlavors: [99], showcaseProducts: [99] },
    })
    const data = cookieDoc({ menuPlacement: 'always' })

    await applyMenuPlacementBeforeChange({ data, originalDoc: undefined, req } as never)

    expect(data.individualAvailability).toBe('always')
  })

  it('refuses "current rotation" when no rotation is active', async () => {
    const { req } = makeEnv({ rotation: null })

    await expect(
      applyMenuPlacementBeforeChange({
        data: cookieDoc({ menuPlacement: 'currentRotation' }),
        originalDoc: undefined,
        req,
      } as never),
    ).rejects.toThrow(/No cookie lineup is live/i)
  })

  it('refuses to empty the rotation by moving its last cookie out', async () => {
    const { req } = makeEnv({
      rotation: { id: 9, individualFlavors: [5], showcaseProducts: [5] },
    })

    await expect(
      applyMenuPlacementBeforeChange({
        data: cookieDoc({ menuPlacement: 'backlog' }),
        originalDoc: undefined,
        req,
      } as never),
    ).rejects.toThrow(/only cookie in this week's specials/i)
  })

  it('fills an empty mini price with the half-of-large default for cookie flavors', async () => {
    const { req } = makeEnv()
    const data = cookieDoc({ miniPriceInUSD: undefined })

    await applyMenuPlacementBeforeChange({ data, originalDoc: undefined, req } as never)

    // 50% of the 700 large price, rounded to the nearest quarter.
    expect(data.miniPriceInUSD).toBe(350)
  })

  it('never overwrites a mini price the owner already set', async () => {
    const { req } = makeEnv()
    const data = cookieDoc({ miniPriceInUSD: 500 })

    await applyMenuPlacementBeforeChange({ data, originalDoc: undefined, req } as never)

    expect(data.miniPriceInUSD).toBe(500)
  })

  it('links the size axis in the incoming data, so creates never self-update', async () => {
    const { req } = makeEnv()
    const data = cookieDoc({ enableVariants: false, variantTypes: [] })

    await applyMenuPlacementBeforeChange({ data, originalDoc: undefined, req } as never)

    expect(data.enableVariants).toBe(true)
    expect(data.variantTypes).toEqual([SIZE_TYPE_ID])
  })
})

describe('syncMenuAutomationAfterChange (variants + rotation follow the form)', () => {
  it('creates published Large/Mini variants for a new cookie flavor', async () => {
    const { creates, req, updates } = makeEnv({ variants: [] })

    await syncMenuAutomationAfterChange({ doc: cookieDoc(), req } as never)

    const variantCreates = creates.filter((write) => write.collection === 'variants')
    expect(variantCreates).toHaveLength(2)
    expect(variantCreates[0]?.data).toMatchObject({
      _status: 'published',
      options: [LARGE_OPTION_ID],
      priceInUSD: 700,
      product: 5,
    })
    expect(variantCreates[1]?.data).toMatchObject({
      _status: 'published',
      options: [MINI_OPTION_ID],
      priceInUSD: 425,
      product: 5,
    })
    // Variant types were already linked; no self-update needed.
    expect(updates.filter((write) => write.collection === 'products')).toHaveLength(0)
  })

  it('re-prices variants when the owner changes the price fields', async () => {
    const { req, updates } = makeEnv({
      variants: [
        { id: 41, options: [{ id: LARGE_OPTION_ID }], priceInUSD: 650 },
        { id: 42, options: [{ id: MINI_OPTION_ID }], priceInUSD: 425 },
      ],
    })

    await syncMenuAutomationAfterChange({ doc: cookieDoc(), req } as never)

    const variantUpdates = updates.filter((write) => write.collection === 'variants')
    expect(variantUpdates).toHaveLength(1)
    expect(variantUpdates[0]).toMatchObject({ id: 41, data: { priceInUSD: 700 } })
  })

  it('adds the flavor to the active rotation when placed there', async () => {
    const { req, updates } = makeEnv({
      rotation: { id: 9, individualFlavors: [21], showcaseProducts: [21] },
      variants: matchedVariants,
    })
    const data = cookieDoc({ menuPlacement: 'currentRotation' })

    await applyMenuPlacementBeforeChange({ data, originalDoc: undefined, req } as never)
    await syncMenuAutomationAfterChange({ doc: cookieDoc(), req } as never)

    const rotationUpdates = updates.filter((write) => write.collection === 'flavor-rotations')
    expect(rotationUpdates).toHaveLength(1)
    expect(rotationUpdates[0]?.data).toMatchObject({
      individualFlavors: [21, 5],
      showcaseProducts: [21, 5],
    })
  })

  it('removes the flavor from the rotation when moved to backlog', async () => {
    const { req, updates } = makeEnv({
      rotation: { id: 9, individualFlavors: [21, 5], showcaseProducts: [21, 5] },
      variants: matchedVariants,
    })
    const data = cookieDoc({ menuPlacement: 'backlog' })

    await applyMenuPlacementBeforeChange({ data, originalDoc: undefined, req } as never)
    await syncMenuAutomationAfterChange({ doc: cookieDoc(), req } as never)

    const rotationUpdates = updates.filter((write) => write.collection === 'flavor-rotations')
    expect(rotationUpdates).toHaveLength(1)
    expect(rotationUpdates[0]?.data).toMatchObject({ individualFlavors: [21] })
  })

  it('never touches variants during create — a failing nested op would kill the transaction', async () => {
    const env = makeEnv({ variants: [] })

    await expect(
      syncMenuAutomationAfterChange({
        doc: cookieDoc(),
        operation: 'create',
        req: env.req,
      } as never),
    ).resolves.toBeTruthy()

    expect(env.creates.filter((write) => write.collection === 'variants')).toHaveLength(0)

    // The first ordinary save afterwards provisions them.
    const followUp = makeEnv({ variants: [] })
    await syncMenuAutomationAfterChange({
      doc: cookieDoc(),
      operation: 'update',
      req: followUp.req,
    } as never)
    expect(followUp.creates.filter((write) => write.collection === 'variants')).toHaveLength(2)
  })

  it('leaves drafts, trays, and skip-flagged saves alone', async () => {
    const { creates, req, updates } = makeEnv({ variants: [] })

    await syncMenuAutomationAfterChange({ doc: cookieDoc({ _status: 'draft' }), req } as never)
    await syncMenuAutomationAfterChange({
      doc: cookieDoc({ menuBehavior: 'batchBuilder' }),
      req,
    } as never)

    const flaggedEnv = makeEnv({ variants: [] })
    ;(flaggedEnv.req as { context: Record<string, unknown> }).context[MENU_AUTOMATION_SKIP] = true
    await syncMenuAutomationAfterChange({ doc: cookieDoc(), req: flaggedEnv.req } as never)

    expect(creates).toHaveLength(0)
    expect(updates).toHaveLength(0)
    expect(flaggedEnv.creates).toHaveLength(0)
  })
})
