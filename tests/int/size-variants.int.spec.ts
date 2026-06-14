import { describe, expect, it } from 'vitest'

import type { Variant } from '@/payload-types'

import {
  pickDefaultSizeVariant,
  summarizeSizeVariants,
} from '@/features/products/sizeVariants'

const makeVariant = (
  id: number,
  size: 'large' | 'mini',
  priceInUSD: number,
  overrides: Partial<Variant> = {},
): Partial<Variant> =>
  ({
    id,
    options: [
      {
        id: id * 100,
        label: size === 'large' ? 'Large' : 'Mini',
        value: size,
        variantType: 1,
      },
    ],
    priceInUSD,
    title: `Cookie — ${size}`,
    ...overrides,
  }) as Partial<Variant>

describe('summarizeSizeVariants', () => {
  it('orders sizes Large first regardless of input order', () => {
    const sizes = summarizeSizeVariants([
      makeVariant(2, 'mini', 425),
      makeVariant(1, 'large', 700),
    ])

    expect(sizes.map((size) => size.value)).toEqual(['large', 'mini'])
    expect(sizes[0]).toMatchObject({ id: 1, label: 'Large', priceInUSD: 700 })
    expect(sizes[1]).toMatchObject({ id: 2, label: 'Mini', priceInUSD: 425 })
  })

  it('drops variants without a positive price or a resolvable option', () => {
    const unpriced = makeVariant(3, 'mini', 0)
    const optionless = { id: 4, options: [], priceInUSD: 500 } as Partial<Variant>
    const unpopulated = { id: 5, options: [42], priceInUSD: 500 } as Partial<Variant>

    expect(summarizeSizeVariants([unpriced, optionless, unpopulated])).toEqual([])
  })
})

describe('pickDefaultSizeVariant', () => {
  it('prefers the Large size for one-tap add to cart', () => {
    const sizes = summarizeSizeVariants([
      makeVariant(2, 'mini', 425),
      makeVariant(1, 'large', 700),
    ])

    expect(pickDefaultSizeVariant(sizes)).toMatchObject({ id: 1, value: 'large' })
  })

  it('falls back to the first available size when Large is missing', () => {
    const sizes = summarizeSizeVariants([makeVariant(2, 'mini', 425)])

    expect(pickDefaultSizeVariant(sizes)).toMatchObject({ id: 2, value: 'mini' })
  })

  it('returns null when there are no sizes', () => {
    expect(pickDefaultSizeVariant([])).toBeNull()
  })
})
