import type { Payload, PayloadRequest } from 'payload'

import type { Product } from '@/payload-types'

import { cookieCatalog } from './cookie-catalog'

// Customer-facing rotation copy, stored on the active rotation doc so the owner
// can edit it in admin. Shared with update-flavor-lineup so re-running keeps the
// labels in sync.
export const WEEKLY_ROTATION_LABELS = {
  lockedDescription:
    'Outside the current rotation, this flavor is available through larger catering batches only. Making a separate dough batch for one small order creates too much waste, and the bakery is not set up with the equipment or production space to do that efficiently yet.',
  lockedLabel: 'Catering only',
  menuLinkLabel: 'View on menu',
  monthlyFlavorLabel: "This week's special",
} as const

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
      ...WEEKLY_ROTATION_LABELS,
      individualFlavors: initialMonthlyFlavors,
      rotationType: 'monthly',
      showcaseProducts: Object.values(cookieProductsBySlug),
      status: 'active',
      title: 'Current Weekly Specials',
    },
    depth: 0,
    req,
  })

  payload.logger.info('- Seeded active monthly flavor rotation')
}
