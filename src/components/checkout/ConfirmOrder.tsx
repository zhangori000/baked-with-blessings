'use client'

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ECOMMERCE_SESSION_RESET_EVENT } from '@/providers/Ecommerce'
import { useEcommerce, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export const ConfirmOrder: React.FC = () => {
  const { confirmOrder } = usePayments()
  const { clearSession } = useEcommerce()
  const [error, setError] = useState<null | string>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  // Ensure we only confirm the order once, even if the component re-renders
  const isConfirming = useRef(false)

  useEffect(() => {
    const paymentIntentID = searchParams.get('payment_intent')
    const email = searchParams.get('email')

    if (!paymentIntentID) {
      // If no payment intent ID is found, redirect to the home
      router.push('/')
      return
    }

    if (isConfirming.current) {
      return
    }

    isConfirming.current = true

    confirmOrder('stripe', {
      additionalData: {
        paymentIntentID,
        ...(email ? { customerEmail: email } : {}),
      },
    })
      .then((result) => {
        if (result && typeof result === 'object' && 'orderID' in result && result.orderID) {
          const accessToken = 'accessToken' in result ? (result.accessToken as string) : ''
          const queryParams = new URLSearchParams()

          if (email) {
            queryParams.set('email', email)
          }
          if (accessToken) {
            queryParams.set('accessToken', accessToken)
          }

          const queryString = queryParams.toString()
          const redirectUrl = `/orders/${result.orderID}${queryString ? `?${queryString}` : ''}`

          clearSession()
          window.dispatchEvent(new Event(ECOMMERCE_SESSION_RESET_EVENT))
          window.location.assign(redirectUrl)
          return
        }

        setError('Stripe confirmed the payment, but the order response was incomplete.')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to confirm the order.')
      })
  }, [clearSession, confirmOrder, router, searchParams])

  return (
    <div className="text-center w-full flex flex-col items-center justify-start gap-4">
      <h1 className="text-2xl">Confirming Order</h1>

      {error ? (
        <p className="max-w-xl text-sm leading-6 text-red-700">
          {error} If your card was charged, contact the bakery before trying again.
        </p>
      ) : (
        <LoadingSpinner className="w-12 h-6" />
      )}
    </div>
  )
}
