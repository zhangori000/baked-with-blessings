import type { Variant } from '@/payload-types'

/**
 * Short, human label for an order line's variant ("Mini", "Large").
 * Prefers the populated option labels; falls back to the variant title with
 * the product prefix stripped, so receipts read "S'mores (Mini)" instead of
 * "S'mores (S'mores — Mini)".
 */
export const getVariantDisplayLabel = (
  productTitle: null | string | undefined,
  variant: null | Variant | undefined,
): null | string => {
  if (!variant) {
    return null
  }

  const optionLabels = (Array.isArray(variant.options) ? variant.options : [])
    .map((option) =>
      option && typeof option === 'object' && option.label?.trim() ? option.label.trim() : null,
    )
    .filter((label): label is string => Boolean(label))

  if (optionLabels.length > 0) {
    return optionLabels.join(', ')
  }

  const variantTitle = variant.title?.trim()

  if (!variantTitle) {
    return null
  }

  const trimmedProductTitle = productTitle?.trim()
  const prefix = trimmedProductTitle ? `${trimmedProductTitle} — ` : null

  return prefix && variantTitle.startsWith(prefix)
    ? variantTitle.slice(prefix.length)
    : variantTitle
}
