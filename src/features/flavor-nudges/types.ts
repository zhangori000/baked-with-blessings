import type { Media } from '@/payload-types'

export type NudgeFlavor = {
  fallbackSrc: string
  image: Media | null
  productId: number
  title: string
}

export type NudgeSummaryRow = {
  count: number
  emails: string[]
  lastNudgedAt: string
  productId: number
  title: string
}
