import type { Media as MediaType } from '@/payload-types'

import type { CookieInfoRichText } from '@/features/products/cookieDisplayData'

export type MenuSceneryTone =
  | 'dawn'
  | 'under-tree'
  | 'moonlit'
  | 'classic'
  | 'blossom'
  | 'fairy-castle'
  | 'prehistoric'
  | 'undersea'

export type SelectableFlavor = {
  allergens?: string[]
  bodyFallbackSrc: string
  id: number
  image: MediaType | null
  infoButtonLabel?: string
  /**
   * True when this flavor is NOT individually available right now (not in the
   * active rotation). Rare flavors are excluded
   * from mix-and-match boxes and shown with a "Rare — trays only" badge in the
   * one-flavor binge trays, which are the only way to order them.
   */
  isRare?: boolean
  receiptBody?: CookieInfoRichText
  summary: string
  title: string
}

export type MenuSection = 'bundles' | 'catering' | 'regular'

/** A bundle the Regular-orders nudge can point a stocking-up customer toward. */
export type BundleSuggestion = {
  /** Cookies in the bundle (requiredSelectionCount), used for per-cookie math. */
  count: number | null
  price: number
  slug: string
  title: string
}

/**
 * Bundles offered to a customer who is stacking up single cookies. `large.boxes`
 * runs from the fewest cookies to the most, so the panel can offer the biggest
 * box the customer's quantity already fills.
 */
export type BundleSuggestions = {
  large: { boxes: BundleSuggestion[] }
  mini: { box: BundleSuggestion | null; tray: BundleSuggestion | null }
}

/**
 * 'scenery' = the full animated scene (sky, clouds, meadow, sheep, flowers)
 * as the panel container. 'tinted' = a clean container whose background is
 * tinted to the active scenery tone, with no decorative scene art (avoids
 * scenery-inside-scenery nesting). Flagged in catering-menu-section.client.
 */
export type MenuPanelBackdrop = 'scenery' | 'tinted'

export type RegularOrderSize = {
  label: string
  priceInUSD: number
  value: string
  /** Null only for the no-variant fallback, which adds the bare product. */
  variantId: null | number
}

export type RegularOrderItem = {
  allergens?: string[]
  badgeLabel: string
  bodyFallbackSrc: string
  /** Category tag for the row, e.g. "Cookie" or "Bread". */
  categoryLabel?: string
  /** Category slug, e.g. 'cookies' | 'breads'. Box deals apply to cookies only. */
  categorySlug?: string
  id: number
  image: MediaType | null
  infoButtonLabel?: string
  priceInUSD: null | number
  receiptBody?: CookieInfoRichText
  sizes: RegularOrderSize[]
  slug: string
  summary: string
  title: string
}
