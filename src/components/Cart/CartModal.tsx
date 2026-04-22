'use client'

import { Price } from '@/components/Price'
import { CartSceneShell } from '@/components/scenery/CartSceneShell'
import { TraySelectionSummary } from '@/components/TraySelectionSummary'
import { menuHref } from '@/utilities/routes'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ArrowRight, ShoppingBag, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useEffectEvent, useMemo, useState } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { Product, Variant } from '@/payload-types'

const FREE_SHIPPING_THRESHOLD = 100

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function CartModal() {
  const { cart } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const pathname = usePathname()
  const closeCart = useEffectEvent(() => {
    setIsOpen(false)
  })

  useEffect(() => {
    closeCart()
  }, [pathname])

  const totalQuantity = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  const subtotal = typeof cart?.subtotal === 'number' ? cart.subtotal : 0
  const amountUntilFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingProgress = Math.max(0, Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD))
  const hasItems = Boolean(cart?.items?.length)

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <OpenCartButton quantity={totalQuantity} />
      </SheetTrigger>

      <SheetContent
        className="!top-2 !right-2 !bottom-2 !left-2 !h-[calc(100dvh-16px)] !w-[calc(100vw-16px)] sm:!top-4 sm:!bottom-4 sm:!right-4 sm:!left-auto sm:!h-[calc(100dvh-32px)] sm:!w-[min(430px,calc(100vw-24px))] border border-black/10 border-l-0 rounded-[28px] bg-[#f7f3ea]/92 p-0 text-black shadow-none backdrop-blur-xl"
        hideClose
        overlayClassName="bg-[rgba(244,240,232,0.34)] backdrop-blur-md"
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px]">
          <CartSceneShell
            className="border-b border-black/8 px-5 py-5"
            contentClassName="pr-24"
          >
            <SheetHeader className="space-y-0 border-none p-0 text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/76 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-black/65 shadow-[0_6px_18px_rgba(17,17,17,0.06)]">
                    <ShoppingBag className="h-4 w-4" />
                    <span>{totalQuantity ?? 0} item{totalQuantity === 1 ? '' : 's'}</span>
                  </div>

                  <div className="space-y-2">
                    <SheetTitle className="text-[28px] font-medium tracking-[-0.05em]">
                      Cart
                    </SheetTitle>
                    <SheetDescription className="max-w-[28ch] text-sm leading-6 text-black/62">
                      Review the order before checkout. The cart now follows the same scene tone as
                      the homepage and menu.
                    </SheetDescription>
                  </div>
                </div>

                <SheetClose asChild>
                  <button
                    aria-label="Close cart"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/88 text-black/70 shadow-[0_6px_18px_rgba(17,17,17,0.08)] transition duration-200 hover:border-black/20 hover:bg-black hover:text-white"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </SheetClose>
              </div>
            </SheetHeader>
          </CartSceneShell>

          {!hasItems ? (
            <div className="flex flex-1 flex-col px-4 py-4">
              <CartSceneShell
                className="flex min-h-0 flex-1 items-center justify-center rounded-[24px] border border-black/8 px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                contentClassName="mx-auto max-w-[20rem] space-y-5"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-white/84 shadow-[0_12px_26px_rgba(17,17,17,0.08)]">
                  <ShoppingBag className="h-8 w-8 text-black/70" />
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-medium tracking-[-0.04em]">Your cart is empty.</p>
                  <p className="text-sm leading-6 text-black/60">
                    Add a few bakery items first, then come back here to review quantity and checkout.
                  </p>
                </div>

                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white transition duration-200 hover:bg-black/85"
                  href={menuHref}
                >
                  Browse the menu
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CartSceneShell>
            </div>
          ) : (
            <>
              <div className="border-b border-black/8 px-5 py-4">
                <div className="h-1 rounded-full bg-black/8">
                  <div
                    className="h-full rounded-full bg-black transition-[width] duration-500 ease-out"
                    style={{ width: `${freeShippingProgress * 100}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em] text-black/55">
                  <span>
                    {amountUntilFreeShipping > 0
                      ? 'Delivery threshold progress'
                      : 'Delivery threshold reached'}
                  </span>
                  {typeof cart?.subtotal === 'number' ? (
                    <Price amount={cart.subtotal} className="text-sm text-black" />
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-6 text-black/65">
                  {amountUntilFreeShipping > 0
                    ? `You are ${currencyFormatter.format(amountUntilFreeShipping)} away from free shipping on orders over ${currencyFormatter.format(FREE_SHIPPING_THRESHOLD)}.`
                    : 'This order has crossed the free-shipping threshold.'}
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28">
                <ul className="space-y-3">
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

                    return (
                      <li
                        className="rounded-[24px] border border-black/8 bg-white/72 p-4"
                        key={index}
                      >
                        <div className="flex gap-4">
                          <Link
                            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-[#ece6d8]"
                            href={`/products/${(item.product as Product).slug}`}
                          >
                            {image?.url ? (
                              <Image
                                alt={image.alt || product.title || ''}
                                className="h-full w-full object-cover"
                                fill
                                sizes="96px"
                                src={image.url}
                              />
                            ) : null}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-black/45">
                                  {isVariant ? 'Configured item' : 'Bakery item'}
                                </p>
                                <Link
                                  className="block text-lg font-medium leading-6 tracking-[-0.03em] text-black"
                                  href={`/products/${(item.product as Product).slug}`}
                                >
                                  {product.title}
                                </Link>
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
                                  className="mt-3"
                                  label="Exact tray contents"
                                  selections={item.batchSelections}
                                  tone="muted"
                                />
                              </div>

                              <DeleteItemButton item={item} />
                            </div>

                            <div className="mt-4 flex items-end justify-between gap-3">
                              <div className="inline-flex items-center rounded-full border border-black/10 bg-black/[0.03] px-1 py-1">
                                <EditItemQuantityButton item={item} type="minus" />
                                <span className="w-8 text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                <EditItemQuantityButton item={item} type="plus" />
                              </div>

                              {typeof price === 'number' ? (
                                <Price amount={price} className="text-lg font-medium text-black" />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="sticky bottom-0 z-10 border-t border-black/8 bg-white/88 px-5 py-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-black/8 pb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-black/45">Subtotal</p>
                    <p className="mt-1 text-sm leading-6 text-black/60">
                      Shipping and taxes are calculated during checkout.
                    </p>
                  </div>

                  {typeof cart?.subtotal === 'number' ? (
                    <Price amount={cart.subtotal} className="text-2xl font-medium text-black" />
                  ) : null}
                </div>

                <div className="space-y-3">
                  <Link
                    className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-white transition duration-200 hover:bg-black/85"
                    href="/checkout"
                  >
                    Proceed to checkout
                  </Link>

                  <SheetClose asChild>
                    <button
                      className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-transparent px-5 py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition duration-200 hover:border-black/20 hover:bg-white/70"
                      type="button"
                    >
                      Keep browsing
                    </button>
                  </SheetClose>
                </div>
              </div>
            </>
          )}
        </div>

        <style>{`
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

          @keyframes cartSceneCloudBob {
            0%,
            100% {
              transform: translate3d(0, 0, 0);
            }

            50% {
              transform: translate3d(0, -6px, 0);
            }
          }
        `}</style>
      </SheetContent>
    </Sheet>
  )
}
