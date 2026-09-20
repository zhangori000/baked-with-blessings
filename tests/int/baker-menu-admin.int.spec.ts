import {
  dailyDestinations,
  quickNavDestinationKeys,
} from '@/components/AdminDashboard/destinations'
import { FlavorRotations } from '@/collections/FlavorRotations'
import { ProductsCollection } from '@/collections/Products'
import {
  bakerDailyWorkGroup,
  cookieLineupLabels,
  cookiesAndMenuLabels,
} from '@/utilities/bakerMenuAdmin'
import type { CollectionConfig, Field, Tab } from 'payload'
import { describe, expect, it } from 'vitest'

const getTabs = (fields: Field[]): Tab[] => {
  const tabsField = fields.find((field) => field.type === 'tabs')
  return tabsField && 'tabs' in tabsField ? tabsField.tabs : []
}

const getTabFieldNames = (tab: Tab): string[] =>
  'fields' in tab
    ? tab.fields.flatMap((field) => ('name' in field && field.name ? [field.name] : []))
    : []

describe('baker menu admin', () => {
  it('names the two cookie jobs in bakery language and groups them with daily work', () => {
    expect(FlavorRotations.labels).toEqual(cookieLineupLabels)
    expect(FlavorRotations.admin?.group).toBe(bakerDailyWorkGroup)
    expect(FlavorRotations.admin?.components?.beforeList).toEqual([
      '@/components/admin/FlavorRotationListIntro#FlavorRotationListIntro',
    ])
  })

  it('opens a cookie on placement, price, and photos before writing', async () => {
    const products = await ProductsCollection({
      defaultCollection: {
        fields: [{ name: 'priceInUSD', type: 'number' }],
        slug: 'products',
      } as CollectionConfig,
    })

    expect(products.labels).toEqual(cookiesAndMenuLabels)
    expect(products.admin?.group).toBe(bakerDailyWorkGroup)

    const tabs = getTabs(products.fields)
    expect(tabs.map((tab) => tab.label)).toEqual([
      'On the menu',
      'Writing',
      'Trays',
      'Search listing',
    ])
    expect(getTabFieldNames(tabs[0]!)).toEqual(
      expect.arrayContaining(['menuPlacement', 'priceInUSD', 'miniPriceInUSD', 'gallery']),
    )
    expect(getTabFieldNames(tabs[1]!)).toEqual(expect.arrayContaining(['description', 'poster']))
    expect(getTabFieldNames(tabs[0]!)).not.toEqual(expect.arrayContaining(['description']))
  })

  it('keeps Cookie lineups and Cookies and menu as the two daily cookie paths', () => {
    expect(
      Object.fromEntries(dailyDestinations.map(({ key, label }) => [key, label])),
    ).toMatchObject({
      'flavor-rotations': 'Cookie lineups',
      products: 'Cookies and menu',
    })
    expect(quickNavDestinationKeys).toEqual([
      'orders',
      'flavor-rotations',
      'products',
      'announcements',
      'store-settings',
    ])
  })
})
