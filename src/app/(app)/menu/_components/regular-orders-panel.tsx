'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ChevronDownIcon, Minus, Plus } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Price } from '@/components/Price'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { BakeryCard, BakeryPressable, SceneButton } from '@/design-system/bakery'
import { cn } from '@/utilities/cn'

import { CookieInfoNote } from './CookieInfoNote'
import { CookieSheepRig } from './cookie-sheep-rig'
import type { RegularOrderItem, RegularOrderSize } from './catering-menu-types'

const MAX_QUANTITY = 50

type RegularOrdersPanelProps = {
  items: RegularOrderItem[]
  seasonalLabel: string
}

const resolveSizes = (item: RegularOrderItem): RegularOrderSize[] => {
  if (item.sizes.length > 0) {
    return item.sizes
  }

  // No published size variants yet (e.g. a brand-new flavor before the
  // lineup script runs): sell the bare product at its base price.
  if (typeof item.priceInUSD === 'number' && item.priceInUSD > 0) {
    return [
      {
        label: 'Standard',
        priceInUSD: item.priceInUSD,
        value: 'standard',
        variantId: null,
      },
    ]
  }

  return []
}

function RegularRowChevron() {
  return (
    <span aria-hidden="true" className="cateringRowChevron">
      <ChevronDownIcon className="cateringRowChevronIcon" />
    </span>
  )
}

function RegularOrderRow({ item }: { item: RegularOrderItem }) {
  const { addItem, isLoading } = useCart()
  const sizes = useMemo(() => resolveSizes(item), [item])
  const [selectedSizeValue, setSelectedSizeValue] = useState<string | null>(
    sizes[0]?.value ?? null,
  )
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const selectedSize = sizes.find((size) => size.value === selectedSizeValue) ?? sizes[0] ?? null
  const fromPrice = sizes.length
    ? Math.min(...sizes.map((size) => size.priceInUSD))
    : item.priceInUSD
  const isCartPending = isLoading || isSubmitting
  const infoId = `${item.slug}-regular-info`

  const handleAddToCart = async () => {
    if (!selectedSize || isCartPending) {
      return
    }

    setIsSubmitting(true)

    try {
      await addItem(
        {
          product: item.id,
          ...(typeof selectedSize.variantId === 'number'
            ? { variant: selectedSize.variantId }
            : {}),
        },
        quantity,
      )
      toast.success(
        `${quantity} × ${selectedSize.label} ${item.title} added to cart.`,
      )
      setQuantity(1)
    } catch {
      toast.error('Unable to add this cookie to cart right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sizes.length === 0) {
    return null
  }

  return (
    <AccordionItem
      className="cateringMenuAccordionItem border-b border-[rgba(23,21,16,0.14)]"
      value={`regular-${item.slug}`}
    >
      <AccordionTrigger
        className="cateringRowTrigger gap-6 py-8 text-left hover:no-underline md:py-10"
        indicator={<RegularRowChevron />}
      >
        <div className="grid w-full gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <h3 className="cateringMenuRoundHeading text-[2.15rem] leading-[0.95] tracking-[-0.04em] text-[#171510] md:text-[2.65rem]">
                {item.title}
              </h3>
              <span
                className={cn(
                  'regularFlavorBadge',
                  item.availability === 'seasonal'
                    ? 'regularFlavorBadgeSeasonal'
                    : 'regularFlavorBadgeAlways',
                )}
              >
                {item.badgeLabel}
              </span>
            </div>
            <p className="max-w-[41rem] text-[0.98rem] leading-8 text-[rgba(23,21,16,0.72)] md:text-[1.05rem]">
              {item.summary}
            </p>
          </div>

          <div className="cateringPriceBlock text-left md:text-right">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
              {sizes.length > 1 ? 'From' : 'Price'}
            </p>
            {typeof fromPrice === 'number' ? (
              <Price
                amount={fromPrice}
                className="cateringMenuRoundHeading mt-2 text-[1.42rem] tracking-[-0.02em] text-[#171510] md:text-[1.56rem]"
              />
            ) : null}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="cateringMenuAccordionContent pt-1 pb-9" motion="none">
        <div className="regularOrderCardGrid">
          <div className="regularOrderVisual">
            <div className="regularOrderCookieStage">
              <CookieSheepRig
                bodyFallbackSrc={item.bodyFallbackSrc}
                image={item.image}
                title={item.title}
              />
            </div>

            {item.receiptBody ? (
              <BakeryPressable
                aria-controls={infoId}
                aria-expanded={isInfoOpen}
                aria-label={`Show info for ${item.title}`}
                className="regularOrderInfoButton cateringMenuRoundHeading"
                onClick={() => setIsInfoOpen((current) => !current)}
                type="button"
              >
                {item.infoButtonLabel ?? 'Info'}
              </BakeryPressable>
            ) : null}
          </div>

          <BakeryCard
            className="regularOrderControls space-y-5 border-[rgba(91,70,37,0.12)] bg-[#fff8f2] p-4 shadow-[0_10px_24px_rgba(23,21,16,0.06)] md:p-5"
            radius="lg"
            spacing="none"
            tone="outline"
          >
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
                Pick a size
              </p>
              <div aria-label={`${item.title} size`} className="regularSizePicker" role="group">
                {sizes.map((size) => {
                  const isSelected = selectedSize?.value === size.value

                  return (
                    <BakeryPressable
                      aria-pressed={isSelected}
                      className={cn(
                        'regularSizeChoice',
                        isSelected && 'regularSizeChoiceActive',
                      )}
                      key={size.value}
                      onClick={() => setSelectedSizeValue(size.value)}
                      type="button"
                    >
                      <span className="regularSizeChoiceLabel cateringMenuRoundHeading">
                        {size.label}
                      </span>
                      <Price amount={size.priceInUSD} className="regularSizeChoicePrice" />
                    </BakeryPressable>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
                  How many
                </p>
                <div className="regularQuantityStepper">
                  <button
                    aria-label={`One fewer ${item.title}`}
                    className="regularQuantityButton"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    type="button"
                  >
                    <Minus aria-hidden="true" size={16} strokeWidth={2.6} />
                  </button>
                  <span aria-live="polite" className="regularQuantityCount cateringMenuRoundHeading">
                    {quantity}
                  </span>
                  <button
                    aria-label={`One more ${item.title}`}
                    className="regularQuantityButton"
                    disabled={quantity >= MAX_QUANTITY}
                    onClick={() => setQuantity((current) => Math.min(MAX_QUANTITY, current + 1))}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={16} strokeWidth={2.6} />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
                  Total
                </p>
                {selectedSize ? (
                  <Price
                    amount={selectedSize.priceInUSD * quantity}
                    className="cateringMenuRoundHeading mt-1 block text-[1.42rem] tracking-[-0.02em] text-[#171510]"
                  />
                ) : null}
              </div>
            </div>

            <SceneButton
              className="cateringAddToCartButton cateringMenuRoundHeading min-h-[3rem] w-full text-[0.98rem] tracking-[-0.02em]"
              loading={isCartPending}
              loadingLabel={`Adding ${item.title} to cart`}
              onClick={handleAddToCart}
              variant="primary"
            >
              {selectedSize
                ? `Add ${quantity} × ${selectedSize.label} to cart`
                : 'Pick a size first'}
            </SceneButton>
          </BakeryCard>
        </div>

        {item.receiptBody ? (
          <div
            aria-hidden={!isInfoOpen}
            className={cn(
              'overflow-hidden transition-[max-height,opacity,transform,margin] duration-300',
              isInfoOpen ? 'mt-4 max-h-[30rem] translate-y-0 opacity-100' : 'max-h-0 -translate-y-2 opacity-0',
            )}
          >
            <BakeryCard
              aria-label={`${item.title} info`}
              className="relative border border-[rgba(121,92,47,0.16)] bg-[linear-gradient(180deg,#fffaf0_0%,#f8efd9_100%)] px-4 pb-4 pt-3 shadow-[0_16px_28px_rgba(23,21,16,0.08)]"
              id={infoId}
              radius="md"
              spacing="none"
              tone="transparent"
            >
              <BakeryPressable
                aria-label={`Close info for ${item.title}`}
                className="absolute right-3 top-3 bg-transparent p-0 text-[0.76rem] font-medium text-[rgba(90,65,33,0.7)] transition hover:text-[rgba(90,65,33,1)]"
                onClick={() => setIsInfoOpen(false)}
                type="button"
              >
                Close
              </BakeryPressable>

              <p className="cateringMenuEyebrow pr-12">For {item.title}</p>
              <h5 className="mt-0.5 text-[0.9rem] font-semibold tracking-[-0.005em] text-[#5d4119]">
                Product Info
              </h5>

              <CookieInfoNote
                allergens={item.allergens}
                body={item.receiptBody}
                className="cookieInfoNote--menu"
              />
            </BakeryCard>
          </div>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  )
}

/**
 * The Regular orders tab: every always-available flavor plus the current
 * rotation's flavors, each orderable in any published size and quantity.
 */
export function RegularOrdersPanel({ items, seasonalLabel }: RegularOrdersPanelProps) {
  const alwaysItems = items.filter((item) => item.availability === 'always')
  const seasonalItems = items.filter((item) => item.availability === 'seasonal')

  const groups = [
    {
      description: 'The standing lineup — baked all year, order any time.',
      heading: 'Always available',
      items: alwaysItems,
      key: 'always',
    },
    {
      description: 'Featured for a limited time, straight from the rotation.',
      heading: seasonalLabel,
      items: seasonalItems,
      key: 'seasonal',
    },
  ].filter((group) => group.items.length > 0)

  if (groups.length === 0) {
    return (
      <p className="py-12 text-base leading-8 text-[rgba(23,21,16,0.72)]">
        Individual flavors are being restocked — check the catering tab for trays, or come back
        soon.
      </p>
    )
  }

  return (
    <div className="regularOrdersPanel">
      <Accordion collapsible type="single">
        {groups.map((group) => (
          <section aria-label={group.heading} key={group.key}>
            <div className="regularGroupHeader">
              <h2 className="cateringMenuRoundHeading regularGroupHeading">{group.heading}</h2>
              <p className="regularGroupDescription">{group.description}</p>
            </div>
            {group.items.map((item) => (
              <RegularOrderRow item={item} key={item.id} />
            ))}
          </section>
        ))}
      </Accordion>

      <style>{`
        .regularGroupHeader {
          align-items: baseline;
          border-bottom: 1px solid rgba(23, 21, 16, 0.14);
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem 1rem;
          padding: 2.2rem 0 1rem;
        }

        .regularOrdersPanel section:first-of-type .regularGroupHeader {
          padding-top: 1.4rem;
        }

        .regularGroupHeading {
          color: rgba(23, 21, 16, 0.88);
          font-size: 1.05rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .regularGroupDescription {
          color: rgba(23, 21, 16, 0.55);
          font-size: 0.86rem;
          line-height: 1.5;
        }

        .regularFlavorBadge {
          align-items: center;
          border-radius: 999px;
          display: inline-flex;
          font-family: var(--font-rounded-display);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          min-height: 2rem;
          padding: 0.32rem 0.8rem;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .regularFlavorBadgeAlways {
          background: #e3eeda;
          color: #2d4520;
        }

        .regularFlavorBadgeSeasonal {
          background: #ffe9c2;
          color: #6b4a12;
        }

        .regularOrderCardGrid {
          display: grid;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .regularOrderCardGrid {
            align-items: stretch;
            gap: 1.25rem;
            grid-template-columns: minmax(0, 23rem) minmax(0, 1fr);
          }
        }

        .regularOrderVisual {
          --cookie-bottom: 1.85rem;
          --cookie-size: clamp(9.5rem, 62%, 11.5rem);
          background:
            radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.55), transparent 58%),
            linear-gradient(180deg, #dbeeff 0%, #f3ede2 100%);
          border: 1px solid rgba(91, 70, 37, 0.14);
          border-radius: 1.15rem;
          min-height: 16.5rem;
          overflow: hidden;
          position: relative;
        }

        .regularOrderCookieStage {
          position: absolute;
          inset: 0;
        }

        .regularOrderVisual:hover .cookieSheepBodyImage,
        .regularOrderVisual:focus-within .cookieSheepBodyImage {
          transform: scale(1.18);
        }

        .regularOrderVisual:hover .cookieSheepBurstPart,
        .regularOrderVisual:focus-within .cookieSheepBurstPart {
          opacity: 0;
          transform: translate3d(var(--sheep-burst-x, 0), var(--sheep-burst-y, 0), 0)
            rotate(var(--sheep-burst-rotate, 0deg)) scale(var(--sheep-burst-scale, 0.72));
        }

        .regularOrderInfoButton {
          background: rgba(255, 250, 236, 0.92);
          border: 1px solid rgba(121, 92, 47, 0.28);
          border-radius: 999px;
          bottom: 0.75rem;
          color: #5a4121;
          font-size: 0.76rem;
          letter-spacing: 0.01em;
          min-height: 2.5rem;
          padding: 0.45rem 1rem;
          position: absolute;
          right: 0.75rem;
          transition:
            background-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            border-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            transform 150ms cubic-bezier(0.6, 0, 0.15, 1);
        }

        .regularOrderInfoButton:hover,
        .regularOrderInfoButton:focus-visible {
          background: #fff4c8;
          border-color: rgba(121, 92, 47, 0.45);
          transform: translateY(-1px);
        }

        .regularSizePicker {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
          margin-top: 0.6rem;
        }

        .regularSizeChoice {
          align-items: center;
          background: #ffffff;
          border: 1px solid rgba(91, 70, 37, 0.16);
          border-radius: 999px;
          color: #171510;
          display: inline-flex;
          gap: 0.55rem;
          justify-content: center;
          min-height: 3rem;
          padding: 0.5rem 1rem;
          transition:
            background-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            border-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            box-shadow 150ms cubic-bezier(0.6, 0, 0.15, 1),
            color 150ms cubic-bezier(0.6, 0, 0.15, 1);
        }

        .regularSizeChoice:hover {
          border-color: rgba(31, 43, 20, 0.34);
          background: rgba(245, 250, 239, 0.92);
        }

        .regularSizeChoice:focus-visible {
          outline: 2px solid rgba(25, 56, 34, 0.65);
          outline-offset: 2px;
        }

        .regularSizeChoiceActive,
        .regularSizeChoiceActive:hover {
          background: rgba(31, 43, 20, 0.08);
          border-color: rgba(31, 43, 20, 0.5);
          box-shadow: inset 0 0 0 1px rgba(31, 43, 20, 0.5);
        }

        .regularSizeChoiceLabel {
          font-size: 0.92rem;
          letter-spacing: -0.01em;
        }

        .regularSizeChoicePrice {
          color: rgba(23, 21, 16, 0.62);
          font-size: 0.88rem;
          font-weight: 600;
        }

        .regularSizeChoiceActive .regularSizeChoicePrice {
          color: rgba(23, 21, 16, 0.85);
        }

        .regularQuantityStepper {
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(91, 70, 37, 0.16);
          border-radius: 999px;
          display: inline-flex;
          gap: 0.25rem;
          margin-top: 0.6rem;
          padding: 0.25rem;
        }

        .regularQuantityButton {
          align-items: center;
          background: rgba(28, 46, 16, 0.06);
          border: 1px solid rgba(28, 46, 16, 0.12);
          border-radius: 999px;
          color: #1c2e10;
          cursor: pointer;
          display: inline-flex;
          height: 2.6rem;
          justify-content: center;
          transition:
            background-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            border-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            transform 150ms cubic-bezier(0.6, 0, 0.15, 1);
          width: 2.6rem;
        }

        .regularQuantityButton:hover:not(:disabled),
        .regularQuantityButton:focus-visible {
          background: #1c2e10;
          border-color: #1c2e10;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .regularQuantityButton:focus-visible {
          outline: 2px solid rgba(25, 56, 34, 0.65);
          outline-offset: 2px;
        }

        .regularQuantityButton:disabled {
          cursor: not-allowed;
          opacity: 0.38;
          transform: none;
        }

        .regularQuantityCount {
          color: #171510;
          font-size: 1.15rem;
          min-width: 2.6rem;
          text-align: center;
        }

        @media (max-width: 767px) {
          .regularOrderVisual {
            min-height: 12.5rem;
          }

          .regularFlavorBadge {
            font-size: 0.72rem;
          }
        }
      `}</style>
    </div>
  )
}
