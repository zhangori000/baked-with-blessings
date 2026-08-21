import {
  ADMIN_GROUPS,
  applyOwnerAdminNav,
  hiddenCollectionSlugs,
  hiddenGlobalSlugs,
  visibleCollectionNav,
  visibleGlobalNav,
} from '@/utilities/adminNav'
import type { Config } from 'payload'
import { describe, expect, it } from 'vitest'

describe('owner admin navigation', () => {
  it('keeps daily bakery collections visible and groups them together', () => {
    expect(visibleCollectionNav['flavor-rotations']?.group).toBe(ADMIN_GROUPS.dailyWork)
    expect(visibleCollectionNav.products?.group).toBe(ADMIN_GROUPS.dailyWork)
    expect(visibleCollectionNav.orders?.group).toBe(ADMIN_GROUPS.dailyWork)
    expect(visibleCollectionNav.reviews?.group).toBe(ADMIN_GROUPS.dailyWork)
    expect(visibleGlobalNav.announcements?.group).toBe(ADMIN_GROUPS.dailyWork)
    expect(visibleGlobalNav['store-settings']?.group).toBe(ADMIN_GROUPS.dailyWork)
  })

  it('hides unused plugin and experiment collections from the sidebar', () => {
    expect(hiddenCollectionSlugs).toEqual(
      expect.arrayContaining([
        'carts',
        'transactions',
        'variants',
        'variantTypes',
        'variantOptions',
        'addresses',
        'forms',
        'discussion-nodes',
        'blessings-network-owners',
        'email-verification-starts',
      ]),
    )
    expect(hiddenGlobalSlugs).toEqual(
      expect.arrayContaining(['blog-page-content', 'discussion-board-content']),
    )
  })

  it('applies hidden and group rules without dropping unknown collections', () => {
    const config = applyOwnerAdminNav({
      collections: [
        { slug: 'products', admin: { group: 'Shop' } },
        { slug: 'carts', admin: { group: 'Ecommerce' } },
        { slug: 'mystery-lab' },
      ],
      globals: [
        { slug: 'announcements' },
        { slug: 'discussion-board-content' },
        { slug: 'mystery-setting' },
      ],
    } as Config)

    expect(config.collections).toEqual([
      expect.objectContaining({
        admin: expect.objectContaining({ group: ADMIN_GROUPS.dailyWork, hidden: false }),
        slug: 'products',
      }),
      expect.objectContaining({
        admin: expect.objectContaining({ hidden: true }),
        slug: 'carts',
      }),
      expect.objectContaining({ slug: 'mystery-lab' }),
    ])
    expect(config.globals).toEqual([
      expect.objectContaining({
        admin: expect.objectContaining({ group: ADMIN_GROUPS.dailyWork, hidden: false }),
        slug: 'announcements',
      }),
      expect.objectContaining({
        admin: expect.objectContaining({ hidden: true }),
        slug: 'discussion-board-content',
      }),
      expect.objectContaining({ slug: 'mystery-setting' }),
    ])
  })
})
