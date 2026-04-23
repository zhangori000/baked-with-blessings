'use client'

import Image from 'next/image'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { RichText } from '@/components/RichText'
import { TraySelectionSummary } from '@/components/TraySelectionSummary'
import type { Media as MediaType, Product } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { LoaderCircle, Minus, Plus } from 'lucide-react'
import React from 'react'

import { CookieSheepRig } from './cookie-sheep-rig'
import type { MenuSceneryTone, SelectableFlavor } from './catering-menu-types'

type StaticSceneCloud = {
  className: string
  src: string
  style?: React.CSSProperties
}

type DecorativeSceneImageProps = {
  className?: string
  fit?: 'contain' | 'cover'
  mobileSrc?: string
  sizes?: string
  src: string
  style?: React.CSSProperties
}

type TrayFlavorCardProps = {
  addSelection: () => void
  canIncrement: boolean
  clouds: readonly StaticSceneCloud[]
  count: number
  flavor: SelectableFlavor
  interactionState?: 'add' | 'remove' | null
  meadowSrc: string
  mobileSkySrc?: string
  removeSelection: () => void
  renderSceneImage: (props: DecorativeSceneImageProps) => React.ReactElement
  sceneryTone: MenuSceneryTone
  skySrc: string
}

export function TrayFlavorCard({
  addSelection,
  canIncrement,
  clouds,
  count,
  flavor,
  interactionState,
  meadowSrc,
  mobileSkySrc,
  removeSelection,
  renderSceneImage,
  sceneryTone,
  skySrc,
}: TrayFlavorCardProps) {
  return (
    <article
      className={cn(
        'cateringFlavorCard flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(91,70,37,0.14)] bg-[rgba(255,250,242,0.98)]',
        interactionState === 'add' && 'cateringFlavorCardActiveAdd',
        interactionState === 'remove' && 'cateringFlavorCardActiveRemove',
      )}
    >
      <div className="px-4 pt-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="cateringMenuRoundHeading min-w-0 flex-1 text-[0.98rem] leading-[1.04] tracking-[-0.03em] text-[#171510]">
              <span className="block line-clamp-2">{flavor.title}</span>
            </h4>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                aria-label={`Remove one ${flavor.title}`}
                className={cn(
                  'cateringFlavorStep',
                  interactionState === 'remove' && 'cateringFlavorStepActive',
                )}
                disabled={count < 1}
                onClick={removeSelection}
                type="button"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <div className="flex min-w-[1.35rem] items-center justify-center text-center">
                <p
                  className={cn(
                    'cateringFlavorCount text-[0.68rem] font-semibold tracking-[-0.01em] text-[rgba(23,21,16,0.48)]',
                    interactionState && 'cateringFlavorCountActive',
                  )}
                >
                  {count}
                </p>
              </div>

              <button
                aria-label={`Add one ${flavor.title}`}
                className={cn(
                  'cateringFlavorStep',
                  interactionState === 'add' && 'cateringFlavorStepActive',
                )}
                disabled={!canIncrement}
                onClick={addSelection}
                type="button"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {flavor.summary ? (
            <p className="mt-1 line-clamp-2 max-w-none text-[0.77rem] leading-[1.45] tracking-[-0.012em] text-[rgba(23,21,16,0.58)]">
              {flavor.summary}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="relative mt-2.5 overflow-hidden bg-[#dbeeff]"
        style={
          {
            '--cookie-bottom': '1.75rem',
            '--cookie-size': 'clamp(10.8rem, 68%, 12.4rem)',
          } as React.CSSProperties
        }
      >
        {renderSceneImage({
          className: 'absolute inset-0',
          fit: 'cover',
          mobileSrc: mobileSkySrc,
          sizes: '18rem',
          src: skySrc,
        })}
        {renderSceneImage({
          className: 'absolute inset-x-0 bottom-[-0.15rem] z-[1] h-[36%]',
          fit: 'cover',
          sizes: '18rem',
          src: meadowSrc,
        })}
        {clouds.map((cloud) => (
          <React.Fragment key={`${sceneryTone}-${flavor.title}-${cloud.className}-${cloud.src}`}>
            {renderSceneImage({
              className: cn('cateringFlavorCloud pointer-events-none absolute', cloud.className),
              sizes: '8rem',
              src: cloud.src,
              style: cloud.style,
            })}
          </React.Fragment>
        ))}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[54%] bg-gradient-to-b from-[rgba(255,255,255,0.18)] to-transparent" />

        <div className="relative h-[16.3rem]">
          <CookieSheepRig
            bodyFallbackSrc={flavor.bodyFallbackSrc}
            image={flavor.image}
            title={flavor.title}
          />
        </div>
      </div>
    </article>
  )
}

type SimpleItemPanelProps = {
  image: MediaType | null
  isCartPending: boolean
  onAddToCart: () => void
  priceInUSD?: number | null
  product: Partial<Product>
  resolveSummary: (product: Partial<Product>) => string
}

export function SimpleItemPanel({
  image,
  isCartPending,
  onAddToCart,
  priceInUSD,
  product,
  resolveSummary,
}: SimpleItemPanelProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {product.menuExpandedPitch ? (
          <RichText
            className="cateringPitch prose-p:leading-7 prose-headings:tracking-[-0.04em] prose-h2:text-[1.35rem] prose-h2:leading-tight"
            data={product.menuExpandedPitch}
            enableGutter={false}
          />
        ) : (
          <p className="text-[1rem] leading-8 text-[rgba(23,21,16,0.76)]">
            {resolveSummary(product)}
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-[1.45rem] border border-[rgba(91,70,37,0.12)] bg-[#fff8f2] p-4 shadow-[0_10px_24px_rgba(23,21,16,0.06)]">
        {image ? (
          <div className="overflow-hidden rounded-[1.15rem] bg-[#f1e5cf]">
            <Media
              className="relative aspect-[5/4] w-full"
              imgClassName="h-full w-full object-cover"
              resource={image}
            />
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
              Order summary
            </p>
            <p className="mt-1 text-[1rem] leading-7 text-[rgba(23,21,16,0.74)]">
              {product.menuPortionLabel ?? 'Menu item'}
            </p>
          </div>

          {typeof priceInUSD === 'number' ? (
            <Price
              amount={priceInUSD}
              className="cateringMenuRoundHeading text-[1.28rem] tracking-[-0.03em] text-[#171510]"
            />
          ) : null}
        </div>

        <button
          className={cn(
            'inline-flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[#171510] px-5 text-[0.98rem] tracking-[-0.02em] text-white transition duration-200',
            isCartPending ? 'cursor-progress opacity-88' : 'cursor-pointer hover:bg-[#2a2822]',
          )}
          disabled={isCartPending}
          onClick={onAddToCart}
          type="button"
        >
          {isCartPending ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Adding to cart...
            </span>
          ) : (
            'Add to cart'
          )}
        </button>
      </div>
    </div>
  )
}

type BatchBuilderPanelProps = {
  flavorCardCloudsForScenery: readonly StaticSceneCloud[]
  flavorCardMeadowForScenery: string
  flavorCardMobileSkyForScenery?: string
  flavorCardSkyForScenery: string
  isTrayPending: boolean
  onAddFlavor: (flavorID: number) => void
  onAddToCart: () => void
  onRemoveFlavor: (flavorID: number) => void
  persuasionPanel: React.ReactNode
  recentFlavorInteraction: { action: 'add' | 'remove'; flavorID: number } | null
  renderSceneImage: (props: DecorativeSceneImageProps) => React.ReactElement
  requiredSelectionCount: number
  sceneryTone: MenuSceneryTone
  selectableFlavors: SelectableFlavor[]
  selectedCounts: Record<number, number>
  shouldPulseTraySummary: boolean
  totalSelected: number
  traySelectionsForSummary: {
    product: Product
    quantity: number
  }[]
  priceInUSD?: number | null
}

export function BatchBuilderPanel({
  flavorCardCloudsForScenery,
  flavorCardMeadowForScenery,
  flavorCardMobileSkyForScenery,
  flavorCardSkyForScenery,
  isTrayPending,
  onAddFlavor,
  onAddToCart,
  onRemoveFlavor,
  persuasionPanel,
  recentFlavorInteraction,
  renderSceneImage,
  requiredSelectionCount,
  sceneryTone,
  selectableFlavors,
  selectedCounts,
  shouldPulseTraySummary,
  totalSelected,
  traySelectionsForSummary,
  priceInUSD,
}: BatchBuilderPanelProps) {
  const canAddTray =
    requiredSelectionCount > 0 &&
    totalSelected === requiredSelectionCount &&
    traySelectionsForSummary.length > 0
  const progressPercentage =
    requiredSelectionCount > 0 ? Math.min(1, totalSelected / requiredSelectionCount) * 100 : 0

  return (
    <div className="space-y-5">
      {persuasionPanel}

      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[1rem] border border-[rgba(91,70,37,0.1)] bg-[#fff8f2] px-3 py-2 shadow-[0_8px_16px_rgba(23,21,16,0.04)]">
          <div className="relative z-[1] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="space-y-0">
                <p className="cateringMenuEyebrow">Tray progress</p>
                <h4 className="cateringMenuRoundHeading text-[0.88rem] leading-tight tracking-[-0.02em] text-[#171510]">
                  {totalSelected}/{requiredSelectionCount} selected
                </h4>
              </div>

              <div className="text-right">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
                  Tray price
                </p>
                {typeof priceInUSD === 'number' ? (
                  <Price
                    amount={priceInUSD}
                    className="cateringMenuRoundHeading mt-0.5 text-[0.88rem] tracking-[-0.02em] text-[#171510]"
                  />
                ) : null}
              </div>
            </div>

            <div className="pt-1.5">
              <div className="relative h-2.5 rounded-full bg-[rgba(126,161,47,0.18)]">
                <div
                  className="h-full rounded-full bg-[#7ea12f] transition-[width] duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />

                {Array.from({ length: totalSelected }, (_, index) => (
                  <span
                    className="cateringProgressBloom"
                    key={`slot-${index}`}
                    style={{
                      left: `${((index + 1) / requiredSelectionCount) * 100}%`,
                    }}
                  >
                    <Image
                      alt=""
                      aria-hidden="true"
                      className="cateringProgressBloomImage"
                      height={80}
                      src="/flowers/menu-nav-flower.svg"
                      unoptimized
                      width={80}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <TraySelectionSummary
          alwaysRender
          className={cn(
            'rounded-[1rem] border border-[rgba(91,70,37,0.1)] bg-[rgba(255,255,255,0.58)] px-3 py-3 shadow-[0_8px_16px_rgba(23,21,16,0.03)] transition-[transform,box-shadow,border-color] duration-200',
            shouldPulseTraySummary && 'cateringTraySummaryPulse',
          )}
          compact
          emptyMessage="Your tray mix will stay here while you build it, so nothing jumps when you start adding cookies."
          itemsClassName="min-h-[4.8rem] content-start"
          label="Current tray mix"
          placeholderCount={Math.min(Math.max(requiredSelectionCount, 4), 6)}
          selections={traySelectionsForSummary}
          tone="muted"
        />

        <div className="space-y-3">
          <div>
            <p className="cateringMenuEyebrow">Choose your cookies</p>
            <p className="mt-1 text-[0.98rem] leading-7 text-[rgba(23,21,16,0.68)]">
              Build the tray one cookie at a time, then add it only when the full batch is ready.
            </p>
          </div>

          <div aria-label="Cookie flavor tray builder" className="cateringFlavorRail" role="region">
            <div className="cateringFlavorRailInner">
              {selectableFlavors.map((flavor) => {
                const flavorCount = selectedCounts[flavor.id] ?? 0

                return (
                  <div className="cateringFlavorRailItem" key={flavor.id}>
                    <TrayFlavorCard
                      addSelection={() => onAddFlavor(flavor.id)}
                      canIncrement={totalSelected < requiredSelectionCount}
                      clouds={flavorCardCloudsForScenery}
                      count={flavorCount}
                      flavor={flavor}
                      interactionState={
                        recentFlavorInteraction?.flavorID === flavor.id
                          ? recentFlavorInteraction.action
                          : null
                      }
                      meadowSrc={flavorCardMeadowForScenery}
                      mobileSkySrc={flavorCardMobileSkyForScenery}
                      removeSelection={() => onRemoveFlavor(flavor.id)}
                      renderSceneImage={renderSceneImage}
                      sceneryTone={sceneryTone}
                      skySrc={flavorCardSkyForScenery}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <button
          className={cn(
            'inline-flex min-h-[3rem] w-full items-center justify-center rounded-full px-5 text-[0.98rem] tracking-[-0.02em] transition duration-200',
            canAddTray && !isTrayPending
              ? 'cursor-pointer bg-[#171510] text-white hover:bg-[#2a2822]'
              : isTrayPending
                ? 'cursor-progress bg-[#171510] text-white opacity-90'
                : 'cursor-not-allowed bg-[#171510]/12 text-[#171510]/42',
          )}
          disabled={!canAddTray || isTrayPending}
          onClick={onAddToCart}
          type="button"
        >
          {isTrayPending ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Adding tray to cart...
            </span>
          ) : (
            'Add tray to cart'
          )}
        </button>
      </div>
    </div>
  )
}
