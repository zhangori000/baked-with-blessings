import type { CollectionConfig, Config, GlobalConfig } from 'payload'

/**
 * Owner-facing admin navigation.
 *
 * Bakery staff use a handful of screens every week. Payload still registers
 * every collection (carts, variants, discussion graph, verification logs, …)
 * so those documents stay reachable by URL, but they should not crowd the
 * sidebar. This module is the single place that decision lives.
 */

export const ADMIN_GROUPS = {
  accounts: 'Accounts',
  community: 'Community',
  dailyWork: 'Daily work',
  website: 'Website',
} as const

export type AdminGroup = (typeof ADMIN_GROUPS)[keyof typeof ADMIN_GROUPS]

/** Collections bakery staff should see in the left nav. */
export const visibleCollectionNav: Record<string, { group: AdminGroup }> = {
  admins: { group: ADMIN_GROUPS.accounts },
  categories: { group: ADMIN_GROUPS.dailyWork },
  'community-notes': { group: ADMIN_GROUPS.community },
  customers: { group: ADMIN_GROUPS.accounts },
  'feature-request-comments': { group: ADMIN_GROUPS.community },
  'feature-requests': { group: ADMIN_GROUPS.community },
  'flavor-rotations': { group: ADMIN_GROUPS.dailyWork },
  'form-submissions': { group: ADMIN_GROUPS.community },
  media: { group: ADMIN_GROUPS.dailyWork },
  orders: { group: ADMIN_GROUPS.dailyWork },
  pages: { group: ADMIN_GROUPS.website },
  posts: { group: ADMIN_GROUPS.website },
  products: { group: ADMIN_GROUPS.dailyWork },
  reviews: { group: ADMIN_GROUPS.dailyWork },
}

/** Globals bakery staff should see in the left nav. */
export const visibleGlobalNav: Record<string, { group: AdminGroup }> = {
  announcements: { group: ADMIN_GROUPS.dailyWork },
  brand: { group: ADMIN_GROUPS.website },
  'community-page-content': { group: ADMIN_GROUPS.community },
  'feature-requests-content': { group: ADMIN_GROUPS.community },
  footer: { group: ADMIN_GROUPS.website },
  header: { group: ADMIN_GROUPS.website },
  'site-pages': { group: ADMIN_GROUPS.website },
  'store-settings': { group: ADMIN_GROUPS.dailyWork },
}

/**
 * Developer / plugin machinery. Hidden from the sidebar; still editable at
 * `/admin/collections/<slug>` or `/admin/globals/<slug>` if needed.
 */
export const hiddenCollectionSlugs = [
  'addresses',
  'awareness-marks',
  'blessings-network-answers',
  'blessings-network-owner-posts',
  'blessings-network-owners',
  'blessings-network-questions',
  'carts',
  'discussion-edges',
  'discussion-nodes',
  'email-verification-starts',
  'forms',
  'phone-verification-starts',
  'transactions',
  'variantOptions',
  'variantTypes',
  'variants',
] as const

export const hiddenGlobalSlugs = ['blog-page-content', 'discussion-board-content'] as const

const hiddenCollectionSet = new Set<string>(hiddenCollectionSlugs)
const hiddenGlobalSet = new Set<string>(hiddenGlobalSlugs)

const applyAdminNav = <T extends CollectionConfig | GlobalConfig>(
  entity: T,
  visible: Record<string, { group: AdminGroup }>,
  hidden: Set<string>,
): T => {
  if (hidden.has(entity.slug)) {
    return {
      ...entity,
      admin: {
        ...entity.admin,
        hidden: true,
      },
    }
  }

  const nav = visible[entity.slug]

  if (!nav) {
    return entity
  }

  return {
    ...entity,
    admin: {
      ...entity.admin,
      group: nav.group,
      hidden: false,
    },
  }
}

export const applyOwnerAdminNav = (config: Config): Config => ({
  ...config,
  collections: config.collections?.map((collection) =>
    applyAdminNav(collection, visibleCollectionNav, hiddenCollectionSet),
  ),
  globals: config.globals?.map((global) =>
    applyAdminNav(global, visibleGlobalNav, hiddenGlobalSet),
  ),
})
