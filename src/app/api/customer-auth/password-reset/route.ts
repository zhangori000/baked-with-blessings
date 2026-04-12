import { getPayload } from 'payload'

import config from '@payload-config'

import { findCustomerByPhone } from '@/utilities/customerAuth'
import { isEmailIdentifier, normalizeEmail, normalizePhoneNumber, maskPhoneNumber } from '@/utilities/phone'
import { checkPhoneVerification, startPhoneVerification } from '@/utilities/twilioVerify'

type PasswordResetBody = {
  identifier?: string
  password?: string
  passwordConfirm?: string
  verificationCode?: string
}

const jsonError = (message: string, status = 400) =>
  Response.json(
    {
      error: message,
    },
    { status },
  )

export async function POST(request: Request) {
  const payload = await getPayload({ config })

  try {
    const body = (await request.json()) as PasswordResetBody
    const identifier = body.identifier?.trim() || ''
    const verificationCode = body.verificationCode?.trim() || ''
    const password = body.password?.trim() || ''
    const passwordConfirm = body.passwordConfirm?.trim() || ''

    if (!identifier) {
      return jsonError('Enter the email address or phone number connected to your account.')
    }

    if (isEmailIdentifier(identifier)) {
      await payload.forgotPassword({
        collection: 'customers',
        data: {
          email: normalizeEmail(identifier),
        },
        overrideAccess: true,
      })

      return Response.json({
        recoveryChannel: 'email',
        success: true,
      })
    }

    const normalizedPhone = normalizePhoneNumber(identifier)

    if (!normalizedPhone) {
      return jsonError('Enter a valid email address or phone number.')
    }

    const customer = await findCustomerByPhone(payload, normalizedPhone)

    if (!customer || !customer.phoneVerifiedAt) {
      return jsonError('We could not find a verified phone-based account for that number.')
    }

    if (!verificationCode) {
      await startPhoneVerification(normalizedPhone)

      return Response.json(
        {
          maskedPhone: maskPhoneNumber(normalizedPhone),
          requiresPhoneVerification: true,
          recoveryChannel: 'phone',
        },
        { status: 202 },
      )
    }

    if (!password) {
      return jsonError('Enter a new password.')
    }

    if (password !== passwordConfirm) {
      return jsonError('The passwords do not match.')
    }

    const approved = await checkPhoneVerification({
      code: verificationCode,
      phoneNumber: normalizedPhone,
    })

    if (!approved) {
      return jsonError('The verification code is invalid or expired.')
    }

    await payload.update({
      id: customer.id,
      collection: 'customers',
      data: {
        password,
      },
      overrideAccess: true,
    })

    return Response.json({
      recoveryChannel: 'phone',
      reset: true,
      success: true,
    })
  } catch (error) {
    payload.logger.error({ err: error }, 'Customer password reset failed')
    const message =
      error instanceof Error ? error.message : 'There was a problem processing the password reset request.'
    return jsonError(message, 500)
  }
}
