import type { Payload, PayloadRequest } from 'payload'

import type { Product } from '@/payload-types'

import { cookieCatalog } from './cookie-catalog'

export const seedFlavorRotation = async ({
  cookieProductsBySlug,
  payload,
  req,
}: {
  cookieProductsBySlug: Record<string, Product>
  payload: Payload
  req: PayloadRequest
}) => {
  const initialMonthlyFlavors = cookieCatalog.slice(0, 3).map((cookie) => {
    const product = cookieProductsBySlug[cookie.slug]

    if (!product) {
      throw new Error(`Missing product for initial flavor rotation cookie "${cookie.slug}".`)
    }

    return product
  })

  await payload.create({
    collection: 'flavor-rotations',
    data: {
      displayLabel: 'Current monthly cookie rotation',
      individualFlavorSlots: 3,
      individualFlavors: initialMonthlyFlavors,
      lockedDescription:
        'This flavor is outside the current rotation, but you can still order it in batches of 10, mini or regular size, from the menu.',
      lockedLabel: 'Catering only this month',
      menuLinkLabel: 'View menu',
      monthlyFlavorLabel: "This month's flavor",
      rotationType: 'monthly',
      status: 'active',
      title: 'Current Monthly Cookie Rotation',
    },
    depth: 0,
    req,
  })

  payload.logger.info('- Seeded active monthly flavor rotation')
}
