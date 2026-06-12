import { describe, expect, it } from 'vitest'

import type { CookiePosterAsset } from '@/features/products/cookieDisplayData'

import {
  applyRotationAvailability,
  getPublicRotationProductIDs,
} from '@/app/(app)/cookiePosterQueries'

const makePoster = (overrides: Partial<CookiePosterAsset> = {}): CookiePosterAsset => ({
  allergens: ['wheat'],
  amount: '$7.00',
  bodyFallbackSrc: '/cookie-singular-brookie.svg',
  href: '/cookies/smores',
  image: null,
  infoButtonLabel: 'Info',
  productId: 5,
  receiptBody: { root: { children: [] } },
  slug: 'smores',
  summary: 'A cookie.',
  title: "S'mores",
  ...overrides,
})

describe('cookie poster queries', () => {
  it('uses every selected public rotation cookie ID', () => {
    expect(
      getPublicRotationProductIDs({
        individualFlavors: [10, { id: 20 }, 30, 40],
      }),
    ).toEqual([10, 20, 30, 40])
  })

  it('returns no public rotation IDs when there is no active rotation', () => {
    expect(getPublicRotationProductIDs(null)).toEqual([])
  })
})

describe('applyRotationAvailability (who can be ordered individually)', () => {
  const activeRotation = {
    individualFlavors: [10, 20],
    monthlyFlavorLabel: 'This season',
  }

  it('keeps rotation flavors individually buyable with their price', () => {
    const [poster] = applyRotationAvailability({
      activeRotation,
      posters: [makePoster({ productId: 10 })],
    })

    expect(poster).toMatchObject({
      amount: '$7.00',
      canBuyIndividually: true,
      isMonthlyFlavor: true,
      monthlyFlavorLabel: 'This season',
    })
  })

  it('keeps always-available flavors buyable even outside the rotation', () => {
    const [poster] = applyRotationAvailability({
      activeRotation,
      posters: [makePoster({ individualAvailability: 'always', productId: 99 })],
    })

    expect(poster).toMatchObject({
      amount: '$7.00',
      canBuyIndividually: true,
      isMonthlyFlavor: false,
      monthlyFlavorLabel: 'Always available',
    })
  })

  it('locks rotation-scoped flavors that are not in the active rotation', () => {
    const [poster] = applyRotationAvailability({
      activeRotation,
      posters: [makePoster({ individualAvailability: 'rotation', productId: 99 })],
    })

    expect(poster).toMatchObject({
      amount: 'Catering only',
      canBuyIndividually: false,
      isMonthlyFlavor: false,
    })
  })

  it('orders rotation flavors first, in rotation order', () => {
    const posters = applyRotationAvailability({
      activeRotation,
      posters: [
        makePoster({ individualAvailability: 'always', productId: 99, slug: 'biscoff' }),
        makePoster({ productId: 20, slug: 'dirty-chai' }),
        makePoster({ productId: 10, slug: 'rice-krispy-mango' }),
      ],
    })

    expect(posters.map((poster) => poster.productId)).toEqual([10, 20, 99])
  })
})
