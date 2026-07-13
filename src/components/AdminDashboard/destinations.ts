export type AdminDestination = {
  description: string
  href: `/admin/${string}`
  key: string
  label: string
}

export const dailyDestinations: AdminDestination[] = [
  {
    key: 'orders',
    label: 'Orders to handle',
    description: 'Review new orders and move each one from requested to ready for pickup.',
    href: '/admin/collections/orders',
  },
  {
    key: 'products',
    label: 'Products and prices',
    description: 'Update cookie details, photos, prices, trays, and menu availability.',
    href: '/admin/collections/products',
  },
  {
    key: 'flavor-rotations',
    label: 'Current cookie lineup',
    description: 'Choose which rotating flavors customers can order right now.',
    href: '/admin/collections/flavor-rotations',
  },
  {
    key: 'announcements',
    label: 'Announcements',
    description: 'Post bake days, market dates, pickup windows, and other timely news.',
    href: '/admin/globals/announcements',
  },
  {
    key: 'store-settings',
    label: 'Store settings',
    description: 'Change payment choices and the storefront-wide switches you use most.',
    href: '/admin/globals/store-settings',
  },
  {
    key: 'reviews',
    label: 'Reviews to moderate',
    description: 'Read customer reviews and decide what should be visible on the site.',
    href: '/admin/collections/reviews',
  },
]

export const supportingDestinations: AdminDestination[] = [
  {
    key: 'customers',
    label: 'Customers',
    description: 'Find customer contact and account details.',
    href: '/admin/collections/customers',
  },
  {
    key: 'media',
    label: 'Photos and media',
    description: 'Upload and organize storefront images.',
    href: '/admin/collections/media',
  },
  {
    key: 'site-pages',
    label: 'Show or hide pages',
    description: 'Choose which optional pages appear on the public site.',
    href: '/admin/globals/site-pages',
  },
  {
    key: 'pages',
    label: 'Website pages',
    description: 'Edit the main page content.',
    href: '/admin/collections/pages',
  },
  {
    key: 'posts',
    label: 'Blog posts',
    description: 'Write and publish blog posts.',
    href: '/admin/collections/posts',
  },
  {
    key: 'community-notes',
    label: 'Post-it wall',
    description: 'Moderate notes shared by customers.',
    href: '/admin/collections/community-notes',
  },
  {
    key: 'feature-requests',
    label: 'Feature requests',
    description: 'Review ideas and feedback from visitors.',
    href: '/admin/collections/feature-requests',
  },
]

export const quickNavDestinationKeys = [
  'orders',
  'products',
  'flavor-rotations',
  'announcements',
  'store-settings',
] as const

export const quickNavDestinations = quickNavDestinationKeys.map((key) => {
  const destination = dailyDestinations.find((item) => item.key === key)

  if (!destination) {
    throw new Error(`Missing admin destination: ${key}`)
  }

  return destination
})
