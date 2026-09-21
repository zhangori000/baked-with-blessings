import { ensureShowcaseContainsPublicCookies } from '@/collections/FlavorRotations'
import { describe, expect, it } from 'vitest'

describe('cookie lineup admin helpers', () => {
  it('adds public Specials of the Week cookies to the considering list automatically', () => {
    const data = ensureShowcaseContainsPublicCookies({
      data: {
        individualFlavors: [3, 5],
        showcaseProducts: [1],
      },
      originalDoc: { individualFlavors: [9], showcaseProducts: [9] },
    } as never)

    expect(data).toMatchObject({
      individualFlavors: [3, 5],
      showcaseProducts: ['1', '3', '5'],
    })
  })

  it('uses the saved lineup when a partial save omits the public cookie field', () => {
    const data = ensureShowcaseContainsPublicCookies({
      data: { title: 'August cookies' },
      originalDoc: { individualFlavors: [8], showcaseProducts: [2] },
    } as never)

    expect(data).toMatchObject({
      showcaseProducts: ['2', '8'],
      title: 'August cookies',
    })
  })
})
