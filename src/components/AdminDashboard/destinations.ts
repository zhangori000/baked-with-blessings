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
    key: 'flavor-rotations',
    label: "This week's cookie lineup",
    description: 'Choose the rotating flavors on Specials of the Week and the homepage.',
    href: '/admin/collections/flavor-rotations',
  },
  {
    key: 'products',
    label: 'Standing menu and prices',
    description:
      "Always-available cookies, trays, photos, and prices. You can also move one cookie onto this week's lineup from here.",
    href: '/admin/collections/products',
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
  'flavor-rotations',
  'products',
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
