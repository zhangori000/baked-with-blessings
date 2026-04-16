import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { CollectionSlug, File, Payload, PayloadRequest } from 'payload'

import { Address, type Product, Transaction } from '@/payload-types'

import { cafeCatalog, cafeCategories, buildCafeProductData } from './cafe-products'
import { contactFormData } from './contact-form'
import { contactPageData } from './contact-page'
import { homePageData } from './home'
import { imageHatData } from './image-hat'
import { imageHero1Data } from './image-hero-1'
import { imageTshirtBlackData } from './image-tshirt-black'
import { imageTshirtWhiteData } from './image-tshirt-white'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'products',
  'forms',
  'form-submissions',
  'variants',
  'variantOptions',
  'variantTypes',
  'carts',
  'transactions',
  'addresses',
  'orders',
]

const baseAddressUSData: Transaction['billingAddress'] = {
  title: 'Dr.',
  firstName: 'Otto',
  lastName: 'Octavius',
  phone: '1234567890',
  company: 'Oscorp',
  addressLine1: '123 Main St',
  addressLine2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
}

const baseAddressUKData: Transaction['billingAddress'] = {
  title: 'Mr.',
  firstName: 'Oliver',
  lastName: 'Twist',
  phone: '1234567890',
  addressLine1: '48 Great Portland St',
  city: 'London',
  postalCode: 'W1W 7ND',
  country: 'GB',
}

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')
  payload.logger.info(`— Clearing collections and globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [],
      },
      depth: 0,
      context: {
        disableRevalidate: true,
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [],
      },
      depth: 0,
      context: {
        disableRevalidate: true,
      },
    }),
  ])

  for (const collection of collections) {
    await payload.db.deleteMany({ collection, req, where: {} })
    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }

  payload.logger.info(`— Seeding customer and customer data...`)

  await payload.delete({
    collection: 'customers',
    depth: 0,
    where: {
      email: {
        equals: 'customer@example.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [imageHatBuffer, imageTshirtBlackBuffer, imageTshirtWhiteBuffer, heroBuffer] =
    await Promise.all([
      readSeedFile('hat-logo.png'),
      readSeedFile('tshirt-black.png'),
      readSeedFile('tshirt-white.png'),
      readSeedFile('tshirt-white.png'),
    ])

  const [customer, imageHat, imageTshirtBlack, imageTshirtWhite, imageHero] = await Promise.all([
    payload.create({
      collection: 'customers',
      data: {
        name: 'Customer',
        email: 'customer@example.com',
        password: 'password',
      },
    }),
    payload.create({
      collection: 'media',
      data: imageHatData,
      file: imageHatBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageTshirtBlackData,
      file: imageTshirtBlackBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageTshirtWhiteData,
      file: imageTshirtWhiteBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1Data,
      file: heroBuffer,
    }),
  ])

  payload.logger.info(`— Seeding categories...`)

  const categoryDocs = await Promise.all(
    cafeCategories.map((category) =>
      payload.create({
        collection: 'categories',
        data: category,
      }),
    ),
  )

  const categoryBySlug = Object.fromEntries(categoryDocs.map((category) => [category.slug, category]))
  const imageByKey = {
    black: imageTshirtBlack,
    hat: imageHat,
    hero: imageHero,
    white: imageTshirtWhite,
  }

  payload.logger.info(`— Seeding products...`)

  const createdProducts: Record<string, Pick<Product, 'id' | 'slug'>> = {}

  for (const [key, spec] of Object.entries(cafeCatalog)) {
    const categories = spec.categorySlugs.map((slug) => categoryBySlug[slug]).filter(Boolean)
    const image = imageByKey[spec.imageKey]

    createdProducts[key] = await payload.create({
      collection: 'products',
      depth: 0,
      data: buildCafeProductData({
        spec,
        galleryImage: image,
        metaImage: image,
        categories,
      }),
    })
  }

  await Promise.all([
    payload.update({
      collection: 'products',
      id: createdProducts.roseCardamomLatte.id,
      data: {
        relatedProducts: [
          createdProducts.brownButterChocolateChipCookies.id,
          createdProducts.blessingBites.id,
        ],
      },
    }),
    payload.update({
      collection: 'products',
      id: createdProducts.strawberryMatchaCloud.id,
      data: {
        relatedProducts: [
          createdProducts.brownButterChocolateChipCookies.id,
          createdProducts.pistachioCelebrationCakeSlice.id,
        ],
      },
    }),
    payload.update({
      collection: 'products',
      id: createdProducts.vietnameseCoffee.id,
      data: {
        relatedProducts: [
          createdProducts.caramelPretzelDip.id,
          createdProducts.rosemaryFocacciaLoaf.id,
        ],
      },
    }),
    payload.update({
      collection: 'products',
      id: createdProducts.slowRoastedTomatoPasta.id,
      data: {
        relatedProducts: [
          createdProducts.rosemaryFocacciaLoaf.id,
          createdProducts.pistachioCelebrationCakeSlice.id,
        ],
      },
    }),
  ])

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData(),
  })

  payload.logger.info(`— Seeding pages...`)

  await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: homePageData({
        contentImage: imageHero,
        metaImage: imageHero,
      }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({
        contactForm: contactForm,
      }),
    }),
  ])

  payload.logger.info(`— Seeding addresses...`)

  await Promise.all([
    payload.create({
      collection: 'addresses',
      depth: 0,
      data: {
        customer: customer.id,
        ...(baseAddressUSData as Address),
      },
    }),
    payload.create({
      collection: 'addresses',
      depth: 0,
      data: {
        customer: customer.id,
        ...(baseAddressUKData as Address),
      },
    }),
  ])

  payload.logger.info(`— Seeding transactions...`)

  const [pendingTransaction, succeededTransaction] = await Promise.all([
    payload.create({
      collection: 'transactions',
      data: {
        currency: 'USD',
        customer: customer.id,
        paymentMethod: 'stripe',
        stripe: {
          customerID: 'cus_123',
          paymentIntentID: 'pi_123',
        },
        status: 'pending',
        billingAddress: baseAddressUSData,
      },
    }),
    payload.create({
      collection: 'transactions',
      data: {
        currency: 'USD',
        customer: customer.id,
        paymentMethod: 'stripe',
        stripe: {
          customerID: 'cus_123',
          paymentIntentID: 'pi_123',
        },
        status: 'succeeded',
        billingAddress: baseAddressUSData,
      },
    }),
  ])

  payload.logger.info(`— Seeding carts...`)

  await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'USD',
      items: [
        {
          product: createdProducts.roseCardamomLatte.id,
          quantity: 2,
        },
        {
          product: createdProducts.brownButterChocolateChipCookies.id,
          quantity: 1,
        },
      ],
    },
  })

  const oldTimestamp = new Date('2023-01-01T00:00:00Z').toISOString()

  await payload.create({
    collection: 'carts',
    data: {
      currency: 'USD',
      createdAt: oldTimestamp,
      items: [
        {
          product: createdProducts.vietnameseCoffee.id,
          quantity: 1,
        },
        {
          product: createdProducts.caramelPretzelDip.id,
          quantity: 1,
        },
      ],
    },
  })

  await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'USD',
      purchasedAt: new Date().toISOString(),
      subtotal: 3950,
      items: [
        {
          product: createdProducts.slowRoastedTomatoPasta.id,
          quantity: 1,
        },
        {
          product: createdProducts.rosemaryFocacciaLoaf.id,
          quantity: 1,
        },
        {
          product: createdProducts.pistachioCelebrationCakeSlice.id,
          quantity: 1,
        },
      ],
    },
  })

  payload.logger.info(`— Seeding orders...`)

  await Promise.all([
    payload.create({
      collection: 'orders',
      data: {
        amount: 3950,
        currency: 'USD',
        customer: customer.id,
        shippingAddress: baseAddressUSData,
        items: [
          {
            product: createdProducts.slowRoastedTomatoPasta.id,
            quantity: 1,
          },
          {
            product: createdProducts.rosemaryFocacciaLoaf.id,
            quantity: 1,
          },
          {
            product: createdProducts.pistachioCelebrationCakeSlice.id,
            quantity: 1,
          },
        ],
        status: 'completed',
        transactions: [succeededTransaction.id],
      },
    }),
    payload.create({
      collection: 'orders',
      data: {
        amount: 1950,
        currency: 'USD',
        customer: customer.id,
        shippingAddress: baseAddressUSData,
        items: [
          {
            product: createdProducts.roseCardamomLatte.id,
            quantity: 2,
          },
          {
            product: createdProducts.brownButterChocolateChipCookies.id,
            quantity: 1,
          },
        ],
        status: 'processing',
        transactions: [pendingTransaction.id],
      },
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Home',
              url: '/',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Menu',
              url: '/shop',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Account',
              url: '/account',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Menu',
              url: '/shop',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Contact',
              url: '/contact',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Find my order',
              url: '/find-order',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function readSeedFile(filename: string): Promise<File> {
  const filePath = path.resolve(process.cwd(), 'src', 'endpoints', 'seed', filename)
  const data = await readFile(filePath)
  const extension = filename.split('.').pop()?.toLowerCase() || 'png'
  const mimetype = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`

  return {
    name: filename,
    data,
    mimetype,
    size: data.byteLength,
  }
}
