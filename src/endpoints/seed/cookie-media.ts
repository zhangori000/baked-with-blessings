import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { File, Payload, PayloadRequest } from 'payload'

import type { Media } from '@/payload-types'

import { cookieCatalog } from './cookie-catalog'

const requiredImageSizes = ['thumbnail', 'card', 'poster', 'tablet'] as const

type CookieMediaImportResult = {
  created: number
  mediaBySlug: Record<string, Media>
  skipped: number
  updated: number
}

type MediaWithSizes = Media & {
  sizes?: Partial<Record<(typeof requiredImageSizes)[number], unknown>> | null
}

const getMimeType = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase() || 'png'

  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg'
  }

  if (extension === 'svg') {
    return 'image/svg+xml'
  }

  return `image/${extension}`
}

const readPublicFile = async (filename: string): Promise<File> => {
  const filePath = path.resolve(process.cwd(), 'public', filename)
  const data = await readFile(filePath)

  return {
    data,
    mimetype: getMimeType(filename),
    name: filename,
    size: data.byteLength,
  }
}

const mediaHasAllExpectedSizes = (media: MediaWithSizes) => {
  const sizes = media.sizes

  if (!sizes || typeof sizes !== 'object') {
    return false
  }

  return requiredImageSizes.every((sizeName) => Boolean(sizes[sizeName]))
}

export const importCookieMedia = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<CookieMediaImportResult> => {
  const mediaBySlug: Record<string, Media> = {}
  let created = 0
  let updated = 0
  let skipped = 0

  for (const spec of cookieCatalog) {
    const existing = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        filename: {
          equals: spec.sourceFilename,
        },
      },
    })

    const existingMedia = existing.docs[0] as MediaWithSizes | undefined

    if (existingMedia) {
      const needsVariantRefresh = !mediaHasAllExpectedSizes(existingMedia)

      if (existingMedia.alt !== spec.mediaAlt || needsVariantRefresh) {
        mediaBySlug[spec.slug] = await payload.update({
          collection: 'media',
          data: {
            alt: spec.mediaAlt,
          },
          depth: 0,
          file: await readPublicFile(spec.sourceFilename),
          id: existingMedia.id,
          req,
        })
        updated += 1
        payload.logger.info(
          needsVariantRefresh
            ? `- Refreshed media and generated variants for ${spec.sourceFilename}`
            : `- Updated media metadata for ${spec.sourceFilename}`,
        )
      } else {
        mediaBySlug[spec.slug] = existingMedia
        skipped += 1
        payload.logger.info(`- Reused existing media ${spec.sourceFilename}`)
      }

      continue
    }

    mediaBySlug[spec.slug] = await payload.create({
      collection: 'media',
      data: {
        alt: spec.mediaAlt,
      },
      depth: 0,
      file: await readPublicFile(spec.sourceFilename),
      req,
    })
    created += 1
    payload.logger.info(`- Imported media ${spec.sourceFilename}`)
  }

  return {
    created,
    mediaBySlug,
    skipped,
    updated,
  }
}
