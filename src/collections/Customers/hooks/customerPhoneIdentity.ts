import { ValidationError } from 'payload'

import { isAdminUser, isCustomerUser } from '@/access/utilities'
import { normalizePhoneNumber } from '@/utilities/phone'

export const ALLOW_CUSTOMER_PHONE_IDENTITY_WRITE = 'allowCustomerPhoneIdentityWrite'
export const VERIFIED_PHONE_CONTEXT_KEY = 'verifiedCustomerPhoneAt'

const phoneValidationError = (req: { t?: unknown }) =>
  new ValidationError(
    {
      collection: 'customers',
      errors: [
        {
          message: 'Enter a valid phone number.',
          path: 'phone',
        },
      ],
    },
    req?.t as never,
  )

export const syncCustomerPhoneIdentity = ({
  data,
  req,
}: {
  data?: Record<string, unknown>
  req: {
    context?: Record<string, unknown>
    t?: unknown
  }
}) => {
  if (!data) {
    return data
  }

  const hasPhoneMutation = 'phone' in data || 'username' in data

  if (!hasPhoneMutation) {
    return data
  }

  const input =
    typeof data.phone === 'string'
      ? data.phone
      : typeof data.username === 'string'
        ? data.username
        : ''

  if (!input.trim()) {
    data.phone = null
    data.username = null

    if ('phoneVerifiedAt' in data) {
      data.phoneVerifiedAt = null
    }

    return data
  }

  const normalizedPhone = normalizePhoneNumber(input)

  if (!normalizedPhone) {
    throw phoneValidationError(req)
  }

  data.phone = normalizedPhone
  data.username = normalizedPhone

  const verifiedAt = req.context?.[VERIFIED_PHONE_CONTEXT_KEY]
  if (verifiedAt) {
    data.phoneVerifiedAt = verifiedAt
  }

  return data
}

export const restrictCustomerIdentityChanges = ({
  data,
  operation,
  originalDoc,
  req,
}: {
  data?: Record<string, unknown>
  operation: string
  originalDoc?: {
    email?: null | string
    id?: number | string
    phone?: null | string
    phoneVerifiedAt?: null | string
    username?: null | string
  }
  req: {
    context?: Record<string, unknown>
    t?: unknown
    user?: {
      collection?: null | string
      id?: number | string
    } | null
  }
}) => {
  if (!data || operation !== 'update' || !originalDoc) {
    return data
  }

  if (isAdminUser(req.user) || req.context?.[ALLOW_CUSTOMER_PHONE_IDENTITY_WRITE]) {
    return data
  }

  const identityTouched =
    ('phone' in data && data.phone !== originalDoc.phone) ||
    ('username' in data && data.username !== originalDoc.username) ||
    ('phoneVerifiedAt' in data && data.phoneVerifiedAt !== originalDoc.phoneVerifiedAt)

  if (identityTouched && isCustomerUser(req.user) && req.user?.id === originalDoc.id) {
    throw new ValidationError(
      {
        collection: 'customers',
        errors: [
          {
            message: 'Use the phone verification flow to change your phone number.',
            path: 'phone',
          },
        ],
      },
      req.t as never,
    )
  }

  return data
}
