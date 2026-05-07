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
