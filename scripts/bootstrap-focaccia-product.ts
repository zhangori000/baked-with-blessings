import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { File, Payload } from 'payload'

import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/*
 * Creates/updates the "Roasted Pesto Focaccia" single ($7) featured as a
 * Special of the Week. Idempotent and re-run safe.
 *
 * The rig image (gallery[0] — what the sheep rig and every card show) comes from
 * a /public PNG. Default is the friendly placeholder; pass `cutout` to switch to
 * the approved background-removed photo:
 *
 *   pnpm bootstrap:focaccia            # placeholder rig image
 *   pnpm bootstrap:focaccia cutout     # approved cut-out
 *
 * The two real photos (the focaccia + the focaccia-with-sauce shots) are
 * appended to the gallery for "See photos", uploaded from /public when present.
 *
 * Placement, the Large/Mini sizes, and rotation membership are set afterwards by
 * `pnpm update:flavor-lineup` (focaccia is listed in its seasonal lineup).
 *
 * LOCAL ONLY. Hosted content is owner-managed; do not point this at prod.
 */

const SLUG = 'roasted-pesto-focaccia'
const TITLE = 'Roasted Pesto Focaccia'
const PRICE_IN_USD = 700 // $7 single (tentative — owner confirming)
const SUMMARY =
  'Golden focaccia with a roasted pesto crust — crisp, cheesy edges and a soft, airy middle.'

const RIG_SOURCES = {
  cutout: {
    alt: 'Roasted pesto focaccia',
    filename: 'roasted-pesto-focaccia-cutout.png',
  },
  placeholder: {
    alt: 'Roasted pesto focaccia — photo coming soon',
    filename: 'roasted-pesto-focaccia-placeholder.png',
  },
} as const

// Real photos preserved in the gallery for "See photos", uploaded from /public.
// On hosted envs the owner's matching media already exist (matched by filename).
const GALLERY_PHOTOS = [
  { alt: 'Angie holding the roasted pesto focaccia', filename: 'roasted-pesto-focaccia.jpeg' },
  {
    alt: 'Angie holding the roasted pesto focaccia with dipping sauce',
    filename: 'focaccia-with-sauce.jpeg',
  },
]

const rigChoice = (process.argv[2] as keyof typeof RIG_SOURCES) || 'placeholder'
const rig = RIG_SOURCES[rigChoice] ?? RIG_SOURCES.placeholder

const destroyWithTimeout = async (destroy: () => Promise<void>) => {
  await Promise.race([destroy(), new Promise<void>((resolve) => setTimeout(resolve, 2000))])
}

const paragraph = (text: string) => ({
  children: [{ detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 }],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  type: 'paragraph' as const,
  version: 1,
})

const richText = (text: string) => ({
  root: {
    children: [paragraph(text)],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
})

const mimeForFilename = (filename: string): string =>
  /\.png$/i.test(filename)
    ? 'image/png'
    : /\.jpe?g$/i.test(filename)
      ? 'image/jpeg'
      : /\.webp$/i.test(filename)
        ? 'image/webp'
        : 'application/octet-stream'

const readPublicImage = async (filename: string): Promise<File | null> => {
  try {
    const data = await readFile(path.resolve(process.cwd(), 'public', filename))
    return { data, mimetype: mimeForFilename(filename), name: filename, size: data.byteLength }
  } catch {
    return null
  }
}

const findMediaByFilename = async (payload: Payload, filename: string) => {
  const res = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { filename: { equals: filename } },
  })
  return res.docs[0]
}

// Reuse a media doc by filename, else upload it from /public when the file is
// present. Returns null when neither exists, so a missing photo just gets skipped.
const findOrUploadMedia = async (payload: Payload, filename: string, alt: string) => {
  const existing = await findMediaByFilename(payload, filename)
  if (existing) {
    return existing
  }
  const file = await readPublicImage(filename)
  if (!file) {
    return null
  }
  return payload.create({ collection: 'media', data: { alt }, file, overrideAccess: true })
}

const run = async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  try {
    // Breads category: rotation-eligible (not catering) but NOT cookies, so the
    // size-variant automation skips it (single price) and it never lands in the
    // build-your-own cookie boxes. Created if it does not exist yet.
    const cat = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: 'breads' } },
    })
    const categoryId =
      cat.docs[0]?.id ??
      (
        await payload.create({
          collection: 'categories',
          data: { menuOrder: 1, slug: 'breads', title: 'Breads' },
          overrideAccess: true,
        })
      ).id

    // Rig image (gallery[0]). Always re-upload from /public so re-running picks
    // up image tweaks; delete any prior copy first so the rig never goes stale.
    const rigFile = await readPublicImage(rig.filename)
    if (!rigFile) {
      throw new Error(`Rig image /public/${rig.filename} is missing.`)
    }
    const priorRig = await findMediaByFilename(payload, rig.filename)
    if (priorRig) {
      await payload.delete({ collection: 'media', id: priorRig.id, overrideAccess: true })
    }
    const rigMedia = await payload.create({
      collection: 'media',
      data: { alt: rig.alt },
      file: rigFile,
      overrideAccess: true,
    })

    // Real photos preserved for "See photos".
    const photoImages: { image: number }[] = []
    for (const photo of GALLERY_PHOTOS) {
      const media = await findOrUploadMedia(payload, photo.filename, photo.alt)
      if (media) {
        photoImages.push({ image: Number(media.id) })
      } else {
        payload.logger.warn(`- ${photo.filename} not found in /public (skipping)`)
      }
    }

    const gallery = [{ image: Number(rigMedia.id) }, ...photoImages]

    const data = {
      _status: 'published' as const,
      categories: [Number(categoryId)],
      description: richText(SUMMARY),
      gallery,
      inventory: 999,
      layout: [],
      menuBehavior: 'simple' as const,
      menuExpandedPitch: richText(
        'A shareable slab of focaccia with a roasted pesto crust — grab a single piece here, or a full tray from the catering menu.',
      ),
      menuPortionLabel: 'One focaccia',
      meta: {
        description: SUMMARY,
        image: Number(rigMedia.id),
        title: `${TITLE} | Baked with Blessings`,
      },
      priceInUSD: PRICE_IN_USD,
      priceInUSDEnabled: true,
      relatedProducts: [],
      title: TITLE,
    }

    const existing = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: SLUG } },
    })

    const product = existing.docs[0]?.id
      ? await payload.update({
          id: existing.docs[0].id,
          collection: 'products',
          data,
          overrideAccess: true,
        })
      : await payload.create({
          collection: 'products',
          data: { ...data, slug: SLUG },
          overrideAccess: true,
        })

    // Single size: focaccia is a bread, not a cookie, so strip any Large/Mini
    // variants left from when it lived in the Cookies category and turn the
    // variant flag off, so it sells at its one base price.
    const staleVariants = await payload.find({
      collection: 'variants',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      pagination: false,
      where: { product: { equals: product.id } },
    })
    for (const variant of staleVariants.docs) {
      await payload.delete({ collection: 'variants', id: variant.id, overrideAccess: true })
    }
    if (staleVariants.docs.length > 0) {
      await payload.update({
        collection: 'products',
        data: { enableVariants: false, variantTypes: [] },
        id: product.id,
        overrideAccess: true,
      })
    }

    console.log(
      `Upserted ${product.title} (${SLUG}) — rig=${rigChoice}, gallery=${gallery.length}, removed ${staleVariants.docs.length} variant(s)`,
    )
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
