'use client'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { ECOMMERCE_SESSION_RESET_EVENT } from '@/providers/Ecommerce'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import React, { FormEvent } from 'react'
import { useEcommerce, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { Address } from '@/payload-types'

const STRIPE_LOADING_ERROR = 'Stripe is still loading. Please try again in a moment.'
const PAYMENT_FIELDS_LOADING_ERROR =
  'The secure payment fields are still loading. Please wait a moment.'

type Props = {
  customerEmail?: string
  customerPhone?: string
  billingAddress?: Partial<Address>
  onOrderComplete?: (result: { accessToken?: string; orderID: number | string }) => void
  shippingAddress?: Partial<Address>
  setProcessingPayment: React.Dispatch<React.SetStateAction<boolean>>
}

function StripeElementLoader() {
  return (
    <div
      aria-live="polite"
      className="rounded-3xl border border-[#e8ddc7] bg-[#fff8e8] p-4 text-[#3f351f]"
      role="status"
    >
      <div className="stripeElementLoaderScene" aria-hidden="true">
        <span className="stripeElementLoaderCloud stripeElementLoaderCloudOne" />
        <span className="stripeElementLoaderCloud stripeElementLoaderCloudTwo" />
        <span className="stripeElementLoaderField stripeElementLoaderFieldOne" />
        <span className="stripeElementLoaderField stripeElementLoaderFieldTwo" />
        <span className="stripeElementLoaderFlower stripeElementLoaderFlowerOne" />
        <span className="stripeElementLoaderFlower stripeElementLoaderFlowerTwo" />
      </div>
      <p className="mt-3 text-sm font-extrabold tracking-[0.08em] text-[#1f3d24] uppercase">
        Loading secure payment fields
      </p>
      <p className="mt-1 text-sm leading-6 text-[#5f4a32]">
        Stripe is preparing the encrypted card form. Keep this window open.
      </p>

      <style jsx>{`
        .stripeElementLoaderScene {
          background: linear-gradient(180deg, #b9def5 0%, #e9f7ff 58%, #f6e6ba 59%, #fffaf0 100%);
          border-radius: 1.25rem;
          height: 8rem;
          overflow: hidden;
          position: relative;
        }

        .stripeElementLoaderCloud {
          animation: stripeLoaderCloud 4.8s ease-in-out infinite;
          background: rgba(255, 255, 255, 0.84);
          border-radius: 999px;
          height: 0.9rem;
          position: absolute;
          width: 3.5rem;
        }

        .stripeElementLoaderCloud::before,
        .stripeElementLoaderCloud::after {
          background: rgba(255, 255, 255, 0.88);
          border-radius: 999px;
          content: '';
          position: absolute;
        }

        .stripeElementLoaderCloud::before {
          height: 1.55rem;
          left: 0.45rem;
          top: -0.62rem;
          width: 1.7rem;
        }

        .stripeElementLoaderCloud::after {
          height: 1.35rem;
          right: 0.4rem;
          top: -0.5rem;
          width: 1.55rem;
        }

        .stripeElementLoaderCloudOne {
          left: 14%;
          top: 1.25rem;
        }

        .stripeElementLoaderCloudTwo {
          animation-delay: -2.4s;
          right: 13%;
          top: 1.75rem;
          transform: scale(0.86);
        }

        .stripeElementLoaderField {
          animation: stripeLoaderPulse 1.35s ease-in-out infinite;
          background: linear-gradient(90deg, #fffefa 0%, #f0e3ca 50%, #fffefa 100%);
          background-size: 220% 100%;
          border: 1px solid rgba(74, 58, 35, 0.14);
          border-radius: 1rem;
          height: 1.15rem;
          left: 8%;
          position: absolute;
          right: 8%;
        }

        .stripeElementLoaderFieldOne {
          bottom: 2.85rem;
        }

        .stripeElementLoaderFieldTwo {
          animation-delay: -0.32s;
          bottom: 1.15rem;
          right: 42%;
        }

        .stripeElementLoaderFlower {
          animation: stripeLoaderGrow 1.8s cubic-bezier(0.2, 0.9, 0.2, 1) infinite;
          background: #8bbd4a;
          bottom: 0.4rem;
          height: 1.55rem;
          position: absolute;
          transform-origin: center bottom;
          width: 0.14rem;
        }

        .stripeElementLoaderFlower::before {
          background: radial-gradient(circle, #8d6a1c 0 24%, #ffde3f 25% 100%);
          border-radius: 999px;
          box-shadow:
            0 -0.36rem 0 #ffde3f,
            0.36rem 0 0 #ffde3f,
            0 0.36rem 0 #ffde3f,
            -0.36rem 0 0 #ffde3f;
          content: '';
          height: 0.62rem;
          left: 50%;
          position: absolute;
          top: -0.28rem;
          transform: translateX(-50%);
          width: 0.62rem;
        }

        .stripeElementLoaderFlowerOne {
          left: 72%;
        }

        .stripeElementLoaderFlowerTwo {
          animation-delay: -0.6s;
          left: 83%;
          transform: scale(0.76);
        }

        @keyframes stripeLoaderCloud {
          0%,
          100% {
            translate: -0.35rem 0;
          }

          50% {
            translate: 0.35rem 0;
          }
        }

        @keyframes stripeLoaderPulse {
          0%,
          100% {
            background-position: 0% 50%;
            opacity: 0.72;
          }

          50% {
            background-position: 100% 50%;
            opacity: 1;
          }
        }

        @keyframes stripeLoaderGrow {
          0%,
          100% {
            scale: 1 0.7;
          }

          45% {
            scale: 1 1;
          }
        }
      `}</style>
    </div>
  )
}

export const CheckoutForm: React.FC<Props> = ({
  customerEmail,
  customerPhone,
  billingAddress,
  onOrderComplete,
  setProcessingPayment,
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = React.useState<null | string>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isPaymentElementReady, setIsPaymentElementReady] = React.useState(false)
  const [isConfirmingOrder, setIsConfirmingOrder] = React.useState(false)
  const { clearSession } = useEcommerce()
  const { confirmOrder } = usePayments()
  const billingCity = billingAddress?.city || undefined
  const billingCountry = billingAddress?.country || undefined
  const billingLine1 = billingAddress?.addressLine1 || undefined
  const billingLine2 = billingAddress?.addressLine2 || undefined
  const billingPhone = billingAddress?.phone || customerPhone || undefined
  const billingPostalCode = billingAddress?.postalCode || undefined
  const billingState = billingAddress?.state || undefined

  const paymentElementOptions = React.useMemo(
    () => ({
      defaultValues: {
        billingDetails: {
          address: {
            city: billingCity,
            country: billingCountry,
            line1: billingLine1,
            line2: billingLine2,
            postal_code: billingPostalCode,
            state: billingState,
          },
          email: customerEmail || undefined,
          phone: billingPhone,
        },
      },
      layout: {
        defaultCollapsed: false,
        type: 'tabs' as const,
      },
      paymentMethodOrder: ['card', 'link'],
    }),
    [
      billingCity,
      billingCountry,
      billingLine1,
      billingLine2,
      billingPhone,
      billingPostalCode,
      billingState,
      customerEmail,
    ],
  )

  const stopLoading = () => {
    setIsLoading(false)
    setIsConfirmingOrder(false)
    setProcessingPayment(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError(null)
    setIsLoading(true)

    if (!stripe || !elements) {
      setError(STRIPE_LOADING_ERROR)
      stopLoading()
      return
    }

    if (!isPaymentElementReady) {
      setError(PAYMENT_FIELDS_LOADING_ERROR)
      stopLoading()
      return
    }

    try {
      const { error: submitError } = await elements.submit()

      if (submitError?.message) {
        setError(submitError.message)
        stopLoading()
        return
      }

      const returnUrl = `${window.location.origin}/checkout/confirm-order${customerEmail ? `?email=${customerEmail}` : ''}`

      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              email: customerEmail || undefined,
              phone: billingPhone,
              address: {
                city: billingCity,
                country: billingCountry,
                line1: billingLine1,
                line2: billingLine2,
                postal_code: billingPostalCode,
                state: billingState,
              },
            },
          },
        },
        elements,
        redirect: 'if_required',
      })

      if (stripeError?.message) {
        setError(stripeError.message)
        stopLoading()
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
          setIsConfirmingOrder(true)

          const confirmResult = await confirmOrder('stripe', {
            additionalData: {
              paymentIntentID: paymentIntent.id,
              ...(customerEmail ? { customerEmail } : {}),
            },
          })

          if (
            confirmResult &&
            typeof confirmResult === 'object' &&
            'orderID' in confirmResult &&
            confirmResult.orderID
          ) {
            const accessToken =
              'accessToken' in confirmResult ? (confirmResult.accessToken as string) : ''
            const queryParams = new URLSearchParams()

            if (customerEmail) {
              queryParams.set('email', customerEmail)
            }
            if (accessToken) {
              queryParams.set('accessToken', accessToken)
            }

            const queryString = queryParams.toString()
            const redirectUrl = `/orders/${confirmResult.orderID}${queryString ? `?${queryString}` : ''}`

            clearSession()

            if (onOrderComplete) {
              onOrderComplete({
                accessToken,
                orderID: confirmResult.orderID as number | string,
              })
            } else {
              window.dispatchEvent(new Event(ECOMMERCE_SESSION_RESET_EVENT))
              window.location.assign(redirectUrl)
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Something went wrong.'
          setError(`Error while confirming order: ${msg}`)
          stopLoading()
        }
        return
      }

      if (paymentIntent?.status === 'processing') {
        setError(
          'Stripe is still processing this payment. Keep this cart open for a moment; if your card is charged, do not submit a second payment.',
        )
        stopLoading()
        return
      }

      if (paymentIntent?.status === 'requires_action') {
        setError('Stripe needs one more verification step. Complete it in the Stripe panel above.')
        stopLoading()
        return
      }

      setError(`Payment status is ${paymentIntent?.status || 'unknown'}. Please try again.`)
      stopLoading()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(`Error while submitting payment: ${msg}`)
      stopLoading()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <Message error={error} onDismiss={() => setError(null)} />}
      <div className="relative min-h-[28rem]">
        {!isPaymentElementReady ? <StripeElementLoader /> : null}
        <div
          className={
            isPaymentElementReady
              ? 'transition-opacity duration-300'
              : 'pointer-events-none absolute inset-0 opacity-0'
          }
        >
          <p className="mb-3 text-sm leading-6 text-black/60">
            Choose Card in the Stripe panel if Link opens first or asks for a text code.
          </p>
          <PaymentElement
            onChange={() => {
              setError(null)
            }}
            onReady={() => {
              setIsPaymentElementReady(true)
              setError((current) =>
                current === STRIPE_LOADING_ERROR || current === PAYMENT_FIELDS_LOADING_ERROR
                  ? null
                  : current,
              )
            }}
            options={paymentElementOptions}
          />
        </div>
      </div>
      <div className="mt-8 flex gap-4">
        <Button
          disabled={!stripe || !elements || !isPaymentElementReady || isLoading}
          type="submit"
          variant="default"
        >
          {isLoading
            ? isConfirmingOrder
              ? 'Creating order...'
              : 'Confirming payment...'
            : 'Pay now'}
        </Button>
      </div>
    </form>
  )
}
