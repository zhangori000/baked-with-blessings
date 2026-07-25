'use client'

import { useStorefrontCart } from '@/providers/Ecommerce'
import { ArrowRight, ChevronDownIcon, Minus, Plus } from 'lucide-react'
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
import {
  DecorativeSceneImage,
  meadowByScenery,
  mobileSkyByScenery,
  skyByScenery,
} from './catering-menu-scenery'
import { CookieSheepRig } from './cookie-sheep-rig'
import type {
  BundleSuggestions,
  MenuSceneryTone,
  RegularOrderItem,
  RegularOrderSize,
} from './catering-menu-types'

const MAX_QUANTITY = 50

const formatUSD = (cents: number) => `$${(cents / 100).toFixed(2)}`

type RegularOrdersPanelProps = {
  bundleSuggestions?: BundleSuggestions
  items: RegularOrderItem[]
  onJumpToBundle?: (slug: string) => void
  sceneryTone: MenuSceneryTone
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

function RegularOrderRow({
  bundleSuggestions,
  item,
  onJumpToBundle,
  sceneryTone,
}: {
  bundleSuggestions?: BundleSuggestions
  item: RegularOrderItem
  onJumpToBundle?: (slug: string) => void
  sceneryTone: MenuSceneryTone
}) {
  const { addItem, isLoading } = useStorefrontCart()
  const sizes = useMemo(() => resolveSizes(item), [item])
  const skySrc = skyByScenery[sceneryTone] ?? skyByScenery.classic
  const mobileSkySrc = mobileSkyByScenery[sceneryTone]
  const meadowSrc =
    sceneryTone === 'blossom'
      ? '/sceneries/blossom-grass-mound.svg'
      : (meadowByScenery[sceneryTone] ?? meadowByScenery.classic)
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

  // Point customers stocking up toward the cheaper bundle: a 4-pack mix box
  // (quantity 4–9) or a 10-pack one-flavor tray (quantity 10+). Below 4 we
  // still show a quiet static hint so the option is always discoverable.
  const bundleHint = useMemo(() => {
    // Box/tray deals are cookies-only; a bread (or other non-cookie) can't go in
    // a build-your-own cookie box, so don't nudge it toward one.
    if (
      !selectedSize ||
      !bundleSuggestions ||
      (item.categorySlug && item.categorySlug !== 'cookies')
    ) {
      return null
    }

    const group = bundleSuggestions[selectedSize.value === 'mini' ? 'mini' : 'large']
    if (!group) {
      return null
    }

    // Lead with the dollars: how much they save and the deal in one glance.
    const dealFor = (bundle: { count: number; price: number; slug: string; title: string }) => {
      const singlesPrice = bundle.count * selectedSize.priceInUSD
      const savings = singlesPrice - bundle.price
      const shortName = bundle.title.replace(/^Build-Your-Own\s+/i, '')
      return {
        detail: `${bundle.count} for ${formatUSD(bundle.price)} instead of ${formatUSD(singlesPrice)}.`,
        headline: savings > 0 ? `Save ${formatUSD(savings)} with a ${shortName}` : `Try a ${shortName}`,
        kind: 'strong' as const,
        slug: bundle.slug,
      }
    }

    if (quantity >= 10 && group.tray?.count) {
      return dealFor(group.tray as { count: number; price: number; slug: string; title: string })
    }

    if (quantity >= 4 && group.box?.count) {
      return dealFor(group.box as { count: number; price: number; slug: string; title: string })
    }

    const fallback = group.box ?? group.tray
    if (!fallback) {
      return null
    }

    return {
      detail: 'Boxes and one-flavor trays cost less per cookie.',
      headline: 'Buying a bunch?',
      kind: 'quiet' as const,
      slug: fallback.slug,
    }
  }, [bundleSuggestions, item.categorySlug, quantity, selectedSize])

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
        sizes.length > 1
          ? `${quantity} × ${selectedSize.label} ${item.title} added to cart.`
          : `${quantity} × ${item.title} added to cart.`,
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
        <div className="regularOrderCollapsed grid w-full gap-4">
          <div className="regularOrderTitleRow">
            <h3 className="cateringMenuRoundHeading regularOrderTitle text-[2.15rem] leading-[0.95] tracking-[-0.04em] text-[#171510] md:text-[2.65rem]">
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
            {item.categoryLabel ? (
              <span className="regularFlavorBadge regularFlavorBadgeCategory">
                {item.categoryLabel}
              </span>
            ) : null}
          </div>

          {/* Collapsed preview: full-width image on mobile; desktop fills free
              space with description + price beside the sheep-cookie scene. */}
          <div className="regularOrderPreview">
            <div aria-hidden="true" className="regularOrderVisual regularOrderVisualCollapsed">
              <DecorativeSceneImage
                className="absolute inset-0"
                fit="cover"
                mobileSrc={mobileSkySrc}
                sizes="(max-width: 767px) 100vw, 24rem"
                src={skySrc}
              />
              <DecorativeSceneImage
                className="absolute inset-x-0 bottom-[-0.15rem] z-[1] h-[34%]"
                fit="cover"
                sizes="(max-width: 767px) 100vw, 24rem"
                src={meadowSrc}
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[54%] bg-gradient-to-b from-[rgba(255,255,255,0.18)] to-transparent" />
              <div className="regularOrderCookieStage">
                <CookieSheepRig
                  bodyFallbackSrc={item.bodyFallbackSrc}
                  image={item.image}
                  title={item.title}
                />
              </div>
            </div>

            <div className="regularOrderPreviewMeta">
              {item.summary ? (
                <p className="regularOrderPreviewSummary">{item.summary}</p>
              ) : null}

              <div className="cateringPriceBlock text-left">
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
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="cateringMenuAccordionContent pt-1 pb-9" motion="none">
        <div className="regularOrderExpanded space-y-5">
          {/* Description already sits beside the image on desktop; keep it in
              the expanded body on mobile only. */}
          {item.summary ? (
            <p className="regularOrderExpandedSummary max-w-[41rem] text-[0.98rem] leading-8 text-[rgba(23,21,16,0.72)]">
              {item.summary}
            </p>
          ) : null}

          <BakeryCard
            className="regularOrderControls space-y-5 border-[rgba(91,70,37,0.12)] bg-[#fff8f2] p-4 shadow-[0_10px_24px_rgba(23,21,16,0.06)] md:p-5"
            radius="lg"
            spacing="none"
            tone="outline"
          >
            {sizes.length > 1 ? (
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
                        className={cn('regularSizeChoice', isSelected && 'regularSizeChoiceActive')}
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
            ) : null}

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
                ? sizes.length > 1
                  ? `Add ${quantity} × ${selectedSize.label} to cart`
                  : `Add ${quantity} to cart`
                : 'Pick a size first'}
            </SceneButton>

            {bundleHint ? (
              <button
                className={cn(
                  'group flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition',
                  bundleHint.kind === 'strong'
                    ? 'border border-[rgba(126,161,47,0.34)] bg-[rgba(126,161,47,0.1)] hover:border-[rgba(126,161,47,0.5)] hover:bg-[rgba(126,161,47,0.18)]'
                    : 'border border-transparent bg-transparent px-1 py-1 hover:bg-[rgba(126,161,47,0.06)]',
                )}
                onClick={() => onJumpToBundle?.(bundleHint.slug)}
                type="button"
              >
                {bundleHint.kind === 'strong' ? (
                  <span aria-hidden="true" className="text-lg leading-none">
                    💡
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block font-semibold',
                      bundleHint.kind === 'strong'
                        ? 'text-[0.86rem] text-[#3c4a22]'
                        : 'text-[0.82rem] text-[rgba(60,74,34,0.92)]',
                    )}
                  >
                    {bundleHint.headline}
                  </span>
                  <span className="block text-[0.78rem] leading-snug text-[rgba(23,21,16,0.6)]">
                    {bundleHint.detail}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="shrink-0 text-[#5c7a1f] transition-transform group-hover:translate-x-0.5"
                  size={18}
                  strokeWidth={2.4}
                />
              </button>
            ) : null}
          </BakeryCard>

          {item.receiptBody ? (
            <div className="space-y-3">
              <BakeryPressable
                aria-controls={infoId}
                aria-expanded={isInfoOpen}
                aria-label={`Show info for ${item.title}`}
                className="regularOrderInfoButtonInline cateringMenuRoundHeading"
                onClick={() => setIsInfoOpen((current) => !current)}
                type="button"
              >
                {item.infoButtonLabel ?? 'Info'}
              </BakeryPressable>

              <div
                aria-hidden={!isInfoOpen}
                className={cn(
                  'overflow-hidden transition-[max-height,opacity,transform] duration-300',
                  isInfoOpen
                    ? 'max-h-[30rem] translate-y-0 opacity-100'
                    : 'max-h-0 -translate-y-2 opacity-0',
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
            </div>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

/**
 * The Regular orders tab: every always-available flavor plus the current
 * rotation's flavors, each orderable in any published size and quantity.
 */
export function RegularOrdersPanel({
  bundleSuggestions,
  items,
  onJumpToBundle,
  sceneryTone,
  seasonalLabel,
}: RegularOrdersPanelProps) {
  const alwaysItems = items.filter((item) => item.availability === 'always')
  const seasonalItems = items.filter((item) => item.availability === 'seasonal')

  const groups = [
    {
      description: 'Featured this week, straight from the rotation.',
      heading: seasonalLabel,
      items: seasonalItems,
      key: 'seasonal',
    },
    {
      description: 'The standing lineup — baked all year, order any time.',
      heading: 'Always available',
      items: alwaysItems,
      key: 'always',
    },
  ].filter((group) => group.items.length > 0)

  if (groups.length === 0) {
    return (
      <p className="py-12 text-base leading-8 text-[rgba(23,21,16,0.72)]">
        Individual flavors are being restocked — check the Bundles tab for boxes and trays, or
        come back soon.
      </p>
    )
  }

  return (
    <div className="regularOrdersPanel">
      <Accordion collapsible type="single">
        {groups.map((group, groupIndex) => (
          <section aria-label={group.heading} key={group.key}>
            <div className="regularGroupHeader">
              <h2 className="cateringMenuRoundHeading regularGroupHeading">
                {group.heading} <span className="regularGroupCount">({group.items.length})</span>
              </h2>
              <p className="regularGroupDescription">{group.description}</p>
            </div>
            {group.items.map((item) => (
              <RegularOrderRow
                bundleSuggestions={bundleSuggestions}
                item={item}
                key={item.id}
                onJumpToBundle={onJumpToBundle}
                sceneryTone={sceneryTone}
              />
            ))}
            {groupIndex < groups.length - 1 ? (
              <p aria-hidden="true" className="regularGroupMore">
                ↓ Keep scrolling for more
              </p>
            ) : null}
          </section>
        ))}
      </Accordion>

      <BakeryCard
        className="regularOffSeasonBanner mt-8 flex flex-col gap-3 border-[rgba(125,85,18,0.2)] bg-[linear-gradient(180deg,#fffaf0_0%,#f8efd9_100%)] p-5 shadow-[0_12px_26px_rgba(23,21,16,0.07)] sm:flex-row sm:items-center sm:justify-between"
        radius="lg"
        spacing="none"
        tone="outline"
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="text-2xl leading-none">
            🍪
          </span>
          <div>
            <p className="cateringMenuRoundHeading text-[1.02rem] tracking-[-0.01em] text-[#5d4119]">
              Don’t see your favorite?
            </p>
            <p className="mt-1 max-w-[40rem] text-[0.9rem] leading-6 text-[rgba(23,21,16,0.66)]">
              Seasonal and retired flavors leave the individual menu when they’re off rotation —
              but you can still order ten of <em>any</em> flavor, even rare ones, in a one-flavor
              Cookie Tray.
            </p>
          </div>
        </div>
        {onJumpToBundle ? (
          <button
            className="cateringMenuRoundHeading group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-[rgba(125,85,18,0.28)] bg-[rgba(125,85,18,0.06)] px-5 py-2.5 text-[0.86rem] tracking-[-0.01em] text-[#5d4119] transition hover:border-[rgba(125,85,18,0.45)] hover:bg-[rgba(125,85,18,0.12)] sm:self-center"
            onClick={() => onJumpToBundle('cookie-tray')}
            type="button"
          >
            Browse one-flavor trays
            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
              size={16}
              strokeWidth={2.4}
            />
          </button>
        ) : null}
      </BakeryCard>

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

        .regularGroupCount {
          color: rgba(23, 21, 16, 0.4);
          font-weight: 500;
        }

        .regularGroupMore {
          color: rgba(23, 21, 16, 0.5);
          font-size: 0.82rem;
          letter-spacing: 0.06em;
          padding: 1.6rem 0 0.2rem;
          text-align: center;
          text-transform: uppercase;
        }

        .regularOrderTitleRow {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 0.75rem;
          min-width: 0;
        }

        .regularOrderTitle {
          /* Keep the display type on one flex line so badges sit beside it,
             not under the cap-height of a tall multi-line block. */
          flex: 0 1 auto;
          margin: 0;
        }

        .regularFlavorBadge {
          align-items: center;
          align-self: center;
          border-radius: 999px;
          display: inline-flex;
          flex: 0 0 auto;
          font-family: var(--font-rounded-display);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          line-height: 1;
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

        .regularFlavorBadgeCategory {
          background: #ece3d6;
          color: #6b5a45;
        }

        /* Collapsed: title/badges, then image + meta. Buy controls expand. */
        .regularOrderCollapsed {
          max-width: 100%;
          min-width: 0;
        }

        .regularOrderPreview {
          display: grid;
          gap: 0.85rem;
          min-width: 0;
          width: 100%;
        }

        .regularOrderPreviewMeta {
          display: grid;
          gap: 0.75rem;
          min-width: 0;
        }

        /* Mobile default: description lives in the expanded panel only. */
        .regularOrderPreviewSummary {
          color: rgba(23, 21, 16, 0.72);
          display: none;
          font-size: 0.98rem;
          line-height: 1.75;
          margin: 0;
        }

        .regularOrderExpandedSummary {
          display: block;
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
          width: 100%;
        }

        .regularOrderVisualCollapsed {
          max-width: none;
        }

        .regularOrderCookieStage {
          position: absolute;
          inset: 0;
        }

        .cateringRowTrigger:hover .regularOrderVisual .cookieSheepBodyImage,
        .cateringRowTrigger:focus-visible .regularOrderVisual .cookieSheepBodyImage,
        .cateringRowTrigger[data-state='open'] .regularOrderVisual .cookieSheepBodyImage {
          transform: scale(1.18);
        }

        .cateringRowTrigger:hover .regularOrderVisual .cookieSheepBurstPart,
        .cateringRowTrigger:focus-visible .regularOrderVisual .cookieSheepBurstPart,
        .cateringRowTrigger[data-state='open'] .regularOrderVisual .cookieSheepBurstPart {
          opacity: 0;
          transform: translate3d(var(--sheep-burst-x, 0), var(--sheep-burst-y, 0), 0)
            rotate(var(--sheep-burst-rotate, 0deg)) scale(var(--sheep-burst-scale, 0.72));
        }

        @media (min-width: 768px) {
          .regularOrderPreview {
            align-items: stretch;
            gap: 1.25rem 1.5rem;
            grid-template-columns: minmax(0, 23rem) minmax(0, 1fr);
          }

          .regularOrderPreviewMeta {
            align-content: space-between;
            display: grid;
            gap: 1rem;
            min-height: 100%;
          }

          /* Desktop fills the empty column with description + price. */
          .regularOrderPreviewSummary {
            display: block;
            font-size: 1.05rem;
            line-height: 1.85;
            max-width: 36rem;
          }

          .regularOrderExpandedSummary {
            display: none;
          }

          .regularOrderVisualCollapsed {
            max-width: none;
          }
        }

        .regularOrderInfoButton.inline {
          background: rgba(255, 250, 236, 0.92);
          border: 1px solid rgba(121, 92, 47, 0.28);
          border-radius: 999px;
          color: #5a4121;
          display: inline-flex;
          font-size: 0.76rem;
          letter-spacing: 0.01em;
          min-height: 2.5rem;
          padding: 0.45rem 1rem;
          position: static;
          transition:
            background-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            border-color 150ms cubic-bezier(0.6, 0, 0.15, 1),
            transform 150ms cubic-bezier(0.6, 0, 0.15, 1);
        }

        .regularOrderInfoButton.inline:hover,
        .regularOrderInfoButton.inline:focus-visible {
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
            /* Full content width under title; panel already supplies outer padding. */
            min-height: 13.5rem;
            width: 100%;
          }

          .regularOrderVisualCollapsed {
            max-width: none;
          }

          .regularFlavorBadge {
            font-size: 0.72rem;
            min-height: 1.85rem;
            padding: 0.28rem 0.7rem;
          }
        }
      `}</style>
    </div>
  )
}
