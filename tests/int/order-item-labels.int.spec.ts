import { describe, expect, it } from 'vitest'

import type { Variant } from '@/payload-types'

import { getVariantDisplayLabel } from '@/utilities/email/orderItemLabels'

describe('getVariantDisplayLabel (receipt size labels)', () => {
  it('prefers populated option labels', () => {
    const variant = {
      options: [{ id: 2, label: 'Mini', value: 'mini', variantType: 1 }],
      title: "S'mores — Mini",
    } as Partial<Variant> as Variant

    expect(getVariantDisplayLabel("S'mores", variant)).toBe('Mini')
  })

  it('strips the product prefix from script-titled variants', () => {
    const variant = {
      options: [41],
      title: "S'mores — Mini",
    } as Partial<Variant> as Variant

    expect(getVariantDisplayLabel("S'mores", variant)).toBe('Mini')
  })

  it('keeps unrelated variant titles intact', () => {
    const variant = { options: [], title: 'Gift wrapped' } as Partial<Variant> as Variant

    expect(getVariantDisplayLabel("S'mores", variant)).toBe('Gift wrapped')
  })

  it('returns null without a variant or usable label', () => {
    expect(getVariantDisplayLabel("S'mores", null)).toBeNull()
    expect(
      getVariantDisplayLabel("S'mores", { options: [], title: '' } as Partial<Variant> as Variant),
    ).toBeNull()
  })
})
