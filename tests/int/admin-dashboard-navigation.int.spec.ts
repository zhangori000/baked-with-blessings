import {
  dailyDestinations,
  quickNavDestinationKeys,
  quickNavDestinations,
  supportingDestinations,
} from '@/components/AdminDashboard/destinations'
import { attentionOrdersHref, attentionOrderStatuses } from '@/components/AdminDashboard/orderQueue'
import { describe, expect, it } from 'vitest'

describe('admin dashboard navigation', () => {
  it('keeps the everyday owner workflows one direct admin link away', () => {
    expect(Object.fromEntries(dailyDestinations.map(({ href, key }) => [key, href]))).toEqual({
      announcements: '/admin/globals/announcements',
      'flavor-rotations': '/admin/collections/flavor-rotations',
      orders: '/admin/collections/orders',
      products: '/admin/collections/products',
      reviews: '/admin/collections/reviews',
      'store-settings': '/admin/globals/store-settings',
    })
    expect(dailyDestinations.map(({ key }) => key)).toEqual([
      'orders',
      'flavor-rotations',
      'products',
      'announcements',
      'store-settings',
      'reviews',
    ])
  })

  it('uses unique labels, keys, and direct Payload destinations', () => {
    const destinations = [...dailyDestinations, ...supportingDestinations]

    expect(new Set(destinations.map(({ key }) => key)).size).toBe(destinations.length)
    expect(new Set(destinations.map(({ label }) => label)).size).toBe(destinations.length)

    for (const destination of destinations) {
      expect(destination.href).toMatch(/^\/admin\/(collections|globals)\/[a-z0-9-]+$/)
    }
  })

  it('puts the highest-frequency links in the persistent quick navigation', () => {
    expect(quickNavDestinations.map(({ key }) => key)).toEqual(quickNavDestinationKeys)
    expect(
      quickNavDestinations.every((destination) => dailyDestinations.includes(destination)),
    ).toBe(true)
  })

  it('opens the complete attention queue with the same statuses and oldest-first ordering', () => {
    const url = new URL(attentionOrdersHref, 'https://admin.example.com')

    expect(
      attentionOrderStatuses.map((_status, index) =>
        url.searchParams.get(`where[status][in][${index}]`),
      ),
    ).toEqual([...attentionOrderStatuses])
    expect(url.searchParams.get('sort')).toBe('createdAt')
  })
})
