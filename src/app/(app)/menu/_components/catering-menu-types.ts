import type { Media as MediaType } from '@/payload-types'

import type { CookieInfoRichText } from './cookiePosterData'

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
  ingredients: Array<{
    detail?: string
    name: string
  }>
  ingredientsIntro?: string
  ingredientsNoteTitle?: string
  receiptBody?: CookieInfoRichText
  summary: string
  title: string
}
