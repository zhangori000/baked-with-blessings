'use client'

import { Price } from '@/components/Price'
import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { CartSceneShell } from '@/components/scenery/CartSceneShell'
import { TraySelectionSummary } from '@/components/TraySelectionSummary'
import { BakeryAction, BakeryCard, BakeryPressable } from '@/design-system/bakery'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { menuHref } from '@/utilities/routes'
import { resolveMediaDisplayURL } from '@/utilities/resolveMediaDisplayURL'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ArrowLeft, ArrowRight, CheckCircle2, LogIn, ShoppingBag, UserPlus, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { Product, Variant } from '@/payload-types'
import { useAuth } from '@/providers/Auth'

type CartPanel = 'cart' | 'auth' | 'login' | 'signup' | 'checkout' | 'complete'

type CompleteOrder = {
  accessToken?: string
  orderID: number | string
}

export function CartModal({ renderTrigger = true }: { renderTrigger?: boolean }) {
  const { cart } = useCart()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [panel, setPanel] = useState<CartPanel>('cart')
  const [paintKey, setPaintKey] = useState(0)
  const [completeOrder, setCompleteOrder] = useState<CompleteOrder | null>(null)

  const pathname = usePathname()
  const closeCart = useEffectEvent(() => {
    setIsOpen(false)
  })

  const openCart = useCallback(() => {
    setIsOpen(true)
  }, [])

  useEffect(() => {
    closeCart()
  }, [pathname])

  useEffect(() => {
    window.addEventListener('bwb:open-cart', openCart)
    return () => {
      window.removeEventListener('bwb:open-cart', openCart)
    }
  }, [openCart])

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)

    if (!nextOpen) {
      setPanel('cart')
      setCompleteOrder(null)
    }
  }

  const showPanel = (nextPanel: CartPanel) => {
    setPanel(nextPanel)
    setPaintKey((current) => current + 1)
  }

  const totalQuantity = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  const hasItems = Boolean(cart?.items?.length)
  const modalTitle =
    panel === 'cart' ? 'Cart' : panel === 'complete' ? 'Order received' : 'Checkout'

  return (
    <Sheet onOpenChange={handleOpenChange} open={isOpen}>
      {renderTrigger ? (
        <OpenCartButton
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          quantity={totalQuantity}
        />
      ) : null}

      <SheetContent
        className="!top-1/2 !left-1/2 !right-auto !bottom-auto !h-[calc(100dvh-8px)] !w-[calc(100vw-8px)] !-translate-x-1/2 !-translate-y-1/2 sm:!top-[6.15rem] sm:!bottom-auto sm:!left-auto sm:!right-3 sm:!h-[min(75dvh,calc(100dvh-7rem))] sm:!min-h-[38rem] sm:!w-[min(540px,calc(100vw-24px))] sm:!translate-x-0 sm:!translate-y-0 border border-black/12 rounded-[8px] bg-[#fffefa] p-0 text-black shadow-none"
        hideClose
        onEscapeKeyDown={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
        onPointerDownOutside={() => setIsOpen(false)}
        overlayClassName="bg-[rgba(244,240,232,0.26)]"
        side="top"
      >
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[8px]">
          <CartSceneShell
            className="cartModalHeaderScene border-b border-black/8 px-4 py-3"
            contentClassName="pr-14"
            hideSheep
            variant="compact"
          >
            <SheetHeader className="space-y-0 border-none p-0 text-left">
              <div className="flex min-h-[5rem] items-start justify-between gap-4">
                <div className="flex h-full items-start">
                  <div className="cartModalHeaderTitleWrap">
                    <SheetTitle className="cartModalHeaderTitle">{modalTitle}</SheetTitle>
                  </div>
                  <SheetDescription className="sr-only">
                    {panel === 'complete' ? 'Your order is confirmed.' : 'Cart checkout panel'}
                  </SheetDescription>
                </div>

                <SheetClose asChild>
                  <BakeryPressable
                    aria-label="Close cart"
                    className="absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/12 bg-white/95 text-black shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition duration-200 hover:-translate-y-0.5 hover:border-black/20 hover:bg-black hover:text-white"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </BakeryPressable>
                </SheetClose>
              </div>
            </SheetHeader>
          </CartSceneShell>

          <div className="flex items-center justify-between border-b border-black/8 bg-[#fffefa] px-4 py-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-medium text-black/65">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>
                [{totalQuantity ?? 0} item{totalQuantity === 1 ? '' : 's'}]
              </span>
            </div>
          </div>

          <div
            className={`cartModalPanelStage flex min-h-0 flex-1 flex-col ${panel !== 'cart' ? 'is-revealing' : ''}`}
            key={`${panel}-${paintKey}`}
          >
            {!hasItems && panel !== 'complete' ? (
              <div className="flex flex-1 flex-col px-4 py-4">
                <CartSceneShell
                  className="flex min-h-0 flex-1 items-center justify-center rounded-[6px] border border-black/8 px-6 py-8 text-center"
                  contentClassName="mx-auto max-w-[20rem] space-y-5"
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-white">
                    <ShoppingBag className="h-8 w-8 text-black/70" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-2xl font-medium tracking-[-0.04em]">Your cart is empty.</p>
                    <p className="text-sm leading-6 text-black/60">
                      Add a few bakery items first, then come back here to review quantity and
                      checkout.
                    </p>
                  </div>

                  <BakeryAction
                    as={Link}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white transition duration-200 hover:bg-black/85"
                    href={menuHref}
                    size="md"
                    variant="primary"
                  >
                    Browse the menu
                    <ArrowRight className="h-4 w-4" />
                  </BakeryAction>
                </CartSceneShell>
              </div>
            ) : panel === 'auth' ? (
              <CartAuthGate
                onBack={() => showPanel('cart')}
                onSuccess={() => showPanel('checkout')}
              />
            ) : panel === 'login' ? (
              <CartLoginPanel
                onBack={() => showPanel('auth')}
                onSuccess={() => showPanel('checkout')}
              />
            ) : panel === 'signup' ? (
              <CartSignupPanel
                onBack={() => showPanel('auth')}
                onSuccess={() => showPanel('checkout')}
              />
            ) : panel === 'checkout' ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <BakeryAction
                  className="mb-4 inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-black/70 transition hover:border-black/20 hover:bg-black hover:text-white"
                  onClick={() => showPanel('cart')}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to cart
                </BakeryAction>

                <CartPaymentPlaceholder />
              </div>
            ) : panel === 'complete' && completeOrder ? (
              <CartCompletePanel order={completeOrder} onClose={() => setIsOpen(false)} />
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-0">
                  <ul className="divide-y divide-black/10">
                    {cart?.items?.map((item, index) => {
                      const product = item.product
                      const variant = item.variant

                      if (typeof product !== 'object' || !item || !product || !product.slug) {
                        return <React.Fragment key={index} />
                      }

                      const metaImage =
                        product.meta?.image && typeof product.meta.image === 'object'
                          ? product.meta.image
                          : undefined

                      const firstGalleryImage =
                        typeof product.gallery?.[0]?.image === 'object'
                          ? product.gallery[0].image
                          : undefined

                      let image = firstGalleryImage || metaImage
                      let price = product.priceInUSD
                      const isVariant = Boolean(variant) && typeof variant === 'object'

                      if (isVariant) {
                        price = variant?.priceInUSD

                        const imageVariant = product.gallery?.find(
                          (galleryItem: NonNullable<Product['gallery']>[number]) => {
                            if (!galleryItem.variantOption) return false

                            const variantOptionID =
                              typeof galleryItem.variantOption === 'object'
                                ? galleryItem.variantOption.id
                                : galleryItem.variantOption

                            return (
                              variant?.options?.some((option: Variant['options'][number]) => {
                                if (typeof option === 'object') return option.id === variantOptionID
                                return option === variantOptionID
                              }) || false
                            )
                          },
                        )

                        if (imageVariant && typeof imageVariant.image === 'object') {
                          image = imageVariant.image
                        }
                      }

                      const resolvedImageSrc = resolveMediaDisplayURL(image)

                      return (
                        <li className="bg-[#fffefa] px-0 py-4" key={index}>
                          <BakeryCard
                            className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3.5 bg-white/72 px-2.5 py-2.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4"
                            radius="sm"
                            spacing="none"
                          >
                            <div
                              aria-hidden="true"
                              className="cartModalItemThumb relative h-28 w-28 shrink-0 overflow-hidden rounded-[6px] sm:h-[7.5rem] sm:w-[7.5rem]"
                            >
                              {resolvedImageSrc ? (
                                <Image
                                  alt={image.alt || product.title || ''}
                                  className="cartModalItemThumbImage"
                                  fill
                                  quality={95}
                                  sizes="(min-width: 640px) 192px, 160px"
                                  src={resolvedImageSrc}
                                />
                              ) : null}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <p className="text-xs font-medium text-black/45">
                                    {isVariant ? 'Configured item' : 'Bakery item'}
                                  </p>
                                  <p className="block text-base font-semibold leading-5 text-black sm:text-lg sm:leading-6">
                                    {product.title}
                                  </p>
                                  {isVariant && variant ? (
                                    <p className="text-sm leading-6 text-black/60 capitalize">
                                      {variant.options
                                        ?.map((option: Variant['options'][number]) => {
                                          if (typeof option === 'object') return option.label
                                          return null
                                        })
                                        .filter(Boolean)
                                        .join(', ')}
                                    </p>
                                  ) : null}
                                  <TraySelectionSummary
                                    className="mt-2 max-h-28 overflow-y-auto pr-1"
                                    label="Exact tray contents"
                                    selections={item.batchSelections}
                                    tone="muted"
                                  />
                                </div>

                                <DeleteItemButton item={item} />
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="inline-flex items-center rounded-full border border-black/10 bg-black/[0.03] px-1 py-1">
                                  <EditItemQuantityButton item={item} type="minus" />
                                  <span className="w-8 text-center text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <EditItemQuantityButton item={item} type="plus" />
                                </div>

                                {typeof price === 'number' ? (
                                  <Price
                                    amount={price}
                                    className="text-lg font-medium text-black"
                                  />
                                ) : null}
                              </div>
                            </div>
                          </BakeryCard>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div className="shrink-0 border-t border-black/10 bg-[#fffefa] px-4 py-2.5">
                  <div className="mb-2 flex items-center justify-between gap-3 border-b border-black/8 pb-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-black/45">
                        Subtotal
                      </p>
                      <p className="mt-0.5 text-[13px] leading-5 text-black/60">
                        Shipping and taxes are calculated during checkout.
                      </p>
                    </div>

                    {typeof cart?.subtotal === 'number' ? (
                      <Price amount={cart.subtotal} className="text-xl font-medium text-black" />
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <BakeryAction
                      as={Link}
                      block
                      className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-black/85"
                      href="#cart-checkout"
                      onClick={(event) => {
                        event.preventDefault()
                        showPanel(user ? 'checkout' : 'auth')
                      }}
                      size="md"
                      variant="primary"
                    >
                      Proceed to checkout
                    </BakeryAction>

                    <SheetClose asChild>
                      <BakeryPressable
                        className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-transparent px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:border-black/20 hover:bg-white/70"
                        type="button"
                      >
                        Keep browsing
                      </BakeryPressable>
                    </SheetClose>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <style>{`
          .cartModalItemThumb {
            background: transparent;
          }

          .cartModalPanelStage {
            background: #fffefa;
          }

          .cartModalPanelStage.is-revealing {
            animation: cartModalPanelReveal 980ms cubic-bezier(0.83, 0, 0.17, 1) both;
            transform-origin: top;
          }

          .cartModalItemThumbImage {
            filter: drop-shadow(0 12px 18px rgba(17, 17, 17, 0.14));
            object-fit: cover;
            padding: 0;
          }

          .cartSceneShell {
            isolation: isolate;
            overflow: hidden;
            position: relative;
          }

          .cartSceneSky,
          .cartSceneMeadow,
          .cartSceneCloud,
          .cartScenePiece {
            pointer-events: none;
            position: absolute;
          }

          .cartSceneSky {
            height: 100%;
            inset: 0;
            object-fit: cover;
            width: 100%;
            z-index: 0;
          }

          .cartSceneCloud {
            animation: cartSceneCloudBob 9.2s ease-in-out infinite;
            opacity: 0.94;
            z-index: 1;
          }

          .cartScenePiece {
            transform-origin: center bottom;
            z-index: 1;
          }

          .cartSceneMeadow {
            bottom: -0.3rem;
            height: clamp(4.5rem, 24%, 6.6rem);
            left: 0;
            object-fit: cover;
            object-position: center bottom;
            width: 100%;
            z-index: 0;
          }

          .cartModalHeaderScene {
            min-height: 6.6rem;
            height: 6.6rem;
          }

          .cartModalHeaderTitle {
            color: #fffefa;
            text-transform: none;
            font-family: var(
              --font-catering-serif,
              'Cormorant Garamond',
              'Iowan Old Style',
              'Palatino Linotype',
              serif
            );
            font-size: clamp(2.1rem, 10vw, 3rem);
            font-weight: 800;
            line-height: 0.9;
            letter-spacing: -0.035em;
            text-shadow:
              0 1px 0 rgba(255, 255, 255, 0.22),
              0 12px 28px rgba(17, 44, 75, 0.34),
              0 0 20px rgba(255, 255, 255, 0.22);
          }

          .cartModalHeaderTitleWrap {
            border: 1px solid rgba(255, 255, 255, 0.24);
            border-radius: 0.95rem;
            padding: 0.45rem 0.88rem;
            background: linear-gradient(
              180deg,
              rgba(17, 28, 44, 0.26),
              rgba(17, 28, 44, 0.18)
            );
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.22),
              0 10px 24px rgba(8, 16, 27, 0.28);
            backdrop-filter: blur(8px);
          }

          .cartAuthPanelSurface {
            border: 1px solid rgba(74, 58, 35, 0.22);
            border-radius: 0.9rem;
            background: linear-gradient(
              152deg,
              rgba(255, 252, 244, 0.82),
              rgba(255, 254, 250, 0.72)
            );
            box-shadow: 0 16px 32px rgba(19, 30, 46, 0.14);
            backdrop-filter: blur(9px);
          }

          .cartAuthGlassButton {
            border: 1px solid rgba(74, 58, 35, 0.22);
            background: rgba(255, 252, 244, 0.52);
            color: rgba(28, 25, 16, 0.86);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.44);
          }

          .cartAuthGlassButton:hover {
            background: rgba(255, 252, 244, 0.72);
            border-color: rgba(74, 58, 35, 0.36);
          }

          .cartAuthPrimaryButton {
            border: 1px solid rgba(18, 30, 51, 0.24);
            color: #fffefa;
            background: linear-gradient(180deg, #18293f, #111e33);
            letter-spacing: 0.02em;
            box-shadow: 0 12px 24px rgba(10, 16, 28, 0.18);
          }

          .cartAuthPrimaryButton:hover {
            filter: brightness(1.06);
          }

          .cartAuthInput {
            min-height: 2.65rem;
            border-color: rgba(74, 58, 35, 0.28);
            background: rgba(255, 254, 248, 0.72);
            color: #2a241a;
            font-size: 0.95rem;
            line-height: 1.4rem;
          }

          .cartAuthInput::placeholder {
            color: rgba(74, 58, 35, 0.56);
          }

          .cartAuthInput:focus-visible {
            border-color: rgba(31, 43, 77, 0.55);
            box-shadow: 0 0 0 3px rgba(31, 43, 77, 0.18);
          }

          .cartAuthLabel {
            color: rgba(31, 43, 77, 0.72);
            text-transform: uppercase;
            letter-spacing: 0.14em;
            font-size: 0.68rem;
            font-weight: 600;
          }

          .cartAuthError {
            color: #7a2b24;
          }

          .cartAuthHint {
            color: rgba(31, 43, 77, 0.6);
          }

          @media (max-width: 767px) {
            .cartModalHeaderScene {
              height: 20svh;
              min-height: 20svh;
            }
          }

          @keyframes cartSceneCloudBob {
            0%,
            100% {
              transform: translate3d(0, 0, 0);
            }

            50% {
              transform: translate3d(0, -6px, 0);
            }
          }

          @keyframes cartModalPanelReveal {
            0% {
              clip-path: inset(0 0 100% 0);
              transform: translateY(-0.35rem);
            }

            100% {
              clip-path: inset(0 0 0 0);
              transform: translateY(0);
            }
          }
        `}</style>
      </SheetContent>
    </Sheet>
  )
}

function CartPaymentPlaceholder() {
  return (
    <BakeryCard className="bg-white px-5 py-5" radius="sm" spacing="none">
      <div className="space-y-2">
        <p className="text-2xl font-medium tracking-[-0.04em]">Payment</p>
        <p className="text-sm leading-6 text-black/60">
          This is the in-cart payment step. Stripe is intentionally paused here while the modal UI
          flow is refined.
        </p>
      </div>

      <BakeryCard
        className="mt-5 border-dashed border-black/15 bg-[#fffefa] px-4 py-8 text-center"
        radius="sm"
        spacing="none"
        tone="outline"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/45">
          Payment element placeholder
        </p>
      </BakeryCard>

      <BakeryAction block className="mt-5" disabled type="button" variant="primary">
        Initiate payment
      </BakeryAction>
    </BakeryCard>
  )
}

function CartAuthGate({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [expandedForm, setExpandedForm] = useState<null | 'login' | 'signup'>(null)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <BakeryCard
        className="cartAuthPanelSurface flex min-h-full flex-col gap-6 px-5 py-5"
        radius="sm"
        spacing="none"
      >
        <div className="space-y-4">
          <BakeryAction
            className="inline-flex h-10 items-center gap-2 rounded-full cartAuthGlassButton px-4 text-sm font-medium transition"
            onClick={onBack}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to cart
          </BakeryAction>

          <div className="space-y-2">
            <p className="text-2xl font-semibold leading-tight text-[#1a2232]">
              Sign in or create an account
            </p>
            <p className="cartAuthHint max-w-[34rem] text-sm leading-6">
              Use email or phone with your password, then continue directly to payment.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <BakeryCard
            as="button"
            className="cartAuthGlassButton flex items-center justify-between rounded-[10px] px-4 py-4 text-left transition"
            interactive
            onClick={() => setExpandedForm((current) => (current === 'login' ? null : 'login'))}
            radius="md"
            spacing="none"
            tone="transparent"
            type="button"
          >
            <span>
              <span className="block text-sm font-medium text-[#2b1d14]">Log in</span>
              <span className="mt-1 block text-xs leading-5 cartAuthHint">
                Use an existing email or phone account.
              </span>
            </span>
            <LogIn className="h-5 w-5 text-[#5f4a32]" />
          </BakeryCard>

          {expandedForm === 'login' ? <CartLoginPanel embedded onSuccess={onSuccess} /> : null}

          <BakeryCard
            as="button"
            className="cartAuthGlassButton flex items-center justify-between rounded-[10px] px-4 py-4 text-left transition"
            interactive
            onClick={() => setExpandedForm((current) => (current === 'signup' ? null : 'signup'))}
            radius="md"
            spacing="none"
            tone="transparent"
            type="button"
          >
            <span>
              <span className="block text-sm font-medium text-[#2b1d14]">Create account</span>
              <span className="mt-1 block text-xs leading-5 cartAuthHint">
                Add email, phone, or both before payment.
              </span>
            </span>
            <UserPlus className="h-5 w-5 text-[#5f4a32]" />
          </BakeryCard>

          {expandedForm === 'signup' ? <CartSignupPanel embedded onSuccess={onSuccess} /> : null}
        </div>
      </BakeryCard>
    </div>
  )
}

type LoginFormData = {
  identifier: string
  password: string
}

function CartLoginPanel({
  embedded = false,
  onBack,
  onSuccess,
}: {
  embedded?: boolean
  onBack?: () => void
  onSuccess: () => void
}) {
  const { login } = useAuth()
  const [error, setError] = useState<null | string>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormData>()

  return (
    <div className={embedded ? '' : 'min-h-0 flex-1 overflow-y-auto px-4 py-4'}>
      <BakeryCard
        as="form"
        className="cartAuthPanelSurface space-y-5 rounded-[6px] px-5 py-5"
        onSubmit={handleSubmit(async (data) => {
          try {
            setError(null)
            await login(data)
            onSuccess()
          } catch {
            setError('There was an error with the credentials provided. Please try again.')
          }
        })}
      >
        {onBack ? (
          <BakeryAction
            className="inline-flex h-10 items-center gap-2 rounded-full cartAuthGlassButton px-4 text-sm font-medium transition"
            onClick={onBack}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </BakeryAction>
        ) : null}

        <Message className="cartAuthHint" error={error} />

        <FormItem>
          <Label className="cartAuthLabel" htmlFor="cart-login-identifier">
            Email or phone
          </Label>
          <Input
            id="cart-login-identifier"
            type="text"
            className="cartAuthInput"
            {...register('identifier', { required: 'Email address or phone number is required.' })}
          />
          {errors.identifier && (
            <FormError className="cartAuthError" message={errors.identifier.message} />
          )}
        </FormItem>

        <FormItem>
          <Label className="cartAuthLabel" htmlFor="cart-login-password">
            Password
          </Label>
          <Input
            id="cart-login-password"
            type="password"
            className="cartAuthInput"
            {...register('password', { required: 'Please provide a password.' })}
          />
          {errors.password && (
            <FormError className="cartAuthError" message={errors.password.message} />
          )}
        </FormItem>

        <BakeryAction
          block
          className="cartAuthPrimaryButton h-11 w-full rounded-full"
          disabled={isSubmitting}
          size="md"
          type="submit"
          variant="primary"
        >
          {isSubmitting ? 'Processing' : 'Continue to payment'}
        </BakeryAction>
      </BakeryCard>
    </div>
  )
}

type SignupFormData = {
  email: string
  name: string
  password: string
  passwordConfirm: string
  phone: string
  verificationCode: string
}

function CartSignupPanel({
  embedded = false,
  onBack,
  onSuccess,
}: {
  embedded?: boolean
  onBack?: () => void
  onSuccess: () => void
}) {
  const { create } = useAuth()
  const [error, setError] = useState<null | string>(null)
  const [maskedPhone, setMaskedPhone] = useState<null | string>(null)
  const [requiresPhoneVerification, setRequiresPhoneVerification] = useState(false)
  const {
    clearErrors,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError: setFieldError,
  } = useForm<SignupFormData>()

  const password = useWatch({ control, defaultValue: '', name: 'password' })
  const phone = useWatch({ control, defaultValue: '', name: 'phone' })

  return (
    <div className={embedded ? '' : 'min-h-0 flex-1 overflow-y-auto px-4 py-4'}>
      <BakeryCard
        as="form"
        className="cartAuthPanelSurface space-y-5 rounded-[6px] px-5 py-5"
        onSubmit={handleSubmit(async (data) => {
          const trimmedEmail = data.email.trim()
          const trimmedPhone = data.phone.trim()

          setError(null)

          if (!trimmedEmail && !trimmedPhone) {
            setFieldError('email', {
              message: 'Enter at least an email address or a phone number.',
              type: 'contact-required',
            })
            setFieldError('phone', {
              message: 'Enter at least an email address or a phone number.',
              type: 'contact-required',
            })
            return
          }

          try {
            const result = await create(data)

            if (result.requiresPhoneVerification) {
              setMaskedPhone(result.maskedPhone || trimmedPhone)
              setRequiresPhoneVerification(true)
              return
            }

            onSuccess()
          } catch {
            setError('There was an error creating the account. Please try again.')
          }
        })}
      >
        {onBack ? (
          <BakeryAction
            className="inline-flex h-10 items-center gap-2 rounded-full cartAuthGlassButton px-4 text-sm font-medium transition"
            onClick={onBack}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </BakeryAction>
        ) : null}

        <Message className="cartAuthHint" error={error} />

        <FormItem>
          <Label className="cartAuthLabel" htmlFor="cart-signup-name">
            Name
          </Label>
          <Input
            className="cartAuthInput"
            id="cart-signup-name"
            type="text"
            {...register('name')}
          />
        </FormItem>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormItem>
            <Label className="cartAuthLabel" htmlFor="cart-signup-email">
              Email address
            </Label>
            <Input
              id="cart-signup-email"
              type="email"
              className="cartAuthInput"
              {...register('email', {
                onChange: () => {
                  clearErrors(['email', 'phone'])
                },
                validate: (value) =>
                  !value.trim() || /\S+@\S+\.\S+/.test(value) || 'Enter a valid email address.',
              })}
            />
            {errors.email && <FormError className="cartAuthError" message={errors.email.message} />}
          </FormItem>

          <FormItem>
            <Label className="cartAuthLabel" htmlFor="cart-signup-phone">
              Phone number
            </Label>
            <Input
              id="cart-signup-phone"
              inputMode="tel"
              type="tel"
              className="cartAuthInput"
              {...register('phone', {
                onChange: () => {
                  clearErrors(['email', 'phone'])
                },
              })}
            />
            {errors.phone && <FormError className="cartAuthError" message={errors.phone.message} />}
          </FormItem>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormItem>
            <Label className="cartAuthLabel" htmlFor="cart-signup-password">
              Password
            </Label>
            <Input
              id="cart-signup-password"
              type="password"
              className="cartAuthInput"
              {...register('password', { required: 'Password is required.' })}
            />
            {errors.password && (
              <FormError className="cartAuthError" message={errors.password.message} />
            )}
          </FormItem>

          <FormItem>
            <Label className="cartAuthLabel" htmlFor="cart-signup-password-confirm">
              Confirm password
            </Label>
            <Input
              id="cart-signup-password-confirm"
              type="password"
              className="cartAuthInput"
              {...register('passwordConfirm', {
                required: 'Please confirm your password.',
                validate: (value) => value === password || 'The passwords do not match.',
              })}
            />
            {errors.passwordConfirm && (
              <FormError className="cartAuthError" message={errors.passwordConfirm.message} />
            )}
          </FormItem>
        </div>

        {requiresPhoneVerification ? (
          <FormItem>
            <Label className="cartAuthLabel" htmlFor="cart-signup-verification-code">
              Verification code
            </Label>
            <Input
              id="cart-signup-verification-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              type="text"
              className="cartAuthInput"
              {...register('verificationCode', {
                required: `Enter the 6-digit code sent to ${maskedPhone || phone || 'your phone'}.`,
                validate: (value) =>
                  /^\d{6}$/.test(value.trim()) || 'Enter a valid 6-digit verification code.',
              })}
            />
            {errors.verificationCode && (
              <FormError className="cartAuthError" message={errors.verificationCode.message} />
            )}
          </FormItem>
        ) : null}

        <BakeryAction
          block
          className="cartAuthPrimaryButton h-11 w-full rounded-full"
          disabled={isSubmitting}
          size="md"
          type="submit"
          variant="primary"
        >
          {isSubmitting
            ? 'Processing'
            : requiresPhoneVerification
              ? 'Verify and continue'
              : phone.trim()
                ? 'Send code'
                : 'Create account and continue'}
        </BakeryAction>
      </BakeryCard>
    </div>
  )
}

function CartCompletePanel({ onClose, order }: { onClose: () => void; order: CompleteOrder }) {
  const orderHref = `/orders/${order.orderID}${order.accessToken ? `?accessToken=${order.accessToken}` : ''}`

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
      <BakeryCard
        className="flex min-h-full flex-col items-center justify-center gap-5 bg-white px-6 py-8 text-center"
        radius="sm"
        spacing="none"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-[#fffefa]">
          <CheckCircle2 className="h-8 w-8 text-black/75" />
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-medium tracking-[-0.05em]">Order received.</p>
          <p className="text-sm leading-6 text-black/60">
            Payment went through and the cart has been cleared.
          </p>
        </div>

        <div className="grid w-full max-w-[22rem] gap-2">
          <BakeryAction
            as={Link}
            block
            className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white transition duration-200 hover:bg-black/85"
            href={orderHref}
            onClick={onClose}
            size="md"
            variant="primary"
          >
            View order
          </BakeryAction>
          <BakeryAction
            block
            className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-transparent px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition duration-200 hover:border-black/20 hover:bg-white/70"
            onClick={onClose}
            size="md"
            type="button"
            variant="secondary"
          >
            Close
          </BakeryAction>
        </div>
      </BakeryCard>
    </div>
  )
}
