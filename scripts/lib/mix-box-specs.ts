/**
 * The "Build-Your-Own" mix-and-match boxes, as data. `scripts/seed-mix-boxes.ts`
 * writes them to the database, and `tests/int/price-ladder.int.spec.ts` checks
 * them against the single-cookie price and the catering packages.
 *
 * Prices are in cents. Every bigger box must cost less per cookie than the one
 * before it; see `documentation/pricing.md`.
 */
export type MixBoxSpec = {
  capacity: number
  pitchParagraphs: string[]
  portionLabel: string
  priceCents: number
  slug: string
  title: string
  unit: 'large' | 'mini'
}

export const MIX_BOX_SPECS: MixBoxSpec[] = [
  {
    capacity: 6,
    pitchParagraphs: [
      'Build a box of six mini cookies and mix the flavors however you like — all six the same or six different, your call.',
      'Add the box to your cart, then build another. Each box is its own order line, so the kitchen sees exactly which minis to bake.',
    ],
    portionLabel: '6 mini cookies · mix & match',
    priceCents: 1000,
    slug: 'build-your-own-mini-box',
    title: 'Build-Your-Own Mini Box',
    unit: 'mini',
  },
  {
    capacity: 3,
    pitchParagraphs: [
      'Build a box of three full-size cookies and mix the flavors however you like — one of each or three of a favorite.',
      'Add the box to your cart, then build another. Each box is its own order line, so the kitchen knows exactly what to bake.',
    ],
    portionLabel: '3 large cookies · mix & match',
    priceCents: 1100,
    slug: 'build-your-own-cookie-box',
    title: 'Build-Your-Own Cookie Box',
    unit: 'large',
  },
]
