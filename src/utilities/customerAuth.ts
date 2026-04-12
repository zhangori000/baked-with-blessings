import type { Payload } from 'payload'

import { normalizeEmail, normalizePhoneNumber } from '@/utilities/phone'

type FindCustomerArgs = {
  email?: null | string
  phone?: null | string
}

export const normalizeCustomerContact = (args: {
  email?: null | string
  phone?: null | string
}) => {
  const normalizedEmail = args.email?.trim() ? normalizeEmail(args.email) : null
  const normalizedPhone = args.phone?.trim() ? normalizePhoneNumber(args.phone) : null

  return {
    email: normalizedEmail,
    phone: normalizedPhone,
  }
}

export const findExistingCustomer = async (payload: Payload, args: FindCustomerArgs) => {
  const constraints = []

  if (args.email) {
    constraints.push({
      email: {
        equals: args.email,
      },
    })
  }

  if (args.phone) {
    constraints.push({
      username: {
        equals: args.phone,
      },
    })
  }

  if (constraints.length === 0) {
    return null
  }

  const result = await payload.find({
    collection: 'customers',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where:
      constraints.length === 1
        ? constraints[0]
        : {
            or: constraints,
          },
  })

  return result.docs[0] || null
}

export const findCustomerByPhone = async (payload: Payload, phone: string) => {
  const result = await payload.find({
    collection: 'customers',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      username: {
        equals: phone,
      },
    },
  })

  return result.docs[0] || null
}
