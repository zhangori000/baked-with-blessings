'use client'

import { Price } from '@/components/Price'
import { ProgressGarden } from '@/components/ProgressGarden'
import { FlowerSprite } from '@/components/flowers/FlowerSprite'
import { BakeryCard, BakeryPressable, SceneButton } from '@/design-system/bakery'
import type { Product } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { Minus, Plus } from 'lucide-react'
import React from 'react'

import { CookieInfoNote } from './CookieInfoNote'
import { CookieSheepRig } from './cookie-sheep-rig'
import type { MenuSceneryTone, SelectableFlavor } from './catering-menu-types'

type StaticSceneCloud = {
  className: string
  src: string
  style?: React.CSSProperties
}

type DecorativeSceneImageProps = {
  className: string
  fit?: 'contain' | 'cover'
  mobileSrc?: string
  sizes?: string
  src: string
  style?: React.CSSProperties
}

function SelectedFlavorButton() {
  return (
    <BakeryPressable
      aria-pressed="true"
      className="cateringMenuRoundHeading relative inline-flex min-h-[2.5rem] w-full cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[rgba(31,43,20,0.16)] bg-[rgba(31,43,20,0.08)] px-4 text-[0.84rem] tracking-[-0.01em] text-[#1f2b14]"
      type="button"
    >
      <span className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-[1.05rem] overflow-visible">
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
            '--flower-scale': '1.3',
            '--flower-tilt': '-2deg',
            left: '17.5%',
            width: '1.95rem',
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
            '--flower-scale': '1.3',
            '--flower-tilt': '3deg',
            left: '82.5%',
            width: '1.95rem',
            bottom: '-0.02rem',
          } as React.CSSProperties
        }
      />

      <span className="relative z-[1]">Selected</span>
    </BakeryPressable>
  )
}

type TrayFlavorCardProps = {
  actionLabel: string
  /** When set, replaces the single-select Choose/Selected button (e.g. a box stepper). */
  actionSlot?: React.ReactNode
  clouds: readonly StaticSceneCloud[]
  flavor: SelectableFlavor
  isIngredientNoteOpen: boolean
  isSelected: boolean
  meadowSrc: string
  mobileSkySrc?: string
  onChoose: () => void
  onToggleIngredientNotes: () => void
  renderSceneImage: (props: DecorativeSceneImageProps) => React.ReactElement
  sceneryTone: MenuSceneryTone
  skySrc: string
}

export function TrayFlavorCard({
  actionLabel,
  actionSlot,
  clouds,
  flavor,
  isIngredientNoteOpen,
  isSelected,
  meadowSrc,
  mobileSkySrc,
  onChoose,
  onToggleIngredientNotes,
  renderSceneImage,
  sceneryTone,
  skySrc,
}: TrayFlavorCardProps) {
  const hasInfo = Boolean(flavor.receiptBody)
  const receiptId = `${flavor.id}-ingredients-receipt`

  return (
    <BakeryCard
      as="article"
      className={cn(
        'cateringFlavorCard flex h-full flex-col',
        isSelected && 'cateringFlavorCardSelected',
      )}
      radius="lg"
      spacing="none"
      tone="transparent"
    >
      <div
        className="cateringFlavorScene relative overflow-hidden rounded-[0.85rem] bg-[#dbeeff]"
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
        {sceneryTone === 'moonlit' ? <TrayFlavorMoonlitLinework /> : null}

        {hasInfo ? (
          <div className="absolute bottom-2.5 right-2.5 z-[4]">
            <BakeryPressable
              aria-controls={receiptId}
              aria-expanded={isIngredientNoteOpen}
              aria-label={`Show info for ${flavor.title}`}
              className="cateringMenuRoundHeading inline-flex min-h-8 items-center rounded-full border border-[rgba(235,246,255,0.34)] bg-[rgba(246,251,255,0.22)] px-3 py-1.5 text-[0.76rem] tracking-[0.01em] text-[rgba(247,252,255,0.9)] shadow-[0_10px_28px_rgba(6,17,36,0.18),inset_0_1px_0_rgba(255,255,255,0.26)] backdrop-blur-[10px] transition duration-200 hover:-translate-y-px hover:border-[rgba(255,248,227,0.96)] hover:bg-[rgba(255,250,236,0.92)] hover:text-[#5a4121]"
              onClick={onToggleIngredientNotes}
              type="button"
            >
              {flavor.infoButtonLabel ?? 'Info'}
            </BakeryPressable>
          </div>
        ) : null}

        <div className="relative h-[16.3rem]">
          <CookieSheepRig
            bodyFallbackSrc={flavor.bodyFallbackSrc}
            image={flavor.image}
            title={flavor.title}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        <div className="min-w-0 space-y-3">
          <div className="flex items-start gap-3">
            <h4 className="cateringMenuRoundHeading min-w-0 flex-1 text-[1.04rem] leading-[1.04] tracking-[-0.03em] text-[#171510]">
              <span className="block line-clamp-2">{flavor.title}</span>
            </h4>
          </div>
          {flavor.summary ? (
            <p className="line-clamp-2 max-w-none text-[0.77rem] leading-[1.45] tracking-[-0.012em] text-[rgba(23,21,16,0.58)]">
              {flavor.summary}
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-3">
          {actionSlot ? (
            actionSlot
          ) : isSelected ? (
            <SelectedFlavorButton />
          ) : (
            <BakeryPressable
              className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-full border border-[rgba(91,70,37,0.16)] bg-white px-4 text-[0.84rem] font-semibold tracking-[-0.01em] text-[#171510] transition duration-200 hover:border-[rgba(31,43,20,0.24)] hover:bg-[rgba(245,250,239,0.92)]"
              onClick={onChoose}
              type="button"
            >
              {actionLabel}
            </BakeryPressable>
          )}
        </div>
      </div>

      {hasInfo ? (
        <div
          aria-hidden={!isIngredientNoteOpen}
          className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ${
            isIngredientNoteOpen
              ? 'max-h-[26rem] translate-y-0 opacity-100'
              : 'max-h-0 -translate-y-2 opacity-0'
          }`}
        >
          <div
            aria-label={`${flavor.title} info`}
            className="relative mt-2 rounded-[1.1rem] border border-[rgba(121,92,47,0.16)] bg-[linear-gradient(180deg,#fffaf0_0%,#f8efd9_100%)] px-4 pb-4 pt-3 shadow-[0_10px_22px_rgba(23,21,16,0.1)]"
            id={receiptId}
            role="dialog"
          >
            <BakeryPressable
              aria-label={`Close info for ${flavor.title}`}
              className="absolute right-3 top-3 bg-transparent p-0 text-[0.76rem] font-medium text-[rgba(90,65,33,0.7)] transition hover:text-[rgba(90,65,33,1)]"
              onClick={onToggleIngredientNotes}
              type="button"
            >
              Close
            </BakeryPressable>

            <p className="cateringMenuEyebrow pr-12">For {flavor.title}</p>
            <h5 className="mt-0.5 text-[0.9rem] font-semibold tracking-[-0.005em] text-[#5d4119]">
              Product Info
            </h5>

            {flavor.receiptBody ? (
              <CookieInfoNote
                allergens={flavor.allergens}
                body={flavor.receiptBody}
                className="cookieInfoNote--menu"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </BakeryCard>
  )
}

function TrayFlavorMoonlitLinework() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]">
      <div className="absolute bottom-[0.95rem] right-[0.95rem] h-4 w-[4.55rem] rounded-[999px] border-t-[1.5px] border-t-[rgba(209,229,255,0.38)]" />
      <div className="absolute bottom-[1.35rem] right-[1.4rem] h-4 w-[3.6rem] rounded-[999px] border-t-[1.5px] border-t-[rgba(209,229,255,0.3)]" />
      <div className="absolute bottom-[1.75rem] right-[1.9rem] h-4 w-[2.7rem] rounded-[999px] border-t-[1.5px] border-t-[rgba(209,229,255,0.2)]" />
      <div className="absolute bottom-[2.55rem] right-[4.25rem] h-[0.18rem] w-[0.18rem] rounded-full bg-[rgba(242,250,255,0.88)] shadow-[0_0_10px_rgba(255,255,255,0.36)]" />
      <div className="absolute bottom-[2.95rem] right-[2.8rem] h-[0.18rem] w-[0.18rem] rounded-full bg-[rgba(242,250,255,0.82)] shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
      <div className="absolute bottom-[2.25rem] right-[1.6rem] h-[0.18rem] w-[0.18rem] rounded-full bg-[rgba(242,250,255,0.78)] shadow-[0_0_10px_rgba(255,255,255,0.24)]" />
      <div className="absolute bottom-[0.8rem] right-[0.55rem] h-[3.2rem] w-8 bg-[linear-gradient(180deg,transparent,transparent_24%,rgba(173,219,214,0.35)_24.5%,transparent_25%),linear-gradient(180deg,transparent,transparent_32%,rgba(173,219,214,0.28)_32.5%,transparent_33%),linear-gradient(180deg,transparent,transparent_18%,rgba(173,219,214,0.25)_18.5%,transparent_19%)] bg-[length:0.42rem_100%,0.32rem_100%,0.28rem_100%] bg-[position:right_0.4rem_bottom,right_1rem_bottom,right_1.45rem_bottom] bg-no-repeat" />
    </div>
  )
}

type SimpleItemPanelProps = {
  isCartPending: boolean
  onAddToCart: () => void
  /** Wraps the ordering UI inside the scenery container. */
  renderPersuasionPanel: (children: React.ReactNode) => React.ReactNode
  priceInUSD?: number | null
  product: Partial<Product>
}

export function SimpleItemPanel({
  isCartPending,
  onAddToCart,
  renderPersuasionPanel,
  priceInUSD,
  product,
}: SimpleItemPanelProps) {
  return (
    <>
      {renderPersuasionPanel(
        <BakeryCard
          className="space-y-4 border-[rgba(91,70,37,0.16)] bg-[rgba(255,248,242,0.94)] p-4 shadow-[0_10px_24px_rgba(23,21,16,0.08)]"
          radius="lg"
          spacing="none"
          tone="outline"
        >
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

          <SceneButton
            className="cateringAddToCartButton cateringMenuRoundHeading min-h-[3rem] w-full text-[0.98rem] tracking-[-0.02em]"
            loading={isCartPending}
            loadingLabel={`Adding ${product.title ?? 'item'} to cart`}
            onClick={onAddToCart}
            variant="primary"
          >
            Add to cart
          </SceneButton>
        </BakeryCard>,
      )}
    </>
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
  /** Wraps the ordering UI inside the scenery container. */
  renderPersuasionPanel: (children: React.ReactNode) => React.ReactNode
  renderSceneImage: (props: DecorativeSceneImageProps) => React.ReactElement
  sceneryTone: MenuSceneryTone
  selectedFlavor: SelectableFlavor | null
  selectableFlavors: SelectableFlavor[]
  shouldPulseTraySummary: boolean
}

export function BatchBuilderPanel({
  flavorCardCloudsForScenery,
  flavorCardMeadowForScenery,
  flavorCardMobileSkyForScenery,
  flavorCardSkyForScenery,
  isTrayPending,
  onAddFlavor,
  onAddToCart,
  renderPersuasionPanel,
  renderSceneImage,
  sceneryTone,
  selectedFlavor,
  selectableFlavors,
  shouldPulseTraySummary,
}: BatchBuilderPanelProps) {
  const canAddTray = Boolean(selectedFlavor)
  const [areIngredientReceiptsOpen, setAreIngredientReceiptsOpen] = React.useState(false)
  const [edgeStretchSide, setEdgeStretchSide] = React.useState<'left' | 'right' | null>(null)
  const [edgeStretchAmount, setEdgeStretchAmount] = React.useState(0)
  const touchStartXRef = React.useRef<number | null>(null)
  const touchScrollLeftRef = React.useRef(0)
  const releaseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearEdgeStretch = React.useCallback(() => {
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current)
      releaseTimeoutRef.current = null
    }

    setEdgeStretchAmount(0)
    setEdgeStretchSide(null)
  }, [])

  const releaseEdgeStretch = React.useCallback(() => {
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current)
    }

    releaseTimeoutRef.current = setTimeout(() => {
      setEdgeStretchAmount(0)
      setEdgeStretchSide(null)
      releaseTimeoutRef.current = null
    }, 180)
  }, [])

  React.useEffect(() => {
    return () => {
      if (releaseTimeoutRef.current) {
        clearTimeout(releaseTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      {renderPersuasionPanel(
      <div className="space-y-4">
        <p
          className={cn(
            'cateringTraySelectionHint text-[0.96rem] leading-7',
            shouldPulseTraySummary && 'cateringTraySelectionHintPulse',
          )}
        >
          {selectedFlavor
            ? `${selectedFlavor.title} is selected — pick another below only if you want to switch.`
            : 'Pick one cookie flavor for your tray below.'}
        </p>

        <div
          aria-label="Cookie flavor chooser"
          className="cateringFlavorRail"
          data-edge-stretch-side={edgeStretchSide ?? undefined}
          role="region"
          style={
            {
              ['--catering-edge-stretch' as string]: `${edgeStretchAmount}px`,
            } as React.CSSProperties
          }
          onScroll={(event) => {
            const rail = event.currentTarget
            const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0)

            if (
              (edgeStretchSide === 'left' && rail.scrollLeft > 1) ||
              (edgeStretchSide === 'right' && rail.scrollLeft < maxScrollLeft - 1)
            ) {
              clearEdgeStretch()
            }
          }}
          onTouchEnd={() => {
            touchStartXRef.current = null
            releaseEdgeStretch()
          }}
          onTouchMove={(event) => {
            const startX = touchStartXRef.current

            if (startX == null) {
              return
            }

            const currentX = event.touches[0]?.clientX

            if (typeof currentX !== 'number') {
              return
            }

            const deltaX = currentX - startX
            const rail = event.currentTarget
            const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0)
            const isAtLeftEdge = touchScrollLeftRef.current <= 0 && rail.scrollLeft <= 0
            const isAtRightEdge =
              touchScrollLeftRef.current >= maxScrollLeft - 1 &&
              rail.scrollLeft >= maxScrollLeft - 1

            if (isAtLeftEdge && deltaX > 0) {
              event.preventDefault()
              setEdgeStretchSide('left')
              setEdgeStretchAmount(Math.min(deltaX * 0.22, 18))
              return
            }

            if (isAtRightEdge && deltaX < 0) {
              event.preventDefault()
              setEdgeStretchSide('right')
              setEdgeStretchAmount(Math.min(Math.abs(deltaX) * 0.22, 18))
              return
            }

            if (edgeStretchAmount !== 0) {
              clearEdgeStretch()
            }
          }}
          onTouchStart={(event) => {
            touchStartXRef.current = event.touches[0]?.clientX ?? null
            touchScrollLeftRef.current = event.currentTarget.scrollLeft
          }}
        >
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
                    isIngredientNoteOpen={areIngredientReceiptsOpen}
                    isSelected={isSelected}
                    meadowSrc={flavorCardMeadowForScenery}
                    mobileSkySrc={flavorCardMobileSkyForScenery}
                    onChoose={() => onAddFlavor(flavor.id)}
                    onToggleIngredientNotes={() =>
                      setAreIngredientReceiptsOpen((current) => !current)
                    }
                    renderSceneImage={renderSceneImage}
                    sceneryTone={sceneryTone}
                    skySrc={flavorCardSkyForScenery}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <SceneButton
          className="cateringAddToCartButton cateringMenuRoundHeading min-h-[3rem] w-full text-[0.98rem] tracking-[-0.02em]"
          disabled={!canAddTray}
          loading={isTrayPending}
          loadingLabel="Adding tray to cart"
          onClick={onAddToCart}
          variant="primary"
        >
          {selectedFlavor
            ? `Add ${selectedFlavor.title} Tray to cart`
            : 'Choose a tray flavor first'}
        </SceneButton>
      </div>,
      )}
    </>
  )
}

function BoxFlavorStepper({
  canIncrement,
  count,
  flavorTitle,
  onDecrement,
  onIncrement,
}: {
  canIncrement: boolean
  count: number
  flavorTitle: string
  onDecrement: () => void
  onIncrement: () => void
}) {
  const stepButton =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(28,46,16,0.16)] bg-[rgba(28,46,16,0.06)] text-[#1c2e10] transition duration-150 hover:bg-[#1c2e10] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(25,56,34,0.6)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[rgba(28,46,16,0.06)] disabled:hover:text-[#1c2e10]'

  return (
    <div className="flex items-center justify-between gap-2 rounded-full border border-[rgba(91,70,37,0.16)] bg-white px-1.5 py-1">
      <button
        aria-label={`Remove one ${flavorTitle}`}
        className={stepButton}
        disabled={count === 0}
        onClick={onDecrement}
        type="button"
      >
        <Minus aria-hidden="true" size={16} strokeWidth={2.6} />
      </button>
      <span
        aria-live="polite"
        className="cateringMenuRoundHeading min-w-[2.25rem] text-center text-[1rem] text-[#171510]"
      >
        {count}
      </span>
      <button
        aria-label={`Add one ${flavorTitle}`}
        className={stepButton}
        disabled={!canIncrement}
        onClick={onIncrement}
        type="button"
      >
        <Plus aria-hidden="true" size={16} strokeWidth={2.6} />
      </button>
    </div>
  )
}

type MiniBoxBuilderPanelProps = {
  boxCounts: Record<number, number>
  boxTotal: number
  capacity: number
  flavorCardCloudsForScenery: readonly StaticSceneCloud[]
  flavorCardMeadowForScenery: string
  flavorCardMobileSkyForScenery?: string
  flavorCardSkyForScenery: string
  isBoxPending: boolean
  onAddBox: () => void
  onClearBox: () => void
  onDecrement: (flavorID: number) => void
  onIncrement: (flavorID: number) => void
  priceInUSD?: number | null
  renderPersuasionPanel: (children: React.ReactNode) => React.ReactNode
  renderSceneImage: (props: DecorativeSceneImageProps) => React.ReactElement
  sceneryTone: MenuSceneryTone
  selectableFlavors: SelectableFlavor[]
}

export function MiniBoxBuilderPanel({
  boxCounts,
  boxTotal,
  capacity,
  flavorCardCloudsForScenery,
  flavorCardMeadowForScenery,
  flavorCardMobileSkyForScenery,
  flavorCardSkyForScenery,
  isBoxPending,
  onAddBox,
  onClearBox,
  onDecrement,
  onIncrement,
  priceInUSD,
  renderPersuasionPanel,
  renderSceneImage,
  sceneryTone,
  selectableFlavors,
}: MiniBoxBuilderPanelProps) {
  const [areIngredientReceiptsOpen, setAreIngredientReceiptsOpen] = React.useState(false)
  const isFull = boxTotal >= capacity
  const remaining = Math.max(0, capacity - boxTotal)

  return (
    <>
      {renderPersuasionPanel(
        <div className="space-y-4">
          <ProgressGarden
            aside={
              typeof priceInUSD === 'number' ? (
                <Price
                  amount={priceInUSD}
                  className="cateringMenuRoundHeading text-[1.02rem] tracking-[-0.02em] text-[#171510]"
                />
              ) : undefined
            }
            currentCount={boxTotal}
            label="Build your box"
            title={`${boxTotal} of ${capacity} cookies`}
            totalCount={capacity}
          />

          <div aria-label="Mini box flavor picker" className="cateringFlavorRail" role="region">
            <div className="cateringFlavorRailInner">
              {selectableFlavors.map((flavor) => {
                const count = boxCounts[flavor.id] ?? 0

                return (
                  <div className="cateringFlavorRailItem" key={flavor.id}>
                    <TrayFlavorCard
                      actionLabel={`Add ${flavor.title}`}
                      actionSlot={
                        <BoxFlavorStepper
                          canIncrement={!isFull}
                          count={count}
                          flavorTitle={flavor.title}
                          onDecrement={() => onDecrement(flavor.id)}
                          onIncrement={() => onIncrement(flavor.id)}
                        />
                      }
                      clouds={flavorCardCloudsForScenery}
                      flavor={flavor}
                      isIngredientNoteOpen={areIngredientReceiptsOpen}
                      isSelected={count > 0}
                      meadowSrc={flavorCardMeadowForScenery}
                      mobileSkySrc={flavorCardMobileSkyForScenery}
                      onChoose={() => onIncrement(flavor.id)}
                      onToggleIngredientNotes={() =>
                        setAreIngredientReceiptsOpen((current) => !current)
                      }
                      renderSceneImage={renderSceneImage}
                      sceneryTone={sceneryTone}
                      skySrc={flavorCardSkyForScenery}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SceneButton
              className="cateringAddToCartButton cateringMenuRoundHeading min-h-[3rem] flex-1 text-[0.98rem] tracking-[-0.02em]"
              disabled={!isFull}
              loading={isBoxPending}
              loadingLabel="Adding box to cart"
              onClick={onAddBox}
              variant="primary"
            >
              {isFull
                ? 'Add box to cart'
                : `Pick ${remaining} more cookie${remaining === 1 ? '' : 's'}`}
            </SceneButton>

            {boxTotal > 0 ? (
              <BakeryPressable
                className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-[rgba(244,237,226,0.28)] bg-[rgba(244,237,226,0.08)] px-4 text-[0.84rem] font-semibold tracking-[-0.01em] text-[#f4ede2] transition duration-200 hover:bg-[rgba(244,237,226,0.16)]"
                onClick={onClearBox}
                type="button"
              >
                Clear
              </BakeryPressable>
            ) : null}
          </div>
        </div>,
      )}
    </>
  )
}
