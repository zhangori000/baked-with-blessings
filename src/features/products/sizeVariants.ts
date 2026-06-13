import type { Variant, VariantOption } from '@/payload-types'

/**
 * The single variant axis used when customers order bakery items
 * individually. Centralized so a rename or a future second axis
 * (e.g. half-dozen packs) stays a one-file change instead of a
 * string hunt across the storefront, scripts, and tests.
 */
export const SIZE_VARIANT_TYPE = {
  label: 'Size',
  name: 'size',
} as const

export const SIZE_OPTIONS = [
  { label: 'Large', value: 'large' },
  { label: 'Mini', value: 'mini' },
] as const

export type SizeOptionValue = (typeof SIZE_OPTIONS)[number]['value']

/**
 * Default Mini price as a share of the Large price, rounded to the nearest
 * quarter. 0.6 mirrors the owner's own tray pricing (mini tray $3/cookie vs
 * jumbo tray $5/cookie).
 */
export const MINI_PRICE_RATIO = 0.6

export const roundToQuarter = (cents: number) => Math.round(cents / 25) * 25

export const defaultMiniPriceInUSD = (largePriceInUSD: number) =>
  roundToQuarter(largePriceInUSD * MINI_PRICE_RATIO)

const sizeDisplayOrder = new Map<string, number>(
  SIZE_OPTIONS.map((option, index) => [option.value, index]),
)

export type SizeVariantSummary = {
  id: number
  label: string
  priceInUSD: number
  value: string
}

const resolveOption = (
  option: number | VariantOption | null | undefined,
): VariantOption | null => (option && typeof option === 'object' ? option : null)

/**
 * First populated option on a variant. Size variants carry exactly one
 * option (their size), so this is the variant's size when present.
 */
export const resolveVariantSizeOption = (variant: Partial<Variant>): VariantOption | null => {
  const options = Array.isArray(variant.options) ? variant.options : []

  for (const option of options) {
    const resolved = resolveOption(option)

    if (resolved?.value) {
      return resolved
    }
  }

  return null
}

/**
 * Turns raw variant docs into the storefront's size list: priced, labeled,
 * and ordered Large-first. Variants without a resolvable option or a
 * positive price are dropped rather than rendered broken.
 */
export const summarizeSizeVariants = (variants: Partial<Variant>[]): SizeVariantSummary[] =>
  variants
    .map((variant) => {
      const option = resolveVariantSizeOption(variant)

      if (
        typeof variant.id !== 'number' ||
        !option ||
        typeof variant.priceInUSD !== 'number' ||
        variant.priceInUSD <= 0
      ) {
        return null
      }

      return {
        id: variant.id,
        label: option.label || option.value || 'Size',
        priceInUSD: variant.priceInUSD,
        value: option.value ?? '',
      }
    })
    .filter((summary): summary is SizeVariantSummary => Boolean(summary))
    .sort(
      (left, right) =>
        (sizeDisplayOrder.get(left.value) ?? Number.MAX_SAFE_INTEGER) -
        (sizeDisplayOrder.get(right.value) ?? Number.MAX_SAFE_INTEGER),
    )

/**
 * The size used when a surface adds to cart without asking (the rotations
 * carousel). Large is the bakery's base size; fall back to the first
 * available size so a mini-only product still works.
 */
export const pickDefaultSizeVariant = (
  sizes: SizeVariantSummary[],
): SizeVariantSummary | null => sizes.find((size) => size.value === 'large') ?? sizes[0] ?? null
