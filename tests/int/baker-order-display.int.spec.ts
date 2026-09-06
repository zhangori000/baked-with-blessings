import { describe, expect, it } from 'vitest'

import type { Order } from '@/payload-types'
import {
  getBakerCustomerIdentity,
  getBakerPaymentLabel,
  summarizeOrderItems,
} from '@/utilities/bakerOrderDisplay'

describe('baker-facing order display', () => {
  it('puts a real name first and keeps email visible underneath', () => {
    expect(
      getBakerCustomerIdentity({
        customerEmail: 'zoe.haase@gmail.com',
        customerName: 'Zoe Haase',
        id: 3,
      }),
    ).toEqual({
      primary: 'Zoe Haase',
      secondary: 'zoe.haase@gmail.com',
    })
  })

  it('promotes email when the stored name is only a phone number', () => {
    expect(
      getBakerCustomerIdentity({
        customerEmail: 'zoe.haase@gmail.com',
        customerName: '+16308223377',
        id: 3,
      }),
    ).toEqual({
      primary: 'zoe.haase@gmail.com',
      secondary: '+16308223377',
    })
  })

  it('falls back to a phone, then to the order number', () => {
    expect(
      getBakerCustomerIdentity({
        customerName: '+16126072239',
        id: 8,
      }),
    ).toEqual({
      primary: '+16126072239',
      secondary: null,
    })
    expect(getBakerCustomerIdentity({ id: 8 })).toEqual({
      primary: 'Order #8',
      secondary: null,
    })
  })

  it('labels payment the way the baker email already does', () => {
    expect(getBakerPaymentLabel({ stripePaymentIntentID: 'pi_123' })).toBe('Paid online')
    expect(getBakerPaymentLabel({ manualPaymentMethod: 'in_person' })).toBe('Pay at pickup')
    expect(getBakerPaymentLabel({ manualPaymentMethod: 'venmo' })).toBe('Venmo — verify')
    expect(getBakerPaymentLabel({})).toBe('Check payment')
  })

  it('summarizes a build-your-own box the way the owner email lists it', () => {
    const items = [
      {
        batchSelections: [
          { product: { title: 'Biscoff' }, quantity: 2 },
          { product: { title: "S'mores" }, quantity: 1 },
          { product: { title: 'Strawberry Cheesecake' }, quantity: 1 },
        ],
        product: { title: 'Build-Your-Own Mini Box' },
        quantity: 1,
      },
    ] as Order['items']

    expect(summarizeOrderItems(items)).toBe(
      "1× Build-Your-Own Mini Box — 2× Biscoff, 1× S'mores, 1× Strawberry Cheesecake",
    )
  })

  it('stays honest when product titles were not loaded', () => {
    expect(summarizeOrderItems([{ product: 12, quantity: 2 }] as Order['items'])).toBe(
      '2 items — open to see flavors',
    )
    expect(summarizeOrderItems([])).toBe('Open to see items')
  })
})
