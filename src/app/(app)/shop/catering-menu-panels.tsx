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
            '--flower-scale': '1.9',
            '--flower-tilt': '-2deg',
            left: '16.5%',
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
            left: '83.5%',
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
  const hasIngredients = flavor.ingredients.length > 0
  const receiptId = `${flavor.id}-ingredients-receipt`

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
        {sceneryTone === 'moonlit' ? <TrayFlavorMoonlitLinework /> : null}

        {hasIngredients ? (
          <div className="absolute bottom-2.5 right-2.5 z-[4]">
            <button
              aria-controls={receiptId}
              aria-expanded={isIngredientNoteOpen}
              aria-label={`Show ingredients for ${flavor.title}`}
              className="cateringMenuRoundHeading inline-flex min-h-8 items-center rounded-full border border-[rgba(235,246,255,0.34)] bg-[rgba(246,251,255,0.22)] px-3 py-1.5 text-[0.76rem] tracking-[0.01em] text-[rgba(247,252,255,0.9)] shadow-[0_10px_28px_rgba(6,17,36,0.18),inset_0_1px_0_rgba(255,255,255,0.26)] backdrop-blur-[10px] transition duration-200 hover:-translate-y-px hover:border-[rgba(255,248,227,0.96)] hover:bg-[rgba(255,250,236,0.92)] hover:text-[#5a4121]"
              onClick={onToggleIngredientNotes}
              type="button"
            >
              {flavor.infoButtonLabel ?? 'Ingredients'}
            </button>
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

      {hasIngredients ? (
        <div
          aria-hidden={!isIngredientNoteOpen}
          className={`overflow-hidden transition-[max-height,opacity,transform,padding] duration-300 ${
            isIngredientNoteOpen
              ? 'max-h-[22rem] translate-y-0 px-3 pb-3 opacity-100'
              : 'max-h-0 -translate-y-2 px-3 pb-0 opacity-0'
          }`}
        >
          <div
            aria-label={`${flavor.title} ingredients`}
            className="relative rounded-b-[1.15rem] rounded-t-[0.72rem] border border-t-0 border-[rgba(121,92,47,0.16)] bg-[linear-gradient(180deg,#fffaf0_0%,#f8efd9_100%)] px-4 pb-4 pt-3 shadow-[0_16px_28px_rgba(23,21,16,0.08)]"
            id={receiptId}
            role="dialog"
          >
            <button
              aria-label={`Close ingredients for ${flavor.title}`}
              className="cateringMenuRoundHeading absolute right-3 top-3 text-[0.76rem] text-[rgba(90,65,33,0.7)] transition hover:text-[rgba(90,65,33,1)]"
              onClick={onToggleIngredientNotes}
              type="button"
            >
              Close
            </button>

            <p className="cateringMenuEyebrow pr-12">For {flavor.title}</p>
            <h5 className="cateringMenuRoundHeading mt-1 text-[1rem] tracking-[-0.02em] text-[#5d4119]">
              {flavor.ingredientsNoteTitle ?? 'Ingredient Notes'}
            </h5>
            {flavor.ingredientsIntro ? (
              <p className="mt-2 max-w-[30ch] text-[0.8rem] leading-[1.45] text-[rgba(88,64,32,0.78)]">
                {flavor.ingredientsIntro}
              </p>
            ) : null}

            <ul className="mt-3 grid gap-2">
              {flavor.ingredients.map((ingredient) => (
                <li
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-0.5 border-b border-dashed border-[rgba(121,92,47,0.14)] pb-2 text-[#4f3818] last:border-b-0 last:pb-0"
                  key={`${ingredient.name}-${ingredient.detail ?? ''}`}
                >
                  <span className="cateringMenuRoundHeading text-[0.85rem] tracking-[-0.01em]">
                    {ingredient.name}
                  </span>
                  {ingredient.detail ? (
                    <span className="text-right text-[0.68rem] uppercase tracking-[0.08em] text-[rgba(92,67,31,0.58)]">
                      {ingredient.detail}
                    </span>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>

            <div
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-[1px] h-4 bg-[linear-gradient(-45deg,transparent_33%,#f8efd9_33%,#f8efd9_66%,transparent_66%),linear-gradient(45deg,transparent_33%,#f8efd9_33%,#f8efd9_66%,transparent_66%)] bg-[length:14px_16px] bg-[position:left_bottom] bg-repeat-x"
            />
          </div>
        </div>
      ) : null}
    </article>
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
              touchScrollLeftRef.current >= maxScrollLeft - 1 && rail.scrollLeft >= maxScrollLeft - 1

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
