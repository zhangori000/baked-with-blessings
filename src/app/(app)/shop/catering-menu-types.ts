import type { Media as MediaType } from '@/payload-types'

export type MenuSceneryTone =
  | 'dawn'
  | 'under-tree'
  | 'moonlit'
  | 'classic'
  | 'blossom'
  | 'fairy-castle'

export type SelectableFlavor = {
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
  summary: string
  title: string
}
