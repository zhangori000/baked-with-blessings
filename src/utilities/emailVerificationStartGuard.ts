import type { Payload } from 'payload'

import {
  EMAIL_VERIFICATION_MAX_ATTEMPTS,
  EMAIL_VERIFICATION_START_WINDOW_MS,
  EMAIL_VERIFICATION_TTL_MS,
  EmailVerificationFlow,
  generateEmailVerificationCode,
  hashEmailVerificationCode,
  isEmailVerificationCodeMatch,
  sendEmailVerificationCode,
} from '@/utilities/emailVerification'
import { createStableHash, isUniqueConstraintError } from '@/utilities/idempotency'

export type EmailVerificationCheckStatus =
  | 'attempts_exceeded'
  | 'expired'
  | 'invalid_code'
  | 'not_found'
  | 'ok'

export type EmailVerificationStartResult = {
  reason?: EmailVerificationCheckStatus
  sent?: boolean
  suppressed?: boolean
  success?: boolean
}

export const createEmailVerificationStartKey = ({
  email,
  flow,
  now = new Date(),
}: {
  email: string
  flow: EmailVerificationFlow
  now?: Date
}) => {
  const windowID = Math.floor(now.getTime() / EMAIL_VERIFICATION_START_WINDOW_MS)
  const emailKey = createStableHash(email, 24)

  return `${flow}:${emailKey}:${windowID}`
}

export const startEmailVerificationOnce = async ({
  email,
  flow,
  payload,
}: {
  email: string
  flow: EmailVerificationFlow
  payload: Payload
}) => {
  const now = new Date()
  const key = createEmailVerificationStartKey({ email, flow, now })
  const code = generateEmailVerificationCode()
  const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS)
  const codeHash = hashEmailVerificationCode(code)

  let reservationID: number | string | undefined

  try {
    const reservation = await payload.create({
      collection: 'email-verification-starts',
      data: {
        attempts: 0,
        codeHash,
        email,
        expiresAt: expiresAt.toISOString(),
        flow,
        key,
      },
      overrideAccess: true,
    })

    reservationID = reservation.id
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        sent: false,
        success: true,
        suppressed: true,
      }
    }

    throw error
  }

  try {
    await sendEmailVerificationCode({
      code,
      email,
      payload,
    })

    return {
      sent: true,
      success: true,
      suppressed: false,
    }
  } catch (error) {
    if (reservationID) {
      try {
        await payload.delete({
          collection: 'email-verification-starts',
          id: reservationID,
          overrideAccess: true,
        })
      } catch (deleteError) {
        payload.logger.warn(
          { err: deleteError, email },
          'Could not clear failed email verification start reservation.',
        )
      }
    }

    throw error
  }
}

export const checkEmailVerification = async ({
  code,
  email,
  flow,
  payload,
}: {
  code: string
  email: string
  flow: EmailVerificationFlow
  payload: Payload
}): Promise<{ reason?: EmailVerificationCheckStatus; success?: boolean }> => {
  const now = new Date()
  const starts = await payload.find({
    collection: 'email-verification-starts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    sort: '-createdAt',
    where: {
      and: [
        {
          email: {
            equals: email,
          },
        },
        {
          flow: {
            equals: flow,
          },
        },
        {
          consumedAt: {
            exists: false,
          },
        },
      ],
    },
  })

  const candidate = starts.docs?.[0]

  if (!candidate) {
    return {
      reason: 'not_found',
    }
  }

  const expiresAt = candidate.expiresAt ? new Date(String(candidate.expiresAt)) : null

  if (!expiresAt || expiresAt.getTime() <= now.getTime()) {
    return {
      reason: 'expired',
    }
  }

  const attempts = Number(candidate.attempts ?? 0)
  if (attempts >= EMAIL_VERIFICATION_MAX_ATTEMPTS) {
    return {
      reason: 'attempts_exceeded',
    }
  }

  const expectedHash = String(candidate.codeHash || '')
  const trimmedCode = code.trim()
  const isMatch = isEmailVerificationCodeMatch(expectedHash, trimmedCode)

  if (!isMatch) {
    const nextAttempts = attempts + 1

    await payload.update({
      collection: 'email-verification-starts',
      data: {
        attempts: nextAttempts,
      },
      id: candidate.id,
      overrideAccess: true,
    })

    return {
      reason: nextAttempts >= EMAIL_VERIFICATION_MAX_ATTEMPTS ? 'attempts_exceeded' : 'invalid_code',
    }
  }

  await payload.update({
    collection: 'email-verification-starts',
    data: {
      consumedAt: now.toISOString(),
    },
    id: candidate.id,
    overrideAccess: true,
  })

  return {
    success: true,
  }
}
