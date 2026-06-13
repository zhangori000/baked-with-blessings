import type { Media as MediaType } from '@/payload-types'

import type { CookieInfoRichText } from '@/features/products/cookieDisplayData'

export type MenuSceneryTone =
  | 'dawn'
  | 'under-tree'
  | 'moonlit'
  | 'classic'
  | 'blossom'
  | 'fairy-castle'

export type SelectableFlavor = {
  allergens?: string[]
  bodyFallbackSrc: string
  id: number
  image: MediaType | null
  infoButtonLabel?: string
  /**
   * True when this flavor is NOT individually available right now (not on the
   * standing menu and not in the active rotation). Rare flavors are excluded
   * from mix-and-match boxes and shown with a "Rare — trays only" badge in the
   * one-flavor binge trays, which are the only way to order them.
   */
  isRare?: boolean
  receiptBody?: CookieInfoRichText
  summary: string
  title: string
}

export type MenuSection = 'catering' | 'regular'

/** A bundle the Regular-orders nudge can point a stocking-up customer toward. */
export type BundleSuggestion = {
  /** Cookies in the bundle (requiredSelectionCount), used for per-cookie math. */
  count: number | null
  price: number
  slug: string
  title: string
}

/** Per-size bundle options: a 4-pack mix box and a 10-pack one-flavor tray. */
export type BundleSuggestions = {
  large: { box: BundleSuggestion | null; tray: BundleSuggestion | null }
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
  /** 'seasonal' = featured in the active rotation; 'always' = standing menu. */
  availability: 'always' | 'seasonal'
  badgeLabel: string
  bodyFallbackSrc: string
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
