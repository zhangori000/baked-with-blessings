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
  summary: string
  title: string
}
