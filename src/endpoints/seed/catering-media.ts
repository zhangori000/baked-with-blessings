import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { File, Payload, PayloadRequest } from 'payload'

import type { Media } from '@/payload-types'

import { clearSeedMediaBlobs } from './blob-media'

type CateringMediaSpec = {
  alt: string
  filename: string
  slug: string
  sourcePath?: string
}

const cateringMediaSpecs: CateringMediaSpec[] = [
  {
    alt: 'April 2026 catering menu sheet featuring cookie trays, puddings, and focaccia.',
    filename: 'catering-menu-april-2026.png',
    slug: 'catering-menu-april-2026',
  },
  {
    alt: 'baked-with-blessings-box-in-sun',
    filename: 'baked-with-blessings-box-in-sun.png',
    slug: 'baked-with-blessings-box-in-sun',
    sourcePath: 'catering/trays/baked-with-blessings-box-in-sun.png',
  },
  {
    alt: 'banana pudding close up view',
    filename: 'banana-pudding-close-up.jpeg',
    slug: 'banana-pudding-close-up',
    sourcePath: 'catering/puddings/banana-pudding-close-up.jpeg',
  },
  {
    alt: 'banana pudding laid out on a cutting board',
    filename: 'banana-pudding-tray.jpeg',
    slug: 'banana-pudding-tray',
    sourcePath: 'catering/puddings/banana-pudding-tray.jpeg',
  },
  {
    alt: 'singular sticky toffee pudding pour over',
    filename: 'sticky-toffee-pudding.jpeg',
    slug: 'sticky-toffee-pudding',
    sourcePath: 'catering/puddings/sticky-toffee-pudding.jpeg',
  },
  {
    alt: 'cookie tray at church',
    filename: 'IMG_0403.webp',
    slug: 'img-0403',
    sourcePath: 'catering/trays/IMG_0403.webp',
  },
  {
    alt: 'cookie tray at church',
    filename: 'IMG_0404.webp',
    slug: 'img-0404',
    sourcePath: 'catering/trays/IMG_0404.webp',
  },
  {
    alt: 'Strawberry cheesecake cookie tray diagonal view along cutting board',
    filename: 'IMG_4883.webp',
    slug: 'img-4883',
    sourcePath: 'catering/trays/IMG_4883.webp',
  },
  {
    alt: 'biscoff cookie tray diagonal view',
    filename: 'IMG_4887.webp',
    slug: 'img-4887',
    sourcePath: 'catering/trays/IMG_4887.webp',
  },
  {
    alt: 'Biscoff cookie tray diagonal view',
    filename: 'IMG_4891.webp',
    slug: 'img-4891',
    sourcePath: 'catering/trays/IMG_4891.webp',
  },
  {
    alt: 'strawberry cheesecake cookie tray multiple sizes',
    filename: 'IMG_4896.webp',
    slug: 'img-4896',
    sourcePath: 'catering/trays/IMG_4896.webp',
  },
  {
    alt: 'Strawberry cheesecake cookie tray angled view',
    filename: 'IMG_4898.webp',
    slug: 'img-4898',
    sourcePath: 'catering/trays/IMG_4898.webp',
  },
  {
    alt: 'Strawberry cheesecake cookie tray',
    filename: 'IMG_4902.webp',
    slug: 'img-4902',
    sourcePath: 'catering/trays/IMG_4902.webp',
  },
  {
    alt: 'salted caramel nest cookie tray',
    filename: 'IMG_4903.webp',
    slug: 'img-4903',
    sourcePath: 'catering/trays/IMG_4903.webp',
  },
  {
    alt: 'caramel nest tray',
    filename: 'IMG_4904.webp',
    slug: 'img-4904',
    sourcePath: 'catering/trays/IMG_4904.webp',
  },
  {
    alt: 'strawberry cheesecake cookie tray, biscoff cookie tray, and banana pudding diagonal view',
    filename: 'IMG_4919.webp',
    slug: 'img-4919',
    sourcePath: 'catering/trays/IMG_4919.webp',
  },
]

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

const readPublicFile = async (spec: CateringMediaSpec): Promise<File> => {
  const filePath = path.resolve(process.cwd(), 'public', spec.sourcePath ?? spec.filename)
  const data = await readFile(filePath)

  return {
    data,
    mimetype: getMimeType(spec.filename),
    name: spec.filename,
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

  for (const spec of cateringMediaSpecs) {
    const existing = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        filename: {
          equals: spec.filename,
        },
      },
    })

    const existingMedia = existing.docs[0] as MediaWithSizes | undefined

    if (existingMedia) {
      const needsVariantRefresh = !mediaHasAllExpectedSizes(existingMedia)

      if (needsVariantRefresh) {
        await clearSeedMediaBlobs({
          filename: existingMedia.filename || spec.filename,
          payload,
        })

        mediaBySlug[spec.slug] = await payload.update({
          collection: 'media',
          data: {
            alt: spec.alt,
          },
          depth: 0,
          file: await readPublicFile(spec),
          id: existingMedia.id,
          req,
        })
        updated += 1
        payload.logger.info(`- Refreshed media and generated variants for ${spec.filename}`)

        continue
      }

      if (existingMedia.alt !== spec.alt) {
        mediaBySlug[spec.slug] = await payload.update({
          collection: 'media',
          data: {
            alt: spec.alt,
          },
          depth: 0,
          id: existingMedia.id,
          req,
        })
        updated += 1
        payload.logger.info(`- Updated media metadata for ${spec.filename}`)

        continue
      }

      mediaBySlug[spec.slug] = existingMedia
      skipped += 1
      payload.logger.info(`- Reused existing media ${spec.filename}`)

      continue
    }

    await clearSeedMediaBlobs({
      filename: spec.filename,
      payload,
    })

    mediaBySlug[spec.slug] = await payload.create({
      collection: 'media',
      data: {
        alt: spec.alt,
      },
      depth: 0,
      file: await readPublicFile(spec),
      req,
    })
    created += 1
    payload.logger.info(`- Imported media ${spec.filename}`)
  }

  return {
    created,
    mediaBySlug,
    skipped,
    updated,
  }
}
