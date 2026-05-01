'use client'

import { CheckoutForm } from '@/components/forms/CheckoutForm'
import { Message } from '@/components/Message'
import { BakeryAction, BakeryCard } from '@/design-system/bakery'
import { useAuth } from '@/providers/Auth'
import { ECOMMERCE_SESSION_RESET_EVENT } from '@/providers/Ecommerce'
import { cssVariables } from '@/cssVariables'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCart, useEcommerce, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import React, { useCallback, useMemo, useState } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

type CompleteOrder = {
  accessToken?: string
  orderID: number | string
  paymentMethod?: 'stripe' | 'venmo'
}

type Props = {
  onOrderComplete: (result: CompleteOrder) => void
}

function PaymentGardenLoader() {
  return (
    <div
      aria-live="polite"
      className="mt-5 overflow-hidden rounded-3xl border border-[#e8ddc7] bg-[#fff8e8] px-4 pb-4 pt-3 text-[#3f351f] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
      role="status"
    >
      <div className="paymentGardenLoaderScene" aria-hidden="true">
        <span className="paymentGardenLoaderCloud paymentGardenLoaderCloudOne" />
        <span className="paymentGardenLoaderCloud paymentGardenLoaderCloudTwo" />
        <span className="paymentGardenLoaderFlower paymentGardenLoaderFlowerOne">
          <span />
        </span>
        <span className="paymentGardenLoaderFlower paymentGardenLoaderFlowerTwo">
          <span />
        </span>
        <span className="paymentGardenLoaderFlower paymentGardenLoaderFlowerThree">
          <span />
        </span>
        <span className="paymentGardenLoaderGround" />
      </div>
      <p className="mt-3 text-sm font-extrabold tracking-[0.08em] text-[#1f3d24] uppercase">
        Growing your secure checkout
      </p>
      <p className="mt-1 text-sm leading-6 text-[#5f4a32]">
        Creating or resuming the Stripe payment. This can take a few seconds locally.
      </p>

      <style jsx>{`
        .paymentGardenLoaderScene {
          background: linear-gradient(180deg, #b9def5 0%, #dff2fb 62%, #f3d66f 63%, #ead15f 100%);
          border-radius: 1.25rem;
          height: 5.5rem;
          overflow: hidden;
          position: relative;
        }

        .paymentGardenLoaderGround {
          background: linear-gradient(90deg, rgba(122, 162, 45, 0.65), rgba(157, 191, 68, 0.86));
          bottom: 0;
          height: 1rem;
          left: 0;
          position: absolute;
          right: 0;
        }

        .paymentGardenLoaderCloud {
          animation: paymentCloudDrift 4.8s ease-in-out infinite;
          background: rgba(255, 255, 255, 0.86);
          border-radius: 999px;
          height: 1rem;
          position: absolute;
          width: 3.8rem;
        }

        .paymentGardenLoaderCloud::before,
        .paymentGardenLoaderCloud::after {
          background: rgba(255, 255, 255, 0.88);
          border-radius: 999px;
          content: '';
          position: absolute;
        }

        .paymentGardenLoaderCloud::before {
          height: 1.7rem;
          left: 0.45rem;
          top: -0.7rem;
          width: 1.9rem;
        }

        .paymentGardenLoaderCloud::after {
          height: 1.55rem;
          right: 0.45rem;
          top: -0.58rem;
          width: 1.75rem;
        }

        .paymentGardenLoaderCloudOne {
          left: 12%;
          top: 1.1rem;
        }

        .paymentGardenLoaderCloudTwo {
          animation-delay: -2.2s;
          right: 10%;
          top: 1.8rem;
          transform: scale(0.82);
        }

        .paymentGardenLoaderFlower {
          animation: paymentFlowerGrow 1.8s cubic-bezier(0.2, 0.9, 0.2, 1) infinite;
          background: #8bbd4a;
          bottom: 0.78rem;
          height: 2.2rem;
          position: absolute;
          transform-origin: center bottom;
          width: 0.16rem;
        }

        .paymentGardenLoaderFlower::before {
          background: #8bbd4a;
          border-radius: 999px 999px 0 999px;
          content: '';
          height: 0.42rem;
          left: -0.42rem;
          position: absolute;
          top: 1.05rem;
          transform: rotate(24deg);
          width: 0.62rem;
        }

        .paymentGardenLoaderFlower::after {
          background: #8bbd4a;
          border-radius: 999px 999px 999px 0;
          content: '';
          height: 0.38rem;
          position: absolute;
          right: -0.48rem;
          top: 1.42rem;
          transform: rotate(-18deg);
          width: 0.58rem;
        }

        .paymentGardenLoaderFlower span {
          background: radial-gradient(circle, #8d6a1c 0 24%, #ffde3f 25% 100%);
          border-radius: 999px;
          box-shadow:
            0 -0.48rem 0 #ffde3f,
            0.48rem 0 0 #ffde3f,
            0 0.48rem 0 #ffde3f,
            -0.48rem 0 0 #ffde3f;
          display: block;
          height: 0.82rem;
          left: 50%;
          position: absolute;
          top: -0.38rem;
          transform: translateX(-50%);
          width: 0.82rem;
        }

        .paymentGardenLoaderFlowerOne {
          animation-delay: -0.2s;
          left: 32%;
        }

        .paymentGardenLoaderFlowerTwo {
          animation-delay: -0.55s;
          left: 51%;
          transform: scale(0.86);
        }

        .paymentGardenLoaderFlowerThree {
          animation-delay: -0.9s;
          left: 70%;
          transform: scale(0.72);
        }

        @keyframes paymentFlowerGrow {
          0%,
          100% {
            transform: scaleY(0.72);
          }

          45% {
            transform: scaleY(1);
          }
        }

        @keyframes paymentCloudDrift {
          0%,
          100% {
            translate: -0.35rem 0;
          }

          50% {
            translate: 0.35rem 0;
          }
        }
      `}</style>
    </div>
  )
}

export function CartModalPayment({ onOrderComplete }: Props) {
  const { user } = useAuth()
  const { cart } = useCart()
  const { clearSession } = useEcommerce()
  const { initiatePayment } = usePayments()
  const [clientSecret, setClientSecret] = useState<null | string>(null)
  const [error, setError] = useState<null | string>(null)
  const [isInitiating, setIsInitiating] = useState(false)
  const [isProcessingPayment, setProcessingPayment] = useState(false)
  const [isSubmittingVenmo, setIsSubmittingVenmo] = useState(false)
  const [showVenmoInstructions, setShowVenmoInstructions] = useState(false)

  const customerEmail = typeof user?.email === 'string' ? user.email : ''
  const customerPhone = typeof user?.phone === 'string' ? user.phone : ''

  const canStartPayment = Boolean(user && (customerEmail || customerPhone || user.id))

  const initiateModalPayment = useCallback(async () => {
    if (!canStartPayment) {
      setError('Log in with an email or phone number before starting payment.')
      return
    }

    try {
      setError(null)
      setIsInitiating(true)

      const paymentData = (await initiatePayment('stripe', {
        additionalData: {},
      })) as Record<string, unknown>

      const nextClientSecret =
        typeof paymentData?.clientSecret === 'string' ? paymentData.clientSecret : ''

      if (!nextClientSecret) {
        throw new Error('Stripe did not return a client secret.')
      }

      setClientSecret(nextClientSecret)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not initiate payment.'
      setError(message)
    } finally {
      setIsInitiating(false)
    }
  }, [canStartPayment, initiatePayment])

  const markVenmoSent = useCallback(async () => {
    if (!canStartPayment) {
      setError('Log in with an email or phone number before reporting a Venmo payment.')
      return
    }

    if (!cart?.id) {
      setError('Your cart is still loading. Try again in a moment.')
      return
    }

    try {
      setError(null)
      setIsSubmittingVenmo(true)

      const response = await fetch('/api/payments/venmo/mark-sent', {
        body: JSON.stringify({
          cartID: cart.id,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const responseData = (await response.json()) as {
        accessToken?: string
        error?: string
        message?: string
        orderID?: number | string
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Could not record the Venmo payment report.')
      }

      if (!responseData.orderID) {
        throw new Error('The Venmo order response did not include an order ID.')
      }

      clearSession()
      window.dispatchEvent(new Event(ECOMMERCE_SESSION_RESET_EVENT))
      onOrderComplete({
        accessToken: responseData.accessToken,
        orderID: responseData.orderID,
        paymentMethod: 'venmo',
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not record the Venmo payment report.'
      setError(message)
    } finally {
      setIsSubmittingVenmo(false)
    }
  }, [canStartPayment, cart?.id, clearSession, onOrderComplete])

  const elementsOptions = useMemo(
    () => ({
      appearance: {
        theme: 'flat' as const,
        variables: {
          borderRadius: '14px',
          colorBackground: '#fffaf0',
          colorDanger: cssVariables.colors.error500,
          colorDangerText: cssVariables.colors.error500,
          colorIcon: '#5f4a32',
          colorPrimary: '#1f3d24',
          colorText: '#2a241a',
          colorTextPlaceholder: '#8b7a62',
          colorTextSecondary: '#5f4a32',
          fontFamily: 'Rubik, system-ui, sans-serif',
          fontSizeBase: '16px',
          fontWeightBold: '700',
          fontWeightNormal: '500',
          spacingUnit: '4px',
        },
        rules: {
          '.Input': {
            backgroundColor: '#fffefa',
            border: '1px solid rgba(74, 58, 35, 0.2)',
            boxShadow: 'none',
            color: '#2a241a',
          },
          '.Input:focus': {
            borderColor: '#1f3d24',
            boxShadow: '0 0 0 3px rgba(31, 61, 36, 0.14)',
          },
          '.Label': {
            color: '#5f4a32',
            fontWeight: '700',
          },
          '.Tab': {
            backgroundColor: '#fffefa',
            border: '1px solid rgba(74, 58, 35, 0.18)',
            boxShadow: 'none',
            color: '#2a241a',
          },
          '.Tab--selected': {
            backgroundColor: '#f5e6bf',
            borderColor: '#1f3d24',
            color: '#1f3d24',
          },
        },
      },
      clientSecret: clientSecret || undefined,
      fonts: [
        {
          cssSrc:
            'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap',
        },
      ],
    }),
    [clientSecret],
  )

  if (isProcessingPayment) {
    return (
      <BakeryCard className="bg-white px-5 py-5" radius="sm" spacing="none">
        <p className="text-2xl font-medium tracking-[-0.04em]">Processing payment</p>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Keep this window open while Stripe confirms the payment.
        </p>
      </BakeryCard>
    )
  }

  return (
    <BakeryCard className="bg-white px-5 py-5" radius="sm" spacing="none">
      <div className="space-y-2">
        <p className="text-2xl font-medium tracking-[-0.04em]">Payment</p>
        <p className="text-sm leading-6 text-black/60">
          Pay securely without leaving the cart. Card details are handled by Stripe, not stored by
          this site.
        </p>
      </div>

      <Message className="mt-4" error={error} />

      {!clientSecret ? (
        <>
          {isInitiating ? <PaymentGardenLoader /> : null}
          <BakeryAction
            block
            className="mt-5"
            disabled={isInitiating || !canStartPayment}
            onClick={initiateModalPayment}
            type="button"
            variant="primary"
          >
            {isInitiating ? 'Starting secure payment' : 'Start secure payment'}
          </BakeryAction>

          <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-black/35">
            <span className="h-px flex-1 bg-black/10" />
            <span>or</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <div className="overflow-hidden rounded-[14px] border border-[#e4d7bd] bg-[#fff8e8] p-4 text-[#3f351f]">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#1f3d24]">
                  Venmo instead
                </p>
                <p className="mt-1 text-sm leading-6 text-[#5f4a32]">
                  Use this only after sending the cart total to @bakedwithblessings.
                </p>
              </div>
              <BakeryAction
                className="max-w-full shrink-0 whitespace-normal rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold leading-tight text-[#1f3d24] transition [white-space:normal] hover:border-black/20 hover:bg-[#f8edd2] sm:max-w-[11rem]"
                onClick={() => setShowVenmoInstructions((current) => !current)}
                size="sm"
                type="button"
                variant="secondary"
              >
                Pay with Venmo
              </BakeryAction>
            </div>

            {showVenmoInstructions ? (
              <div className="mt-4 rounded-[12px] border border-[#d7c69f] bg-white/80 p-4">
                <p className="text-sm leading-6 text-[#4f4429]">
                  Send the cart total to{' '}
                  <a
                    className="font-bold underline decoration-[#9c7a31]/50 underline-offset-4"
                    href="https://venmo.com/u/bakedwithblessings"
                    rel="noreferrer"
                    target="_blank"
                  >
                    @bakedwithblessings
                  </a>
                  . Add your account name or order note in Venmo if you can.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6b5835]">
                  This records the order, but it does not verify the payment automatically. Once the
                  bakery sees the Venmo payment, they will contact you through the email or phone on
                  your account and update the order manually.
                </p>
                <BakeryAction
                  block
                  className="mt-4"
                  disabled={isSubmittingVenmo || !canStartPayment}
                  onClick={markVenmoSent}
                  type="button"
                  variant="primary"
                >
                  {isSubmittingVenmo ? 'Recording Venmo order' : 'I sent it through Venmo'}
                </BakeryAction>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mt-5">
          <Elements options={elementsOptions} stripe={stripePromise}>
            <CheckoutForm
              customerEmail={customerEmail}
              customerPhone={customerPhone}
              onOrderComplete={onOrderComplete}
              setProcessingPayment={setProcessingPayment}
            />
          </Elements>
        </div>
      )}
    </BakeryCard>
  )
}
