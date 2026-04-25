'use client'

import { Price } from '@/components/Price'
import { CartSceneShell } from '@/components/scenery/CartSceneShell'
import { TraySelectionSummary } from '@/components/TraySelectionSummary'
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
import { ArrowRight, ShoppingBag, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useEffectEvent, useMemo, useState } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { Product, Variant } from '@/payload-types'

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

  const hasItems = Boolean(cart?.items?.length)

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <OpenCartButton
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        quantity={totalQuantity}
      />

      <SheetContent
        className="!top-1/2 !left-1/2 !right-auto !bottom-auto !h-[calc(100dvh-8px)] !w-[calc(100vw-8px)] !-translate-x-1/2 !-translate-y-1/2 sm:!top-[6.15rem] sm:!bottom-auto sm:!left-auto sm:!right-3 sm:!h-[min(42rem,calc(100dvh-7rem))] sm:!w-[min(430px,calc(100vw-24px))] sm:!translate-x-0 sm:!translate-y-0 border border-black/12 rounded-[8px] bg-[#fffefa] p-0 text-black shadow-none"
        hideClose
        onEscapeKeyDown={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
        onPointerDownOutside={() => setIsOpen(false)}
        overlayClassName="bg-[rgba(244,240,232,0.26)]"
        side="top"
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[8px]">
          <CartSceneShell
            className="border-b border-black/8 px-4 py-3"
            contentClassName="pr-16"
          >
            <SheetHeader className="space-y-0 border-none p-0 text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-[4px] border border-black/10 bg-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-black/65">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>{totalQuantity ?? 0} item{totalQuantity === 1 ? '' : 's'}</span>
                  </div>

                  <div className="space-y-1">
                    <SheetTitle className="text-[22px] font-medium tracking-[-0.05em]">
                      Cart
                    </SheetTitle>
                    <SheetDescription className="max-w-[24ch] text-[13px] leading-5 text-black/58">
                      Review the order before checkout.
                    </SheetDescription>
                  </div>
                </div>

                <SheetClose asChild>
                  <button
                    aria-label="Close cart"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black/70 transition duration-200 hover:border-black/20 hover:bg-black hover:text-white"
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
                className="flex min-h-0 flex-1 items-center justify-center rounded-[6px] border border-black/8 px-6 py-8 text-center"
                contentClassName="mx-auto max-w-[20rem] space-y-5"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-white">
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
                      <li
                        className="bg-white px-0 py-4"
                        key={index}
                      >
                        <div className="flex gap-3.5 sm:gap-4">
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

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-black/45">
                                  {isVariant ? 'Configured item' : 'Bakery item'}
                                </p>
                                <p className="block text-lg font-medium leading-6 tracking-[-0.03em] text-black">
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

                            <div className="mt-3 flex items-end justify-between gap-3">
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

              <div className="shrink-0 border-t border-black/10 bg-[#fffefa] px-4 py-2.5">
                <div className="mb-2 flex items-center justify-between gap-3 border-b border-black/8 pb-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-black/45">Subtotal</p>
                    <p className="mt-0.5 text-[13px] leading-5 text-black/60">
                      Shipping and taxes are calculated during checkout.
                    </p>
                  </div>

                  {typeof cart?.subtotal === 'number' ? (
                    <Price amount={cart.subtotal} className="text-xl font-medium text-black" />
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Link
                    className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.24em] text-white transition duration-200 hover:bg-black/85"
                    href="/checkout"
                  >
                    Proceed to checkout
                  </Link>

                  <SheetClose asChild>
                    <button
                      className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-transparent px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.24em] text-black transition duration-200 hover:border-black/20 hover:bg-white/70"
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
          .cartModalItemThumb {
            background: transparent;
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
