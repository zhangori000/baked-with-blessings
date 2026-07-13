import {
  getBundlePricingWarnings,
  parseBundlePricingResponse,
  type BundlePricing,
} from '@/components/BeforeDashboard/BulkCookiePriceTool/bundlePricing'
import { describe, expect, it } from 'vitest'

const validBundle = {
  priceInUSD: 3200,
  requiredSelectionCount: 4,
  slug: 'cookie-tray',
  title: 'Cookie tray',
}

describe('admin bulk pricing safety check', () => {
  it('accepts a complete Payload response and preserves parsed bundle details', () => {
    expect(
      parseBundlePricingResponse({ docs: [validBundle], hasNextPage: false, totalDocs: 1 }),
    ).toEqual({
      bundles: [
        {
          count: 4,
          price: 3200,
          size: 'large',
          title: 'Cookie tray',
        },
      ],
      complete: true,
    })

    expect(parseBundlePricingResponse({ docs: [], hasNextPage: false, totalDocs: 0 })).toEqual({
      bundles: [],
      complete: true,
    })
  })

  it('keeps valid warnings but marks a partially malformed response unverified', () => {
    expect(
      parseBundlePricingResponse({
        docs: [validBundle, { ...validBundle, priceInUSD: null, slug: 'mini-cookie-tray' }],
        hasNextPage: false,
        totalDocs: 2,
      }),
    ).toEqual({
      bundles: [
        {
          count: 4,
          price: 3200,
          size: 'large',
          title: 'Cookie tray',
        },
      ],
      complete: false,
    })
  })

  it.each([
    ['unknown slug', { ...validBundle, slug: 'unknown-bundle' }],
    ['string price', { ...validBundle, priceInUSD: '3200' }],
    ['negative price', { ...validBundle, priceInUSD: -1 }],
    ['fractional price', { ...validBundle, priceInUSD: 3200.5 }],
    ['zero count', { ...validBundle, requiredSelectionCount: 0 }],
    ['fractional count', { ...validBundle, requiredSelectionCount: 4.5 }],
  ])('rejects a returned bundle with %s', (_label, doc) => {
    expect(parseBundlePricingResponse({ docs: [doc], hasNextPage: false, totalDocs: 1 })).toEqual({
      bundles: [],
      complete: false,
    })
  })

  it.each([
    { docs: [validBundle], hasNextPage: true, totalDocs: 2 },
    { docs: [validBundle], hasNextPage: false, totalDocs: 2 },
    { docs: [validBundle], totalDocs: 1 },
    { docs: [validBundle], hasNextPage: false },
    { docs: [validBundle] },
  ])('marks pagination or a count mismatch unverified', (response) => {
    expect(parseBundlePricingResponse(response).complete).toBe(false)
  })

  it('rejects duplicate slugs without producing duplicate warnings', () => {
    expect(
      parseBundlePricingResponse({
        docs: [validBundle, { ...validBundle, priceInUSD: 3600 }],
        hasNextPage: false,
        totalDocs: 2,
      }),
    ).toEqual({
      bundles: [
        {
          count: 4,
          price: 3200,
          size: 'large',
          title: 'Cookie tray',
        },
      ],
      complete: false,
    })
  })

  it('does not warn about unchanged mini prices', () => {
    const miniBundle: BundlePricing = {
      count: 4,
      price: 1600,
      size: 'mini',
      title: 'Mini cookie tray',
    }

    expect(
      getBundlePricingWarnings({
        bundles: [miniBundle],
        largePriceInCents: 800,
        updateMiniPrices: false,
      }),
    ).toEqual([])
    expect(
      getBundlePricingWarnings({
        bundles: [miniBundle],
        largePriceInCents: 800,
        updateMiniPrices: true,
      }),
    ).toEqual([
      'Mini cookie tray ($16.00) would be no cheaper than buying 4 mini cookies individually ($16.00).',
    ])
  })
})
