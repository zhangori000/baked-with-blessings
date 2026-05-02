import type { Category, Media } from '@/payload-types'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { File, Payload, RequiredDataFromCollectionSlug } from 'payload'

import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/*
 * Creates or updates a published 50-cent test product on /menu.
 *
 * Stripe's USD minimum charge is 50 cents, so this product uses
 * priceInUSD=50. The script is idempotent and does not reset products,
 * carts, orders, media, or categories.
 *
 * Local:
 *   pnpm bootstrap:test-product
 *
 * Hosted preview:
 *   pnpm exec vercel env run -e preview -- pnpm bootstrap:test-product
 *
 * Production is guarded because this creates a public purchasable product:
 *   BOOTSTRAP_TEST_PRODUCT_ALLOW_PRODUCTION=true pnpm exec vercel env run -e production -- pnpm bootstrap:test-product
 */

const TEST_PRODUCT_SLUG = 'stripe-test-cookie'
const TEST_PRODUCT_TITLE = 'Stripe Test Cookie'
const STRIPE_MINIMUM_USD_CENTS = 50
const TEST_PRODUCT_IMAGE = {
  alt: 'April 2026 catering menu sheet featuring cookie trays, puddings, and focaccia.',
  filename: 'stripe-test-cookie-menu-image.png',
  mimetype: 'image/png',
  sourceFilename: 'catering-menu-april-2026.png',
} as const
const deploymentEnv = process.env.VERCEL_ENV || 'local'
const allowProduction = process.env.BOOTSTRAP_TEST_PRODUCT_ALLOW_PRODUCTION === 'true'

if (deploymentEnv === 'production' && !allowProduction) {
  throw new Error(
    [
      'Refusing to create a public test product in production.',
      'Set BOOTSTRAP_TEST_PRODUCT_ALLOW_PRODUCTION=true only if you intentionally want a 50-cent dummy product visible on the live menu.',
    ].join('\n'),
  )
}

const destroyWithTimeout = async (destroy: () => Promise<void>) => {
  await Promise.race([
    destroy(),
    new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('Payload shutdown timed out after 2s. Forcing process exit.')
        resolve()
      }, 2000)
    }),
  ])
}

const getOrCreateCateringCategory = async (payload: Payload): Promise<Category> => {
  const existing = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: 'catering',
      },
    },
  })

  if (existing.docs[0]) {
    return existing.docs[0] as Category
  }

  return payload.create({
    collection: 'categories',
    data: {
      menuOrder: 5,
      slug: 'catering',
      title: 'Catering',
    },
    overrideAccess: true,
  }) as Promise<Category>
}

const readTestProductImage = async (): Promise<File> => {
  const data = await readFile(
    path.resolve(process.cwd(), 'public', TEST_PRODUCT_IMAGE.sourceFilename),
  )

  return {
    data,
    mimetype: TEST_PRODUCT_IMAGE.mimetype,
    name: TEST_PRODUCT_IMAGE.filename,
    size: data.byteLength,
  }
}

const findMediaByFilename = async (payload: Payload, filename: string) => {
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      filename: {
        equals: filename,
      },
    },
  })

  return result.docs[0] as Media | undefined
}

const findOrCreateReusableMedia = async (payload: Payload): Promise<Media> => {
  const seededImage = await findMediaByFilename(payload, TEST_PRODUCT_IMAGE.sourceFilename)

  if (seededImage) {
    return seededImage
  }

  const existingTestImage = await findMediaByFilename(payload, TEST_PRODUCT_IMAGE.filename)

  if (existingTestImage) {
    return existingTestImage
  }

  const fallback = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    sort: 'createdAt',
  })

  if (fallback.docs[0]) {
    return fallback.docs[0] as Media
  }

  return payload.create({
    collection: 'media',
    data: {
      alt: TEST_PRODUCT_IMAGE.alt,
    },
    depth: 0,
    file: await readTestProductImage(),
    overrideAccess: true,
  }) as Promise<Media>
}

const buildProductData = ({
  category,
  image,
}: {
  category: Category
  image: Media
}): RequiredDataFromCollectionSlug<'products'> => ({
  _status: 'published',
  categories: [category.id],
  description: {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Dummy checkout item for confirming the Stripe payment flow end to end.',
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  },
  gallery: [{ image: image.id }],
  inventory: 999,
  layout: [],
  menuBehavior: 'simple',
  menuExpandedPitch: {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'This is a test-only product for validating checkout at Stripe\'s USD minimum charge.',
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  },
  menuPortionLabel: '1 test item',
  meta: {
    description: 'A 50-cent dummy product for testing Stripe checkout.',
    image: image.id,
    title: `${TEST_PRODUCT_TITLE} | Baked with Blessings`,
  },
  priceInUSD: STRIPE_MINIMUM_USD_CENTS,
  priceInUSDEnabled: true,
  relatedProducts: [],
  slug: TEST_PRODUCT_SLUG,
  title: TEST_PRODUCT_TITLE,
})

const bootstrap = async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  try {
    const category = await getOrCreateCateringCategory(payload)
    const image = await findOrCreateReusableMedia(payload)
    const data = buildProductData({ category, image })

    const existing = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        slug: {
          equals: TEST_PRODUCT_SLUG,
        },
      },
    })

    if (existing.docs[0]?.id) {
      const product = await payload.update({
        id: existing.docs[0].id,
        collection: 'products',
        data,
        overrideAccess: true,
      })

      console.log(`Updated ${product.title} (${TEST_PRODUCT_SLUG}) at $0.50.`)
      return
    }

    const product = await payload.create({
      collection: 'products',
      data,
      overrideAccess: true,
    })

    console.log(`Created ${product.title} (${TEST_PRODUCT_SLUG}) at $0.50.`)
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void bootstrap()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
