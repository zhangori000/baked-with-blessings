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
  receiptBody?: CookieInfoRichText
  summary: string
  title: string
}

export type MenuSection = 'catering' | 'regular'

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
