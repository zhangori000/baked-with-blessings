import type { Media } from '@/payload-types'

export const isPayloadMediaFileURL = (url?: string | null) => {
  if (!url) return false

  if (url.startsWith('/api/media/file/')) return true

  try {
    return new URL(url).pathname.startsWith('/api/media/file/')
  } catch {
    return false
  }
}

export const resolveMediaDisplayURL = (media?: Media | null): string | null => {
  if (!media) return null

  return (
    media.sizes?.tablet?.url ??
    media.sizes?.poster?.url ??
    media.sizes?.card?.url ??
    media.sizes?.thumbnail?.url ??
    media.thumbnailURL ??
    media.url ??
    null
  )
}
