import { getPayload } from 'payload'

import config from '@payload-config'

import {
  ALLOW_CUSTOMER_PHONE_IDENTITY_WRITE,
  VERIFIED_PHONE_CONTEXT_KEY,
} from '@/collections/Customers/hooks/customerPhoneIdentity'
import { findExistingCustomer, normalizeCustomerContact } from '@/utilities/customerAuth'
import { isEmailIdentifier, maskPhoneNumber } from '@/utilities/phone'
import { checkPhoneVerification, startPhoneVerification } from '@/utilities/twilioVerify'

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

    if (!password) {
      return jsonError('Password is required.')
    }

    if (password !== passwordConfirm) {
      return jsonError('The passwords do not match.')
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

    if (phone && !verificationCode) {
      await startPhoneVerification(phone)

      return Response.json(
        {
          maskedPhone: maskPhoneNumber(phone),
          requiresPhoneVerification: true,
        },
        { status: 202 },
      )
    }

    if (phone) {
      const approved = await checkPhoneVerification({
        code: verificationCode,
        phoneNumber: phone,
      })

      if (!approved) {
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

    return Response.json({
      doc: customer,
      success: true,
    })
  } catch (error) {
    payload.logger.error({ err: error }, 'Customer signup failed')
    const message = error instanceof Error ? error.message : 'There was a problem creating the account.'
    return jsonError(message, 500)
  }
}
