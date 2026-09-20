import { Customers } from '@/collections/Customers'
import { ProductsCollection } from '@/collections/Products'
import {
  ordersBakerDefaultColumns,
  ordersBakerDefaultSort,
  ordersBakerListSearchableFields,
  ordersBakerUseAsTitle,
} from '@/plugins/ordersBakerAdmin'
import type { CollectionConfig } from 'payload'
import { describe, expect, it } from 'vitest'

describe('owner-facing admin list search', () => {
  it('lets the owner find customers by the details they actually know', () => {
    expect(Customers.admin?.listSearchableFields).toEqual(['name', 'email', 'phone'])
  })

  it('lets the baker find orders by customer name, email, or phone', () => {
    expect(ordersBakerListSearchableFields).toEqual([
      'customerName',
      'customerEmail',
      'guestContactValue',
    ])
    expect(ordersBakerDefaultColumns).toEqual([
      'customerName',
      'customerEmail',
      'bakerItems',
      'status',
      'bakerPayment',
      'amount',
      'createdAt',
    ])
    expect(ordersBakerDefaultSort).toBe('-createdAt')
    expect(ordersBakerUseAsTitle).toBe('customerName')
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
