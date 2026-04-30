import { getPayload } from 'payload'

import config from '@payload-config'

import {
  ALLOW_CUSTOMER_PHONE_IDENTITY_WRITE,
  VERIFIED_PHONE_CONTEXT_KEY,
} from '@/collections/Customers/hooks/customerPhoneIdentity'
import { findExistingCustomer, normalizeCustomerContact } from '@/utilities/customerAuth'
import { sendCustomerWelcomeEmail } from '@/utilities/email/sendCustomerWelcomeEmail'
import { checkEmailVerification, startEmailVerificationOnce } from '@/utilities/emailVerificationStartGuard'
import { maskEmailAddress } from '@/utilities/emailVerification'
import { startPhoneVerificationOnce } from '@/utilities/phoneVerificationStartGuard'
import { isEmailIdentifier, maskPhoneNumber } from '@/utilities/phone'
import { checkPhoneVerification } from '@/utilities/twilioVerify'

type SignupBody = {
  email?: string
  name?: string
  password?: string
  passwordConfirm?: string
  phone?: string
  verificationCode?: string
}

const jsonError = (message: string, status = 400) =>
  Response.json(
    {
      error: message,
    },
    { status },
  )

const describeSignupError = (error: unknown) => {
  const apiError = error as
    | {
        data?: {
          errors?: Array<{
            message?: string
            path?: string
          }>
        }
        message?: string
        status?: number
      }
    | undefined
  const fieldError = apiError?.data?.errors?.[0]

  if (fieldError?.path === 'password') {
    return 'Password must be at least 3 characters.'
  }

  if (fieldError?.path && fieldError.message) {
    return `${fieldError.path}: ${fieldError.message}`
  }

  return apiError?.message || 'There was a problem creating the account.'
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })

  try {
    const body = (await request.json()) as SignupBody

    const name = body.name?.trim() || undefined
    const password = body.password?.trim() || ''
    const passwordConfirm = body.passwordConfirm?.trim() || ''
    const verificationCode = body.verificationCode?.trim() || ''
    const rawEmail = body.email?.trim() || ''
    const rawPhone = body.phone?.trim() || ''

    if (!rawEmail && !rawPhone) {
      return jsonError('Enter an email address, a phone number, or both.')
    }

    if (rawEmail && !isEmailIdentifier(rawEmail)) {
      return jsonError('Enter a valid email address.')
    }

    const { email, phone } = normalizeCustomerContact({
      email: rawEmail,
      phone: rawPhone,
    })

    if (rawPhone && !phone) {
      return jsonError('Enter a valid phone number.')
    }

    const existingCustomer = await findExistingCustomer(payload, { email, phone })

    if (existingCustomer) {
      if (phone && existingCustomer.phone === phone) {
        return jsonError('That phone number is already attached to an existing account.', 409)
      }

      return jsonError('That email address is already attached to an existing account.', 409)
    }

    if (!verificationCode && phone) {
      await startPhoneVerificationOnce({
        flow: 'signup',
        payload,
        phoneNumber: phone,
      })

      return Response.json(
        {
          maskedPhone: maskPhoneNumber(phone),
          requiresPhoneVerification: true,
        },
        { status: 202 },
      )
    }

    if (!verificationCode && email) {
      const result = await startEmailVerificationOnce({
        email,
        flow: 'signup',
        payload,
      })

      if (!result.success) {
        return jsonError('Unable to send email verification code.', 500)
      }

      return Response.json(
        {
          maskedEmail: maskEmailAddress(email),
          requiresEmailVerification: true,
          success: true,
        },
        { status: 202 },
      )
    }

    if (!password) {
      return jsonError('Password is required.')
    }

    if (password.length < 3) {
      return jsonError('Password must be at least 3 characters.')
    }

    if (password !== passwordConfirm) {
      return jsonError('The passwords do not match.')
    }

    if (phone) {
      const approved = await checkPhoneVerification({
        code: verificationCode,
        phoneNumber: phone,
      })

      if (!approved) {
        return jsonError('The verification code is invalid or expired.')
      }
    } else if (email && verificationCode) {
      const verification = await checkEmailVerification({
        code: verificationCode,
        email,
        flow: 'signup',
        payload,
      })

      if (!verification.success) {
        if (verification.reason === 'attempts_exceeded') {
          return jsonError('Too many attempts. Please request a new verification code.')
        }

        if (verification.reason === 'expired') {
          return jsonError('The verification code has expired.')
        }

        if (verification.reason === 'not_found') {
          return jsonError('No verification attempt found for this email.')
        }

        return jsonError('The verification code is invalid or expired.')
      }
    }

    const customer = await payload.create({
      collection: 'customers',
      context: {
        [ALLOW_CUSTOMER_PHONE_IDENTITY_WRITE]: Boolean(phone),
        ...(phone
          ? {
              [VERIFIED_PHONE_CONTEXT_KEY]: new Date().toISOString(),
            }
          : {}),
      },
      data: {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
        ...(phone ? { phone, username: phone } : {}),
        password,
      },
      draft: false,
      overrideAccess: true,
    })

    if (email) {
      try {
        await sendCustomerWelcomeEmail({
          email,
          name,
          payload,
        })
      } catch (emailError) {
        payload.logger.error({ err: emailError, email }, 'Customer welcome email failed')
      }
    }

    return Response.json({
      doc: customer,
      success: true,
    })
  } catch (error) {
    payload.logger.error({ err: error }, 'Customer signup failed')
    const status =
      typeof (error as { status?: unknown })?.status === 'number'
        ? ((error as { status: number }).status ?? 500)
        : 500

    return jsonError(describeSignupError(error), status)
  }
}
