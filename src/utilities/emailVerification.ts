import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import type { Payload } from 'payload'

import { normalizeEmail } from '@/utilities/phone'

const ttlMinutes: number = 10
export const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * ttlMinutes
export const EMAIL_VERIFICATION_MAX_ATTEMPTS = 5
export const EMAIL_VERIFICATION_START_WINDOW_MS = 7 * 1000
const CODE_LENGTH = 6

export type EmailVerificationFlow = 'signup'

const getEmailVerificationSecret = () =>
  process.env.EMAIL_VERIFICATION_SECRET?.trim() ||
  process.env.PAYLOAD_SECRET?.trim() ||
  'fallback-email-verification-secret'

export const generateEmailVerificationCode = () => randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, '0')

export const hashEmailVerificationCode = (code: string) =>
  createHmac('sha256', getEmailVerificationSecret()).update(code).digest('hex')

export const isEmailVerificationCodeMatch = (expectedHash: string, candidate: string) => {
  const expected = Buffer.from(expectedHash, 'hex')
  const actual = Buffer.from(hashEmailVerificationCode(candidate), 'hex')

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}

export const maskEmailAddress = (value: string) => {
  const normalized = normalizeEmail(value)

  const parts = normalized.split('@')
  if (parts.length !== 2) {
    return normalized
  }

  const localPart = parts[0]
  const first = localPart[0]
  const last = localPart.at(-1)
  const maskedLocal =
    localPart.length <= 2
      ? `${first}*`
      : `${first}***${last ?? ''}`

  return `${maskedLocal}@${parts[1]}`
}

export const sendEmailVerificationCode = async ({
  email,
  payload,
  code,
}: {
  email: string
  payload: Payload
  code: string
}) => {
  const companyName =
    process.env.COMPANY_NAME?.trim() || process.env.SITE_NAME?.trim() || 'Baked with Blessings'
  const subject = `${companyName} verification code`
  const maskedEmail = maskEmailAddress(email)
  const safeCode = code.slice(0, CODE_LENGTH)
  const html = `<p>Your ${companyName} verification code is <strong>${safeCode}</strong>.</p>
<p>It expires in ${ttlMinutes} minute${ttlMinutes === 1 ? '' : 's'}.</p>
<p>If you didn't request this code, you can ignore this email.</p>`
  const text = `Your ${companyName} verification code is ${safeCode}. It expires in ${ttlMinutes} minutes. If you didn't request this code, ignore this email.`

  await payload.sendEmail({
    html,
    subject,
    text,
    to: email,
  })

  return {
    maskedEmail,
  }
}
