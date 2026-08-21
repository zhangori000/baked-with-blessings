import { ProductsCollection } from '@/collections/Products'
import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { describe, expect, it } from 'vitest'

describe('product admin form', () => {
  it('leads with placement, price, and photos before writing and trays', async () => {
    const override = ProductsCollection as CollectionOverride
    const collection = await Promise.resolve(
      override({
        defaultCollection: {
          fields: [
            { name: 'title', type: 'text' },
            { name: 'description', type: 'textarea' },
            { name: 'priceInUSD', type: 'number' },
            { name: 'priceInUSDEnabled', type: 'checkbox' },
            { name: 'inventory', type: 'number' },
          ],
        },
      } as never),
    )

    const tabField = collection.fields.find((field) => 'type' in field && field.type === 'tabs') as
      | {
          tabs: {
            fields: { name?: string }[]
            label?: string
            name?: string
          }[]
        }
      | undefined

    expect(tabField?.tabs.map((tab) => tab.label ?? tab.name)).toEqual([
      'On the menu',
      'Writing',
      'Trays & extras',
      'SEO',
    ])

    expect(tabField?.tabs[0]?.fields.map((field) => field.name)).toEqual(
      expect.arrayContaining(['menuPlacement', 'priceInUSD', 'miniPriceInUSD', 'gallery']),
    )
  })
})
