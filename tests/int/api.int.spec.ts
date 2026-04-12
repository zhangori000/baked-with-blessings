import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('creates and fetches customers', async () => {
    const email = `customer-${Date.now()}@example.com`

    const customer = await payload.create({
      collection: 'customers',
      data: {
        email,
        name: 'Integration Customer',
        password: 'password',
      },
    })

    await payload.create({
      collection: 'addresses',
      data: {
        addressLine1: '123 Test St',
        city: 'Chicago',
        country: 'US',
        customer: customer.id,
        firstName: 'Integration',
        lastName: 'Customer',
        postalCode: '60601',
      },
    })

    const customers = await payload.find({
      collection: 'customers',
      where: {
        email: {
          equals: email,
        },
      },
    })

    const addresses = await payload.find({
      collection: 'addresses',
      where: {
        customer: {
          equals: customer.id,
        },
      },
    })

    expect(customers.docs[0]?.email).toBe(email)
    expect(addresses.totalDocs).toBe(1)
  })
})
