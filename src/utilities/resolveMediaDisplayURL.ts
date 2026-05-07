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

export const withPayloadMediaCacheTag = ({
  media,
  url,
}: {
  media?: Media | null
  url?: null | string
}) => {
  if (!url || !isPayloadMediaFileURL(url)) return url ?? null

  const version = [media?.updatedAt, media?.filesize].filter(Boolean).join('-')

  if (!version) return url

  const separator = url.includes('?') ? '&' : '?'

  return `${url}${separator}v=${encodeURIComponent(version)}`
}

export const resolveMediaDisplayURL = (media?: Media | null): string | null => {
  if (!media) return null

  const url =
    media.sizes?.tablet?.url ??
    media.sizes?.poster?.url ??
    media.sizes?.card?.url ??
    media.sizes?.thumbnail?.url ??
    media.thumbnailURL ??
    media.url ??
    null

  return withPayloadMediaCacheTag({ media, url })
}
