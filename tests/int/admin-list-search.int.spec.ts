import { Customers } from '@/collections/Customers'
import { ProductsCollection } from '@/collections/Products'
import type { CollectionConfig } from 'payload'
import { describe, expect, it } from 'vitest'

describe('owner-facing admin list search', () => {
  it('lets the owner find customers by the details they actually know', () => {
    expect(Customers.admin?.listSearchableFields).toEqual(['name', 'email', 'phone'])
  })

  it('lets the owner find products by title or URL slug', async () => {
    const products = await ProductsCollection({
      defaultCollection: {
        fields: [],
        slug: 'products',
      } as CollectionConfig,
    })

    expect(products.admin?.listSearchableFields).toEqual(['title', 'slug'])
  })
})
