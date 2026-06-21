'use client'

import { Message } from '@/components/Message'
import { BakeryAction } from '@/design-system/bakery'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const payButtonClass = 'bg-[#1f3d24] text-white shadow-sm hover:bg-[#163019]'

/**
 * Phase 3 — lets the owner of an unsettled pay-at-pickup order pay online now.
 * Starts a PaymentIntent via /api/payments/order/[id]/pay, collects the card
 * with Stripe's PaymentElement (card + Apple Pay / Google Pay), confirms, then
 * refreshes — the Stripe webhook marks the order paid server-side.
 */
function OrderPayForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<null | string>(null)
  const [isPaying, setIsPaying] = useState(false)
  const [ready, setReady] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements || isPaying) return

    setError(null)
    setIsPaying(true)
    try {
      const { error: submitError } = await elements.submit()
      if (submitError?.message) {
        setError(submitError.message)
        setIsPaying(false)
        return
      }

      const { error: payError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (payError?.message) {
        setError(payError.message)
        setIsPaying(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        onPaid()
        return
      }

      setError(`Payment status is ${paymentIntent?.status || 'unknown'}. Please try again.`)
      setIsPaying(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setIsPaying(false)
    }
  }

  return (
    <form className="mt-4" onSubmit={handleSubmit}>
      {error ? <Message className="mb-3" error={error} onDismiss={() => setError(null)} /> : null}
      <PaymentElement
        onReady={() => setReady(true)}
        options={{ layout: { defaultCollapsed: false, type: 'tabs' } }}
      />
      <BakeryAction
        block
        className={`mt-5 ${payButtonClass}`}
        disabled={!stripe || !ready || isPaying}
        size="lg"
        type="submit"
        variant="primary"
      >
        {isPaying ? 'Paying…' : 'Pay now'}
      </BakeryAction>
    </form>
  )
}

export function OrderPayPanel({ amountLabel, orderId }: { amountLabel: string; orderId: number }) {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<null | string>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [paid, setPaid] = useState(false)

  const startPayment = async () => {
    setIsStarting(true)
    setError(null)
    try {
      const response = await fetch(`/api/payments/order/${orderId}/pay`, { method: 'POST' })
      const data = (await response.json()) as { clientSecret?: string; error?: string }
      if (!response.ok || !data.clientSecret) {
        throw new Error(data.error || 'Could not start payment.')
      }
      setClientSecret(data.clientSecret)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payment.')
    } finally {
      setIsStarting(false)
    }
  }

  if (paid) {
    return (
      <p className="mt-3 text-sm font-semibold leading-6 text-[#1f3d24]">
        Payment received — thank you! Updating your order…
      </p>
    )
  }

  if (clientSecret) {
    return (
      <Elements options={{ clientSecret }} stripe={stripePromise}>
        <OrderPayForm
          onPaid={() => {
            setPaid(true)
            setTimeout(() => router.refresh(), 1500)
          }}
        />
      </Elements>
    )
  }

  return (
    <div className="mt-3">
      {error ? <Message className="mb-3" error={error} onDismiss={() => setError(null)} /> : null}
      <BakeryAction
        block
        className={payButtonClass}
        disabled={isStarting}
        onClick={startPayment}
        size="lg"
        type="button"
        variant="primary"
      >
        {isStarting ? 'Starting…' : `Pay ${amountLabel} now — card or Apple Pay`}
      </BakeryAction>
    </div>
  )
}
