import type { Payload } from 'payload'

import { isUniqueConstraintError } from '@/utilities/idempotency'
import { startPhoneVerification } from '@/utilities/twilioVerify'

export type PhoneVerificationFlow = 'password-reset' | 'signup'

export const PHONE_VERIFICATION_START_WINDOW_MS = 7 * 1000

export const createPhoneVerificationStartKey = ({
  flow,
  now = new Date(),
  phoneNumber,
}: {
  flow: PhoneVerificationFlow
  now?: Date
  phoneNumber: string
}) => {
  const windowID = Math.floor(now.getTime() / PHONE_VERIFICATION_START_WINDOW_MS)
  return `${flow}:${phoneNumber}:${windowID}`
}

export const startPhoneVerificationOnce = async ({
  flow,
  payload,
  phoneNumber,
}: {
  flow: PhoneVerificationFlow
  payload: Payload
  phoneNumber: string
}) => {
  const now = new Date()
  const key = createPhoneVerificationStartKey({ flow, now, phoneNumber })
  const expiresAt = new Date(now.getTime() + PHONE_VERIFICATION_START_WINDOW_MS).toISOString()

  let reservationID: number | string | undefined

  try {
    const reservation = await payload.create({
      collection: 'phone-verification-starts',
      data: {
        expiresAt,
        flow,
        key,
        phone: phoneNumber,
      },
      overrideAccess: true,
    })

    reservationID = reservation.id
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        sent: false,
        suppressed: true,
      }
    }

    throw error
  }

  try {
    await startPhoneVerification(phoneNumber)

    return {
      sent: true,
      suppressed: false,
    }
  } catch (error) {
    if (reservationID) {
      try {
        await payload.delete({
          id: reservationID,
          collection: 'phone-verification-starts',
          overrideAccess: true,
        })
      } catch (deleteError) {
        payload.logger.warn(
          { err: deleteError, phoneNumber },
          'Could not release failed phone verification start reservation.',
        )
      }
    }

    throw error
  }
}
