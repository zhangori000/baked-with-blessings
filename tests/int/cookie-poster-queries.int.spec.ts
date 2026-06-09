import { describe, expect, it } from 'vitest'

import { getPublicRotationProductIDs } from '@/app/(app)/cookiePosterQueries'

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
