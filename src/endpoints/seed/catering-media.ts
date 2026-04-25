import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { File, Payload, PayloadRequest } from 'payload'

import type { Media } from '@/payload-types'

const cateringMediaSpec = {
  alt: 'April 2026 catering menu sheet featuring cookie trays, puddings, and focaccia.',
  filename: 'catering-menu-april-2026.png',
  slug: 'catering-menu-april-2026',
} as const

const requiredImageSizes = ['thumbnail', 'card', 'poster', 'tablet'] as const

type CateringMediaImportResult = {
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

export const importCateringMedia = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<CateringMediaImportResult> => {
  const mediaBySlug: Record<string, Media> = {}
  let created = 0
  let updated = 0
  let skipped = 0

  const existing = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    where: {
      filename: {
        equals: cateringMediaSpec.filename,
      },
    },
  })

  const existingMedia = existing.docs[0] as MediaWithSizes | undefined

  if (existingMedia) {
    const needsVariantRefresh = !mediaHasAllExpectedSizes(existingMedia)

    if (existingMedia.alt !== cateringMediaSpec.alt || needsVariantRefresh) {
      mediaBySlug[cateringMediaSpec.slug] = await payload.update({
        collection: 'media',
        data: {
          alt: cateringMediaSpec.alt,
        },
        depth: 0,
        file: await readPublicFile(cateringMediaSpec.filename),
        id: existingMedia.id,
        req,
      })
      updated += 1
      payload.logger.info(
        needsVariantRefresh
          ? `- Refreshed media and generated variants for ${cateringMediaSpec.filename}`
          : `- Updated media metadata for ${cateringMediaSpec.filename}`,
      )
    } else {
      mediaBySlug[cateringMediaSpec.slug] = existingMedia
      skipped += 1
      payload.logger.info(`- Reused existing media ${cateringMediaSpec.filename}`)
    }

    return {
      created,
      mediaBySlug,
      skipped,
      updated,
    }
  }

  mediaBySlug[cateringMediaSpec.slug] = await payload.create({
    collection: 'media',
    data: {
      alt: cateringMediaSpec.alt,
    },
    depth: 0,
    file: await readPublicFile(cateringMediaSpec.filename),
    req,
  })
  created += 1
  payload.logger.info(`- Imported media ${cateringMediaSpec.filename}`)

  return {
    created,
    mediaBySlug,
    skipped,
    updated,
  }
}
