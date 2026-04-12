import { parsePhoneNumberFromString } from 'libphonenumber-js'

const fallbackCountry = (process.env.NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY || 'US').trim()

export const isEmailIdentifier = (value: string): boolean => /\S+@\S+\.\S+/.test(value.trim())

export const normalizeEmail = (value: string): string => value.trim().toLowerCase()

export const normalizePhoneNumber = (value: string): null | string => {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = trimmed.startsWith('+')
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, fallbackCountry as Parameters<typeof parsePhoneNumberFromString>[1])

  if (!parsed?.isValid()) {
    return null
  }

  return parsed.number
}

export const maskPhoneNumber = (value: string): string => {
  const normalized = normalizePhoneNumber(value)

  if (!normalized) {
    return value
  }

  const visibleDigits = normalized.slice(-4)
  return `${normalized.slice(0, Math.max(0, normalized.length - 4)).replace(/\d/g, '*')}${visibleDigits}`
}

export const buildCustomerLoginData = (identifier: string, password: string) => {
  const trimmedIdentifier = identifier.trim()

  if (!trimmedIdentifier) {
    return { password }
  }

  if (isEmailIdentifier(trimmedIdentifier)) {
    return {
      email: normalizeEmail(trimmedIdentifier),
      password,
    }
  }

  const normalizedPhone = normalizePhoneNumber(trimmedIdentifier)

  if (!normalizedPhone) {
    return { password }
  }

  return {
    password,
    username: normalizedPhone,
  }
}
