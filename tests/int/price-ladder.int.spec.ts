import { describe, expect, it } from 'vitest'

import { defaultCookiePriceInUSD } from '@/endpoints/seed/cookie-catalog'

import { CATERING_PACKAGE_SPECS } from '../../scripts/lib/catering-package-specs'
import { MIX_BOX_SPECS } from '../../scripts/lib/mix-box-specs'

// Large cookies are sold singly, so the single price is the top of their ladder.
// Minis are only sold in boxes, so their ladder starts at the Mini Box.
const MAX_LARGE_DISCOUNT = 0.45

type Rung = { count: number; label: string; priceCents: number }

const rungsFor = (unit: 'large' | 'mini'): Rung[] =>
  [
    ...MIX_BOX_SPECS.filter((spec) => spec.unit === unit),
    ...CATERING_PACKAGE_SPECS.filter((spec) => spec.unit === unit),
  ]
    .map((spec) => ({ count: spec.capacity, label: spec.title, priceCents: spec.priceCents }))
    .sort((left, right) => left.count - right.count)

const perCookie = (rung: Rung) => rung.priceCents / rung.count

const expectCheaperAsOrdersGrow = (ladder: Rung[]) => {
  ladder.slice(1).forEach((rung, index) => {
    const smaller = ladder[index]

    expect(
      perCookie(rung),
      `${rung.label} should cost less per cookie than ${smaller.label}`,
    ).toBeLessThan(perCookie(smaller))
  })
}

describe('price ladder', () => {
  it('charges less per large cookie at every bigger size, starting from a single', () => {
    const single = { count: 1, label: 'A single large cookie', priceCents: defaultCookiePriceInUSD }

    expectCheaperAsOrdersGrow([single, ...rungsFor('large')])
  })

  it('never takes more than 45% off the single large-cookie price', () => {
    for (const rung of rungsFor('large')) {
      const discount = 1 - perCookie(rung) / defaultCookiePriceInUSD

      expect(discount, `${rung.label} discount`).toBeLessThanOrEqual(MAX_LARGE_DISCOUNT + 1e-9)
    }
  })

  it('charges less per mini at every bigger size', () => {
    expectCheaperAsOrdersGrow(rungsFor('mini'))
  })
})
