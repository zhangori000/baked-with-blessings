import type { Media } from '@/payload-types'

export const resolveMediaDisplayURL = (media?: Media | null): string | null => {
  if (!media) return null

  return (
    media.url ??
    media.sizes?.tablet?.url ??
    media.sizes?.poster?.url ??
    media.sizes?.card?.url ??
    media.thumbnailURL ??
    null
  )
}
