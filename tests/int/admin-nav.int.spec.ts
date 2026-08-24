import {
  ADMIN_GROUPS,
  advancedCollectionNav,
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

  it('groups ecommerce internals instead of hiding them from the client config', () => {
    expect(advancedCollectionNav.carts?.group).toBe(ADMIN_GROUPS.advanced)
    expect(advancedCollectionNav.variants?.group).toBe(ADMIN_GROUPS.advanced)
    expect(advancedCollectionNav.forms?.group).toBe(ADMIN_GROUPS.advanced)
    expect(hiddenCollectionSlugs).toEqual(
      expect.arrayContaining([
        'discussion-nodes',
        'blessings-network-owners',
        'email-verification-starts',
      ]),
    )
    expect(hiddenCollectionSlugs).not.toEqual(expect.arrayContaining(['carts', 'variants', 'admins']))
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
        admin: expect.objectContaining({ group: ADMIN_GROUPS.advanced, hidden: false }),
        slug: 'carts',
      }),
      expect.objectContaining({ admin: {}, slug: 'mystery-lab' }),
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
      expect.objectContaining({ admin: {}, slug: 'mystery-setting' }),
    ])
  })

  it('never hides the admins auth collection and always sets admin for nav safety', () => {
    const config = applyOwnerAdminNav({
      collections: [{ slug: 'admins' }, { slug: 'discussion-nodes' }],
      globals: [{ slug: 'header' }],
    } as Config)

    expect(config.collections).toEqual([
      expect.objectContaining({
        admin: expect.objectContaining({ group: ADMIN_GROUPS.accounts, hidden: false }),
        slug: 'admins',
      }),
      expect.objectContaining({
        admin: expect.objectContaining({ hidden: true }),
        slug: 'discussion-nodes',
      }),
    ])

    for (const entity of [...(config.collections ?? []), ...(config.globals ?? [])]) {
      expect(entity.admin).toBeDefined()
      expect(() => {
        const { hidden } = entity.admin as { hidden?: boolean }
        return hidden
      }).not.toThrow()
    }
  })
})
