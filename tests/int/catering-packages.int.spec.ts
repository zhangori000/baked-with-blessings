import { describe, expect, it } from 'vitest'

import { groupCateringPackages } from '@/app/(app)/menu/_components/catering-packages-panel'
import { resolveCateringStep } from '@/features/products/cateringPackages'

describe('resolveCateringStep', () => {
  it('uses the shared divisor of a package group', () => {
    expect([18, 36, 60].map((capacity) => resolveCateringStep(capacity, [18, 36, 60]))).toEqual([
      6, 6, 6,
    ])
    expect([30, 60, 100].map((capacity) => resolveCateringStep(capacity, [30, 60, 100]))).toEqual([
      10, 10, 10,
    ])
  })

  it('falls back to a divisor that leaves at least three picks', () => {
    expect(resolveCateringStep(24)).toBe(6)
    expect(resolveCateringStep(7)).toBe(1)
    expect(resolveCateringStep(0)).toBe(1)
  })
})

describe('groupCateringPackages', () => {
  it('groups by title prefix, puts minis first, and sorts rows by size', () => {
    const groups = groupCateringPackages([
      { requiredSelectionCount: 100, title: 'Mini Cookies — 100 Minis' },
      { requiredSelectionCount: 36, title: 'Full-Size Cookies — 36 Cookies' },
      { requiredSelectionCount: 18, title: 'Full-Size Cookies — 18 Cookies' },
      { requiredSelectionCount: 30, title: 'Mini Cookies — 30 Minis' },
    ])

    expect(groups.map((group) => group.heading)).toEqual(['Mini Cookies', 'Full-Size Cookies'])
    expect(groups[0]?.rows.map((row) => [row.rowTitle, row.step])).toEqual([
      ['30 Minis', 10],
      ['100 Minis', 10],
    ])
    expect(groups[1]?.rows.map((row) => row.rowTitle)).toEqual(['18 Cookies', '36 Cookies'])
  })
})
