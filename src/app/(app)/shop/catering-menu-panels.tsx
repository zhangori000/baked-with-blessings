'use client'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { RichText } from '@/components/RichText'
import { FlowerSprite } from '@/components/flowers/FlowerSprite'
import type { Media as MediaType, Product } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { LoaderCircle } from 'lucide-react'
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

function SelectedFlavorButton() {
  return (
    <button
      className="cateringMenuRoundHeading relative inline-flex min-h-[2.5rem] w-full items-center justify-center overflow-hidden rounded-full border border-[rgba(31,43,20,0.16)] bg-[rgba(31,43,20,0.08)] px-4 text-[0.84rem] tracking-[-0.01em] text-[#1f2b14]"
      disabled
      type="button"
    >
      <span className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-[1.05rem] overflow-visible">
        <span
          className="absolute left-1/2 bottom-[0.22rem] h-[0.3rem] w-[0.3rem] -translate-x-1/2 rounded-full bg-[#6f8f29]"
          style={{ animation: 'selectedGrassDotIn 140ms ease-out both' }}
        />
        <span
          className="absolute inset-x-0 bottom-0 h-[0.34rem] rounded-full bg-[linear-gradient(90deg,#6f8f29_0%,#6f8f29_100%)] opacity-100"
          style={{ animation: 'selectedGrassLineGrow 260ms cubic-bezier(0.22,1,0.36,1) 80ms both' }}
        />
      </span>

      <FlowerSprite
        animateIn
        asset="/flowers/menu-nav-flower.svg"
        className="pointer-events-none"
        living
        sizes="28px"
        style={
          {
            '--flower-bob': '0.05rem',
            '--flower-delay': '0.04s',
            '--flower-grow-delay': '260ms',
            '--flower-scale': '1.9',
            '--flower-tilt': '2deg',
            left: '75.5%',
            width: '2.75rem',
            bottom: '-0.02rem',
          } as React.CSSProperties
        }
      />
      <FlowerSprite
        animateIn
        asset="/flowers/menu-nav-flower.svg"
        className="pointer-events-none"
        living
        sizes="28px"
        style={
          {
            '--flower-bob': '0.05rem',
            '--flower-delay': '0.1s',
            '--flower-grow-delay': '320ms',
            '--flower-scale': '1.9',
            '--flower-tilt': '3deg',
            left: '85.5%',
            width: '2.75rem',
            bottom: '-0.02rem',
          } as React.CSSProperties
        }
      />

      <span className="relative z-[1]">Selected</span>
    </button>
  )
}

type TrayFlavorCardProps = {
  actionLabel: string
  clouds: readonly StaticSceneCloud[]
  flavor: SelectableFlavor
  isSelected: boolean
  meadowSrc: string
  mobileSkySrc?: string
  onChoose: () => void
  renderSceneImage: (props: DecorativeSceneImageProps) => React.ReactElement
  sceneryTone: MenuSceneryTone
  skySrc: string
}

export function TrayFlavorCard({
  actionLabel,
  clouds,
  flavor,
  isSelected,
  meadowSrc,
  mobileSkySrc,
  onChoose,
  renderSceneImage,
  sceneryTone,
  skySrc,
}: TrayFlavorCardProps) {
  return (
    <article
      className={cn(
        'cateringFlavorCard flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(91,70,37,0.14)] bg-[rgba(255,250,242,0.98)]',
        isSelected && 'border-[rgba(34,84,32,0.22)] shadow-[0_16px_30px_rgba(46,76,27,0.12)]',
      )}
    >
      <div className="px-4 pt-3.5">
        <div className="min-w-0 space-y-3">
          <div className="flex items-start gap-3">
            <h4 className="cateringMenuRoundHeading min-w-0 flex-1 text-[0.98rem] leading-[1.04] tracking-[-0.03em] text-[#171510]">
              <span className="block line-clamp-2">{flavor.title}</span>
            </h4>
          </div>
          {flavor.summary ? (
            <p className="mt-1 line-clamp-2 max-w-none text-[0.77rem] leading-[1.45] tracking-[-0.012em] text-[rgba(23,21,16,0.58)]">
              {flavor.summary}
            </p>
          ) : null}

          {isSelected ? (
            <SelectedFlavorButton />
          ) : (
            <button
              className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-full border border-[rgba(91,70,37,0.14)] bg-white px-4 text-[0.84rem] font-semibold tracking-[-0.01em] text-[#171510] transition duration-200 hover:border-[rgba(31,43,20,0.24)] hover:bg-[rgba(245,250,239,0.92)]"
              onClick={onChoose}
              type="button"
            >
              {actionLabel}
            </button>
          )}
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
  persuasionPanel: React.ReactNode
  renderSceneImage: (props: DecorativeSceneImageProps) => React.ReactElement
  sceneryTone: MenuSceneryTone
  selectedFlavor: SelectableFlavor | null
  selectableFlavors: SelectableFlavor[]
  shouldPulseTraySummary: boolean
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
  persuasionPanel,
  renderSceneImage,
  sceneryTone,
  selectedFlavor,
  selectableFlavors,
  shouldPulseTraySummary,
  priceInUSD,
}: BatchBuilderPanelProps) {
  const canAddTray = Boolean(selectedFlavor)

  return (
    <div className="space-y-5">
      {persuasionPanel}

      <div className="space-y-4">
        <div
          className={cn(
            'rounded-[1.1rem] border border-[rgba(91,70,37,0.1)] bg-[rgba(255,255,255,0.7)] px-4 py-3 shadow-[0_8px_16px_rgba(23,21,16,0.03)] transition-[transform,box-shadow,border-color] duration-200',
            shouldPulseTraySummary && 'cateringTraySummaryPulse',
          )}
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="cateringMenuEyebrow">Cookie tray</p>
              <p className="mt-1 text-[0.98rem] leading-7 text-[rgba(23,21,16,0.72)]">
                {selectedFlavor
                  ? `${selectedFlavor.title} is selected. Pick a different cookie only if you want to switch.`
                  : 'Tray price is $30. Pick one cookie flavor.'}
              </p>
            </div>

            {typeof priceInUSD === 'number' ? (
              <div className="text-left md:text-right">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
                  Tray price
                </p>
                <Price
                  amount={priceInUSD}
                  className="cateringMenuRoundHeading mt-0.5 text-[1.02rem] tracking-[-0.02em] text-[#171510]"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div aria-label="Cookie flavor chooser" className="cateringFlavorRail" role="region">
          <div className="cateringFlavorRailInner">
            {selectableFlavors.map((flavor) => {
              const isSelected = selectedFlavor?.id === flavor.id
              const actionLabel = isSelected
                ? 'Selected'
                : selectedFlavor
                  ? `Switch to ${flavor.title}`
                  : `Choose ${flavor.title}`

              return (
                <div className="cateringFlavorRailItem" key={flavor.id}>
                    <TrayFlavorCard
                      actionLabel={actionLabel}
                      clouds={flavorCardCloudsForScenery}
                      flavor={flavor}
                      isSelected={isSelected}
                      meadowSrc={flavorCardMeadowForScenery}
                    mobileSkySrc={flavorCardMobileSkyForScenery}
                    onChoose={() => onAddFlavor(flavor.id)}
                    renderSceneImage={renderSceneImage}
                    sceneryTone={sceneryTone}
                    skySrc={flavorCardSkyForScenery}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <button
          className={cn(
            'cateringMenuRoundHeading inline-flex min-h-[3rem] w-full items-center justify-center rounded-full px-5 text-[0.98rem] tracking-[-0.02em] transition duration-200',
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
          <span className="inline-flex items-center justify-center gap-2">
            {isTrayPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Adding tray...
              </>
            ) : selectedFlavor ? (
              `Add ${selectedFlavor.title} Tray to cart`
            ) : (
              'Choose a tray flavor first'
            )}
          </span>
        </button>
      </div>
    </div>
  )
}
