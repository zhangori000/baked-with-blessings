'use client'

import { Price } from '@/components/Price'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  bakeryPrimitiveTokens,
  bakerySceneThemes,
  useBakeryAnnouncer,
} from '@/design-system/bakery'
import type { Product } from '@/payload-types'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ChevronDownIcon, LoaderCircle } from 'lucide-react'
import Image from 'next/image'
import React, { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { BatchBuilderPanel, SimpleItemPanel } from './catering-menu-panels'
import {
  DecorativeSceneImage,
  MenuHero,
  PersuasionGardenPanel,
  flavorCardCloudsByScenery,
  meadowByScenery,
  menuSceneryTones,
  mobileSkyByScenery,
  preloadSceneryAssets,
  skyByScenery,
  type PersuasionGardenPanelClassNames,
} from './catering-menu-scenery'
import type { MenuSceneryTone, SelectableFlavor } from './catering-menu-types'
import { buildCookiePosterAsset } from './cookiePosterData'

type CateringMenuSectionProps = {
  initialSceneryTone?: MenuSceneryTone
  products: Partial<Product>[]
}

type SceneryPickerAnchor = 'hero' | 'panel'

const menuPersuasionPanelClassNames = {
  actionRow: 'cateringMenuPersuasionActionRow',
  galleryFace: 'cateringMenuPersuasionGalleryFace',
  photoBoard: 'cateringMenuPersuasionPhotoBoard',
  root: 'cateringMenuPersuasionRoot',
} satisfies PersuasionGardenPanelClassNames

const cateringDisplayOrder = [
  'cookie-tray',
  'mini-cookie-tray',
  'banana-pudding-10-pack',
  'sticky-toffee-pudding-10-pack',
  'focaccia-tray',
] as const

const normalizeImage = (product: Partial<Product>) => {
  const firstGalleryItem = product.gallery?.[0]

  if (
    firstGalleryItem &&
    typeof firstGalleryItem === 'object' &&
    firstGalleryItem.image &&
    typeof firstGalleryItem.image === 'object'
  ) {
    return firstGalleryItem.image
  }

  if (
    typeof product.meta === 'object' &&
    product.meta?.image &&
    typeof product.meta.image === 'object'
  ) {
    return product.meta.image
  }

  return null
}

const resolveSummary = (product: Partial<Product>) => {
  if (typeof product.meta === 'object' && product.meta?.description?.trim()) {
    return product.meta.description.trim()
  }

  return ''
}

const normalizeProductRelation = (value: number | Product | null | undefined): Product | null => {
  if (value && typeof value === 'object') {
    return value
  }

  return null
}

const buildSelectableFlavors = (product: Partial<Product>): SelectableFlavor[] => {
  const selectableProducts = Array.isArray(product.selectableProducts)
    ? product.selectableProducts
    : []

  return selectableProducts
    .map((selectableProduct) => normalizeProductRelation(selectableProduct))
    .filter((selectableProduct): selectableProduct is Product => Boolean(selectableProduct?.id))
    .map((selectableProduct) => {
      const posterAsset = buildCookiePosterAsset(selectableProduct)

      return {
        allergens: posterAsset?.allergens,
        bodyFallbackSrc: posterAsset?.bodyFallbackSrc ?? '/cookie-singular-brookie.svg',
        id: selectableProduct.id,
        image: posterAsset?.image ?? normalizeImage(selectableProduct),
        infoButtonLabel: posterAsset?.infoButtonLabel,
        ingredients: posterAsset?.ingredients ?? [],
        ingredientsIntro: posterAsset?.ingredientsIntro,
        ingredientsNoteTitle: posterAsset?.ingredientsNoteTitle,
        receiptBody: posterAsset?.receiptBody,
        summary: posterAsset?.summary ?? resolveSummary(selectableProduct),
        title: posterAsset?.title ?? selectableProduct.title,
      }
    })
}

const sortProductsForDisplay = (products: Partial<Product>[]) => {
  const orderMap = new Map<string, number>(cateringDisplayOrder.map((slug, index) => [slug, index]))

  return [...products].sort((left, right) => {
    const leftOrder = orderMap.get(left.slug ?? '') ?? Number.MAX_SAFE_INTEGER
    const rightOrder = orderMap.get(right.slug ?? '') ?? Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return (left.title ?? '').localeCompare(right.title ?? '')
  })
}

function TrayRowIndicator() {
  return (
    <span className="cateringRowIndicator" aria-hidden="true">
      <span className="cateringRowIndicatorFlowerWrap">
        <Image
          alt=""
          aria-hidden="true"
          className="cateringRowIndicatorFlower"
          height={40}
          src="/flowers/menu-nav-flower.svg"
          unoptimized
          width={40}
        />
      </span>
      <LoaderCircle className="cateringRowIndicatorSpinner" />
    </span>
  )
}

function TrayChevronIndicator() {
  return (
    <span className="cateringRowChevron" aria-hidden="true">
      <ChevronDownIcon className="cateringRowChevronIcon" />
    </span>
  )
}

function CateringMenuRow({
  isSceneryPickerOpen,
  isSceneChanging,
  index,
  onSelectScenery,
  onToggleSceneryPicker,
  product,
  sceneryTone,
}: {
  isSceneryPickerOpen: boolean
  isSceneChanging: boolean
  index: number
  onSelectScenery: (tone: MenuSceneryTone) => void
  onToggleSceneryPicker: () => void
  product: Partial<Product>
  sceneryTone: MenuSceneryTone
}) {
  const { addItem, isLoading } = useCart()
  const [selectedFlavorID, setSelectedFlavorID] = useState<number | null>(null)
  const [isSubmittingToCart, setIsSubmittingToCart] = useState(false)
  const [showOpeningIndicator, setShowOpeningIndicator] = useState(false)
  const [shouldPulseTraySummary, setShouldPulseTraySummary] = useState(false)
  const openingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const traySummaryPulseFrameRef = useRef<number | null>(null)
  const traySummaryPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerScrollFrameRef = useRef<number | null>(null)
  const summary = resolveSummary(product)
  const isBatchBuilder = product.menuBehavior === 'batchBuilder'
  const requiredSelectionCount =
    isBatchBuilder && typeof product.requiredSelectionCount === 'number'
      ? product.requiredSelectionCount
      : 0
  const selectableFlavors = useMemo(() => buildSelectableFlavors(product), [product])

  const selectedFlavor = useMemo(
    () => selectableFlavors.find((flavor) => flavor.id === selectedFlavorID) ?? null,
    [selectableFlavors, selectedFlavorID],
  )

  const traySelectionsForSummary = useMemo(
    () =>
      selectedFlavor && requiredSelectionCount > 0
        ? [
            {
              product: {
                id: selectedFlavor.id,
                title: selectedFlavor.title,
              } as Product,
              quantity: requiredSelectionCount,
            },
          ]
        : [],
    [requiredSelectionCount, selectedFlavor],
  )

  const traySelectionsForCart = useMemo(
    () =>
      traySelectionsForSummary.map((selection) => ({
        product: selection.product.id,
        quantity: selection.quantity,
      })),
    [traySelectionsForSummary],
  )
  const flavorCardCloudsForScenery =
    flavorCardCloudsByScenery[sceneryTone] ?? flavorCardCloudsByScenery.classic
  const flavorCardSkyForScenery = skyByScenery[sceneryTone] ?? skyByScenery.classic
  const flavorCardMobileSkyForScenery = mobileSkyByScenery[sceneryTone]
  const flavorCardMeadowForScenery =
    sceneryTone === 'blossom'
      ? '/sceneries/blossom-grass-mound.svg'
      : (meadowByScenery[sceneryTone] ?? meadowByScenery.classic)

  const handleAddFlavor = (flavorID: number) => {
    if (selectedFlavorID === flavorID) {
      return
    }

    setSelectedFlavorID(flavorID)
    setShouldPulseTraySummary(false)

    if (traySummaryPulseFrameRef.current !== null) {
      cancelAnimationFrame(traySummaryPulseFrameRef.current)
    }
    if (traySummaryPulseTimeoutRef.current) {
      clearTimeout(traySummaryPulseTimeoutRef.current)
    }

    traySummaryPulseFrameRef.current = requestAnimationFrame(() => {
      traySummaryPulseFrameRef.current = null
      setShouldPulseTraySummary(true)
      traySummaryPulseTimeoutRef.current = setTimeout(() => {
        setShouldPulseTraySummary(false)
        traySummaryPulseTimeoutRef.current = null
      }, 260)
    })
  }

  const isCartPending = isLoading || isSubmittingToCart

  useEffect(() => {
    return () => {
      if (openingIndicatorTimeoutRef.current) {
        clearTimeout(openingIndicatorTimeoutRef.current)
      }
      if (traySummaryPulseFrameRef.current !== null) {
        cancelAnimationFrame(traySummaryPulseFrameRef.current)
      }
      if (traySummaryPulseTimeoutRef.current) {
        clearTimeout(traySummaryPulseTimeoutRef.current)
      }
      if (triggerScrollFrameRef.current !== null) {
        cancelAnimationFrame(triggerScrollFrameRef.current)
      }
    }
  }, [])

  const queueOpeningIndicatorReset = () => {
    if (openingIndicatorTimeoutRef.current) {
      clearTimeout(openingIndicatorTimeoutRef.current)
    }

    openingIndicatorTimeoutRef.current = setTimeout(() => {
      setShowOpeningIndicator(false)
      openingIndicatorTimeoutRef.current = null
    }, 480)
  }

  const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const trigger = event.currentTarget
    const triggerTopBeforeOpen = trigger.getBoundingClientRect().top

    if (triggerScrollFrameRef.current !== null) {
      cancelAnimationFrame(triggerScrollFrameRef.current)
    }

    triggerScrollFrameRef.current = requestAnimationFrame(() => {
      triggerScrollFrameRef.current = requestAnimationFrame(() => {
        triggerScrollFrameRef.current = null

        if (!trigger.isConnected) {
          return
        }

        const scrollDelta = trigger.getBoundingClientRect().top - triggerTopBeforeOpen

        if (Math.abs(scrollDelta) > 1) {
          window.scrollBy({ top: scrollDelta, left: 0, behavior: 'auto' })
        }
      })
    })

    if (openingIndicatorTimeoutRef.current) {
      clearTimeout(openingIndicatorTimeoutRef.current)
      openingIndicatorTimeoutRef.current = null
    }

    setShowOpeningIndicator(true)
    queueOpeningIndicatorReset()
  }

  const handleAddToCart = async () => {
    if (!product.id || isCartPending) {
      return
    }

    if (isBatchBuilder) {
      if (requiredSelectionCount <= 0 || !selectedFlavor || traySelectionsForCart.length === 0) {
        toast.info('Choose one cookie flavor for the tray before adding it to cart.')
        return
      }

      setIsSubmittingToCart(true)

      try {
        await addItem({
          batchSelections: traySelectionsForCart,
          product: product.id,
        } as Parameters<typeof addItem>[0])
        toast.success(`${product.title ?? 'Tray'} added to cart.`)
        setSelectedFlavorID(null)
      } catch {
        toast.error('Unable to add tray to cart right now.')
      } finally {
        setIsSubmittingToCart(false)
      }

      return
    }

    setIsSubmittingToCart(true)

    try {
      await addItem({ product: product.id })
      toast.success(`${product.title ?? 'Item'} added to cart.`)
    } catch {
      toast.error('Unable to add item to cart right now.')
    } finally {
      setIsSubmittingToCart(false)
    }
  }

  return (
    <AccordionItem
      className="cateringMenuAccordionItem border-b border-[rgba(23,21,16,0.14)]"
      value={product.slug ?? `row-${index}`}
    >
      <AccordionTrigger
        className="cateringRowTrigger gap-6 py-8 text-left hover:no-underline md:py-10"
        indicator={showOpeningIndicator ? <TrayRowIndicator /> : <TrayChevronIndicator />}
        onClick={handleTriggerClick}
      >
        <div className="grid w-full gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <h3 className="cateringMenuRoundHeading text-[2.15rem] leading-[0.95] tracking-[-0.04em] text-[#171510] md:text-[2.65rem]">
                {product.title ?? 'Menu item'}
              </h3>
              {product.menuPortionLabel ? (
                <span className="cateringPortionInline">{product.menuPortionLabel}</span>
              ) : null}
            </div>
            <p className="max-w-[41rem] text-[0.98rem] leading-8 text-[rgba(23,21,16,0.72)] md:text-[1.05rem]">
              {summary}
            </p>
          </div>

          <div className="cateringPriceBlock text-left md:text-right">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
              Price
            </p>
            {typeof product.priceInUSD === 'number' ? (
              <Price
                amount={product.priceInUSD}
                className="cateringMenuRoundHeading mt-2 text-[1.42rem] tracking-[-0.02em] text-[#171510] md:text-[1.56rem]"
              />
            ) : null}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="cateringMenuAccordionContent pt-1 pb-9" motion="none">
        {isBatchBuilder ? (
          <BatchBuilderPanel
            flavorCardCloudsForScenery={flavorCardCloudsForScenery}
            flavorCardMeadowForScenery={flavorCardMeadowForScenery}
            flavorCardMobileSkyForScenery={flavorCardMobileSkyForScenery}
            flavorCardSkyForScenery={flavorCardSkyForScenery}
            isTrayPending={isCartPending}
            onAddFlavor={handleAddFlavor}
            onAddToCart={handleAddToCart}
            persuasionPanel={
              <PersuasionGardenPanel
                classNames={menuPersuasionPanelClassNames}
                isSceneryPickerOpen={isSceneryPickerOpen}
                isSceneChanging={isSceneChanging}
                onSelectScenery={onSelectScenery}
                onToggleSceneryPicker={onToggleSceneryPicker}
                product={product}
                key={`${product.id ?? product.slug ?? 'panel'}-${sceneryTone}`}
                sceneryTone={sceneryTone}
                summary={resolveSummary(product)}
              />
            }
            renderSceneImage={(props) => <DecorativeSceneImage {...props} />}
            priceInUSD={product.priceInUSD}
            sceneryTone={sceneryTone}
            selectedFlavor={selectedFlavor}
            selectableFlavors={selectableFlavors}
            shouldPulseTraySummary={shouldPulseTraySummary}
          />
        ) : (
          <SimpleItemPanel
            isCartPending={isCartPending}
            onAddToCart={handleAddToCart}
            persuasionPanel={
              <PersuasionGardenPanel
                classNames={menuPersuasionPanelClassNames}
                isSceneryPickerOpen={isSceneryPickerOpen}
                isSceneChanging={isSceneChanging}
                onSelectScenery={onSelectScenery}
                onToggleSceneryPicker={onToggleSceneryPicker}
                product={product}
                key={`${product.id ?? product.slug ?? 'panel'}-${sceneryTone}`}
                sceneryTone={sceneryTone}
                summary={resolveSummary(product)}
              />
            }
            priceInUSD={product.priceInUSD}
            product={product}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export function CateringMenuSection({
  initialSceneryTone = 'dawn',
  products,
}: CateringMenuSectionProps) {
  const orderedProducts = useMemo(() => sortProductsForDisplay(products), [products])
  const [heroSceneryTone, setHeroSceneryTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const { announce } = useBakeryAnnouncer()
  const isSceneChanging = false
  const [sceneryPickerAnchor, setSceneryPickerAnchor] = useState<SceneryPickerAnchor | null>(null)

  useEffect(() => {
    for (const sceneryTone of menuSceneryTones) {
      preloadSceneryAssets(sceneryTone)
    }
  }, [])

  if (orderedProducts.length === 0) {
    return null
  }

  const toggleSceneryPicker = (anchor: SceneryPickerAnchor) => {
    if (isSceneChanging) {
      return
    }

    setSceneryPickerAnchor((current) => (current === anchor ? null : anchor))
  }

  const handleSelectHeroScenery = (nextSceneryTone: MenuSceneryTone) => {
    if (isSceneChanging || nextSceneryTone === heroSceneryTone) {
      return
    }

    preloadSceneryAssets(nextSceneryTone)
    announce(`Scenery changed to ${bakerySceneThemes[nextSceneryTone]?.label ?? nextSceneryTone}.`)
    startTransition(() => {
      setHeroSceneryTone(nextSceneryTone)
    })
    setSceneryPickerAnchor(null)
  }

  return (
    <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
      <MenuHero
        isSceneryPickerOpen={sceneryPickerAnchor === 'hero'}
        isSceneChanging={isSceneChanging}
        key={heroSceneryTone}
        onSelectScenery={handleSelectHeroScenery}
        onToggleSceneryPicker={() => toggleSceneryPicker('hero')}
        sceneryTone={heroSceneryTone}
      />

      <section
        className="cateringMenuBand relative left-1/2 w-screen -translate-x-1/2"
        id="catering-menu-items"
      >
        <div className="container pt-0 pb-6 md:pt-0 md:pb-10">
          <div className="cateringMenuPanel">
            <Accordion collapsible type="single">
              {orderedProducts.map((product, index) => (
                <CateringMenuRow
                  isSceneryPickerOpen={sceneryPickerAnchor === 'panel'}
                  isSceneChanging={isSceneChanging}
                  index={index}
                  key={product.id ?? product.slug ?? index}
                  onSelectScenery={handleSelectHeroScenery}
                  onToggleSceneryPicker={() => toggleSceneryPicker('panel')}
                  product={product}
                  sceneryTone={heroSceneryTone}
                />
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <style>{`
        .cateringMenuRoundHeading {
          font-family: var(--font-rounded-display);
          font-weight: 700;
        }

        .cateringPitch :is(h1, h2, h3, h4) {
          color: #171510;
          font-family: var(--font-rounded-display);
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .cateringPitch :is(p, li) {
          color: rgba(23, 21, 16, 0.78);
        }

        .cateringPitch :is(strong, b),
        .cateringPersuasionBody :is(strong, b) {
          color: inherit;
          font-weight: 800;
        }

        .cateringPersuasionBody :is(h1, h2, h3, h4) {
          display: none;
        }

        .cateringPersuasionBody :is(p, li) {
          color: var(--scene-text, #27496b);
          font-weight: 650;
        }

        .cateringMenuBand {
          background: #fff8f2;
          margin-top: -1px;
        }

        .cateringMenuPanel {
          padding: 0;
        }

        .cateringPersuasionSceneryPiece {
          pointer-events: none;
          position: absolute;
        }

        .cateringPersuasionPanel {
          background: var(
            --catering-panel-fill,
            var(
              --scene-panel-fill,
              linear-gradient(
                180deg,
                rgba(223, 239, 255, 0.92) 0%,
                rgba(216, 233, 246, 0.94) 100%
              )
            )
          );
          contain: paint;
          isolation: isolate;
        }

        .cateringPanelLayer {
          backface-visibility: hidden;
          contain: layout paint style;
          transform: translate3d(0, 0, 0);
        }

        .cateringPanelLayerActive {
          z-index: 2;
        }

        .cateringPanelLayerBase {
          pointer-events: none;
          z-index: 1;
        }

        .cateringPanelLayerPaintIn {
          pointer-events: none;
          z-index: 5;
          will-change: clip-path;
        }

        .cateringPanelLayerPaintInFromTop {
          animation: cateringPaintRevealDown
            var(--catering-tear-duration, ${bakeryPrimitiveTokens.motion.panelPaint})
            ${bakeryPrimitiveTokens.motion.easeStandard} both;
          clip-path: inset(0 0 100% 0 round 1.45rem);
        }

        .cateringPanelLayerPaintInFromBottom {
          animation: cateringPaintRevealUp
            var(--catering-tear-duration, ${bakeryPrimitiveTokens.motion.panelPaint})
            ${bakeryPrimitiveTokens.motion.easeStandard} both;
          clip-path: inset(100% 0 0 0 round 1.45rem);
        }

        .cateringPanelForeground,
        .cateringGalleryContent {
          backface-visibility: hidden;
          transform: translate3d(0, 0, 0);
          transition:
            opacity ${bakeryPrimitiveTokens.motion.panelSwap} ${bakeryPrimitiveTokens.motion.easeEnter},
            transform ${bakeryPrimitiveTokens.motion.panelSwap}
              ${bakeryPrimitiveTokens.motion.easeEnter};
          will-change: opacity, transform;
        }

        .cateringPanelForegroundHidden,
        .cateringGalleryContentTransitioning {
          opacity: 0;
          transform: translate3d(0, -0.24rem, 0) scale(0.996);
        }

        .cateringPanelForegroundEntering,
        .cateringGalleryContentEntering {
          animation: cateringPanelContentEnter ${bakeryPrimitiveTokens.motion.panelSwap}
            ${bakeryPrimitiveTokens.motion.easeEnter} both;
        }

        .cateringPersuasionSky {
          inset: 0;
          opacity: 0.92;
          z-index: 0;
        }

        .cateringPersuasionCloud {
          animation: cateringCloudBob 8.4s ease-in-out infinite;
          opacity: 0.96;
          position: absolute;
          z-index: 1;
        }

        .cateringPhotosButton {
          align-items: center;
          background: #fff8e4;
          border-color: rgba(84, 82, 40, 0.28);
          box-shadow: none;
          color: #3f411c;
          gap: 0.5rem;
          min-height: 2.72rem;
          padding: 0.58rem 1.18rem 0.6rem;
        }

        .cateringPhotosButton:hover,
        .cateringPhotosButton:focus-visible {
          background: #fff4c8;
          border-color: rgba(84, 82, 40, 0.42);
          box-shadow: none;
          color: #2f3213;
          transform: none;
        }

        .cateringPhotosButtonIcon {
          align-self: center;
          display: block;
          flex: 0 0 auto;
          height: 1.45rem;
          object-fit: contain;
          transform: translateY(-0.28rem);
          width: 1.78rem;
        }

        .cateringPhotosButton > span {
          line-height: 1;
        }

        .cateringAddToCartButton.bakerySceneButton {
          background: #193822;
          border-color: transparent;
          box-shadow: none;
          color: #fffaf0;
        }

        .cateringAddToCartButton.bakerySceneButton:hover,
        .cateringAddToCartButton.bakerySceneButton:focus-visible {
          background: #102b19;
          border-color: transparent;
          box-shadow: none;
          color: #fffaf0;
        }

        .cateringAddToCartButton.bakerySceneButton:focus-visible {
          outline: 3px solid rgba(25, 56, 34, 0.28);
          outline-offset: 3px;
        }

        .cateringPersuasionMeadow {
          bottom: -0.4rem;
          height: 100%;
          z-index: 0;
        }

        .cateringPersuasionSceneryPiece {
          transform-origin: center bottom;
          z-index: 1;
        }

        .cateringPersuasionFlower,
        .cateringPersuasionFlowerSpawned {
          position: absolute;
          z-index: 3;
        }

        .cateringPersuasionFlower {
          --flower-stem-trim: 8%;
          bottom: 0.3rem;
          width: 2.7rem;
        }

        .cateringPersuasionWildflower {
          --flower-stem-trim: 5%;
          bottom: 1.2rem;
          width: 1.55rem;
          z-index: 2;
        }

        .cateringPersuasionFlowerSpawned {
          --flower-stem-trim: 8%;
          bottom: 0.26rem;
        }

        .cateringPanelTearLine {
          background:
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.74) 12%,
              color-mix(in srgb, var(--catering-scene-charge, var(--scene-action-aura, rgba(255, 220, 124, 0.82))) 78%, white 22%) 50%,
              rgba(255, 255, 255, 0.74) 88%,
              rgba(255, 255, 255, 0) 100%
          );
          height: 0.28rem;
          opacity: 1;
          top: 0;
          transform: translate3d(0, -50%, 0);
          transform-origin: center;
          box-shadow:
            0 -0.72rem 1.85rem color-mix(in srgb, var(--catering-scene-charge, var(--scene-action-aura, rgba(255, 220, 124, 0.82))) 18%, transparent),
            0 0.72rem 1.85rem color-mix(in srgb, var(--catering-scene-charge, var(--scene-action-aura, rgba(255, 220, 124, 0.82))) 24%, transparent);
          will-change: opacity, transform;
        }

        .cateringPanelTearLine::before {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0) 0%,
            color-mix(in srgb, var(--catering-scene-charge, var(--scene-action-aura, rgba(255, 220, 124, 0.82))) 22%, rgba(255, 255, 255, 0.74)) 44%,
            rgba(255, 255, 255, 0.48) 50%,
            color-mix(in srgb, var(--catering-scene-charge, var(--scene-action-aura, rgba(255, 220, 124, 0.82))) 18%, rgba(255, 255, 255, 0.5)) 56%,
            rgba(255, 255, 255, 0) 100%
          );
          content: '';
          inset: -0.95rem 0;
          opacity: 0.58;
          position: absolute;
        }

        .cateringPanelRepaintLineHidden {
          opacity: 0;
        }

        .cateringPanelRepaintLineToPhotos {
          animation: cateringRepaintLineToPhotos
            var(--catering-tear-duration, ${bakeryPrimitiveTokens.motion.panelPaint})
            ${bakeryPrimitiveTokens.motion.easeStandard} forwards;
        }

        .cateringPanelRepaintLineToDetails {
          animation: cateringRepaintLineToDetails
            var(--catering-tear-duration, ${bakeryPrimitiveTokens.motion.panelPaint})
            ${bakeryPrimitiveTokens.motion.easeStandard} forwards;
        }

        [data-panel-transition='to-gallery'] .cateringPhotoSkeleton,
        [data-panel-transition='to-details'] .cateringPhotoSkeleton {
          animation: none;
        }

        .cateringScene-blossom .cateringPersuasionFlowerSpawned {
          bottom: 0.9rem;
          width: 4.05rem;
        }

        .cateringPhotoBoard {
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: rgba(146, 146, 146, 0.42) rgba(255, 255, 255, 0.92);
        }

        .cateringPhotoCard {
          background: #f5efe7;
          contain: layout paint style;
          content-visibility: auto;
          contain-intrinsic-size: 18rem 14rem;
          isolation: isolate;
          position: relative;
        }

        .cateringGalleryContentEntering .cateringPhotoBoard > div > * {
          animation: cateringPhotoItemEnter ${bakeryPrimitiveTokens.motion.photoEnter}
            ${bakeryPrimitiveTokens.motion.easeEnter} both;
        }

        .cateringGalleryContentEntering .cateringPhotoBoard > div > *:nth-child(2) {
          animation-delay: 50ms;
        }

        .cateringGalleryContentEntering .cateringPhotoBoard > div > *:nth-child(3) {
          animation-delay: 80ms;
        }

        .cateringGalleryContentEntering .cateringPhotoBoard > div > *:nth-child(4) {
          animation-delay: 110ms;
        }

        .cateringGalleryContentEntering .cateringPhotoBoard > div > *:nth-child(n + 5) {
          animation-delay: 110ms;
        }

        .cateringPhotoCardLoading {
          box-shadow: inset 0 0 0 1px rgba(91, 70, 37, 0.08);
        }

        .cateringPhotoImage {
          opacity: 1;
          transition: opacity ${bakeryPrimitiveTokens.motion.normal} ease;
        }

        .cateringPhotoImageLoading {
          opacity: 0;
        }

        .cateringPhotoSkeleton {
          animation: cateringPhotoSkeletonSweep 1.15s ease-in-out infinite;
          background:
            linear-gradient(
              100deg,
              rgba(246, 239, 229, 0.95) 0%,
              rgba(246, 239, 229, 0.95) 34%,
              rgba(255, 250, 244, 0.98) 48%,
              rgba(235, 226, 215, 0.95) 64%,
              rgba(235, 226, 215, 0.95) 100%
            ),
            linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.12));
          background-size:
            220% 100%,
            100% 100%;
          border-radius: inherit;
          inset: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .cateringPhotoBoard::-webkit-scrollbar {
          width: 0.78rem;
        }

        .cateringPhotoBoard::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.92);
          border-radius: 999px;
        }

        .cateringPhotoBoard::-webkit-scrollbar-thumb {
          background:
            linear-gradient(180deg, rgba(188, 188, 188, 0.9) 0%, rgba(144, 144, 144, 0.96) 100%);
          border: 3px solid rgba(255, 255, 255, 0.9);
          border-radius: 999px;
        }

        .cateringPhotoBoard::-webkit-scrollbar-thumb:hover {
          background:
            linear-gradient(180deg, rgba(170, 170, 170, 0.94) 0%, rgba(126, 126, 126, 0.98) 100%);
        }

        .cateringPhotoStartMarker {
          column-span: all;
          display: block;
          width: 100%;
        }

        .cateringPhotoStartBorder {
          max-width: min(14rem, 82%);
        }

        .cateringPhotoTopBorder {
          --grass-border-visual-height: 1.9rem;
          z-index: 3;
        }

        .cateringPhotoEndMarker {
          background:
            radial-gradient(circle at 50% 42%, rgba(248, 236, 201, 0.62), transparent 54%),
            linear-gradient(180deg, rgba(255, 251, 241, 0.98), rgba(250, 246, 233, 0.96));
          border: 1px solid rgba(91, 70, 37, 0.1);
          border-radius: 1.15rem;
          column-span: all;
          display: block;
          margin-top: 1rem;
          padding: clamp(2.8rem, 8vw, 4.5rem) clamp(1.1rem, 4vw, 1.8rem)
            clamp(2.35rem, 7vw, 3.75rem);
          width: 100%;
        }

        .cateringPhotoEndLabel {
          color: rgba(23, 58, 99, 0.64);
          font-size: clamp(0.98rem, 3.6vw, 1.36rem);
          letter-spacing: 0.24em;
          line-height: 1.1;
        }

        .cateringPhotoScrollableBorder {
          column-span: all;
          display: block;
          max-width: min(19rem, 88%);
          width: 100%;
        }

        .cateringPhotoBottomBorder {
          --grass-border-visual-height: 3.05rem;
          z-index: 3;
        }

        .cateringPixelSheep {
          bottom: 0.78rem;
          display: block;
          height: 5.2rem;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%);
          width: 7rem;
          z-index: 4;
        }

        .cateringPersuasionHeading {
          color: var(--scene-text, #143e63);
          font-weight: 520;
          text-wrap: balance;
        }

        .cateringScene-under-tree .cateringPersuasionFlower,
        .cateringScene-under-tree .cateringPersuasionWildflower,
        .cateringScene-under-tree .cateringPersuasionFlowerSpawned {
          --flower-stem-trim: 0%;
        }

        .cateringScene-under-tree .cateringPersuasionFlower,
        .cateringScene-under-tree .cateringPersuasionFlowerSpawned {
          bottom: 0.06rem;
        }

        .cateringScene-under-tree .cateringPersuasionWildflower {
          bottom: 0.96rem;
        }

        .cateringScene-moonlit .cateringPersuasionHeading,
        .cateringScene-moonlit .cateringPersuasionBody :is(p, li) {
          color: #eef6ff;
        }

        .cateringBloomMark {
          --bloom-center-size: 0.38em;
          --bloom-petal-height: 0.72em;
          --bloom-petal-offset: 0.26em;
          --bloom-petal-width: 0.66em;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          width: 1.55rem;
          min-width: 1.55rem;
          transform-origin: center bottom;
        }

        .cateringBloomFlower,
        .cateringBloomStem {
          display: block;
          flex-shrink: 0;
        }

        .cateringBloomFlower {
          height: 1.08rem;
          position: relative;
          width: 1.08rem;
          opacity: 0.96;
        }

        .cateringBloomPetal {
          background: var(--bloom-petal-a, #f0bb78);
          border-radius: 999px 999px 0.76rem 0.76rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
          height: var(--bloom-petal-height, 0.76em);
          left: 50%;
          position: absolute;
          top: 50%;
          transform:
            translate(-50%, -50%)
            rotate(calc(var(--bloom-rotation, 0deg) + var(--petal-rotation, 0deg)))
            translateY(calc(var(--bloom-petal-offset, 0.36em) * -1));
          width: var(--bloom-petal-width, 0.58em);
        }

        .cateringBloomPetal:nth-child(even) {
          background: var(--bloom-petal-b, #e47a1d);
        }

        .cateringBloomCenter {
          background: var(--bloom-center, #6f5110);
          border-radius: 999px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
          height: var(--bloom-center-size, 0.5em);
          left: 50%;
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: var(--bloom-center-size, 0.5em);
        }

        .cateringBloomStem {
          width: 2px;
          height: 0.46rem;
          margin-top: -0.06rem;
          border-radius: 999px;
          background: linear-gradient(180deg, #98a44a 0%, #536520 100%);
        }

        .tone-gold {
          --bloom-center: #6f5110;
          --bloom-petal-a: #f0bb78;
          --bloom-petal-b: #e47a1d;
        }

        .tone-sage {
          --bloom-center: #545228;
          --bloom-petal-a: #f2e7b2;
          --bloom-petal-b: #a7b066;
        }

        .tone-plum {
          --bloom-center: #4d4030;
          --bloom-petal-a: #d8bfd0;
          --bloom-petal-b: #8d6481;
        }

        .tone-rose {
          --bloom-center: #6e422f;
          --bloom-petal-a: #f5bfcb;
          --bloom-petal-b: #e27694;
        }

        .tone-sunflower {
          --bloom-center: #5d4214;
          --bloom-petal-a: #f8df67;
          --bloom-petal-b: #f6c940;
        }

        .cateringPortionInline {
          display: inline-flex;
          align-items: center;
          min-height: 2rem;
          border-radius: 999px;
          background: #d5e3f1;
          color: rgba(23, 21, 16, 0.72);
          font-size: 0.82rem;
          font-family: var(--font-rounded-display);
          font-weight: 600;
          letter-spacing: 0.08em;
          padding: 0.32rem 0.8rem;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .cateringPriceBlock {
          min-width: 6.75rem;
        }

        .cateringFlavorCard {
          background: #fff8f2;
          border: 1px solid rgba(91, 70, 37, 0.14);
          box-shadow: 0 10px 24px rgba(23, 21, 16, 0.06);
          touch-action: pan-x pinch-zoom;
          transition:
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 220ms ease,
            border-color 220ms ease;
        }

        .cateringFlavorCard button {
          cursor: pointer;
          touch-action: manipulation;
        }

        .cateringFlavorCard button:disabled {
          cursor: not-allowed;
        }

        .cateringFlavorCardActiveAdd {
          animation: cateringFlavorCardPulseAdd 260ms cubic-bezier(0.22, 1, 0.36, 1);
          border-color: rgba(126, 161, 47, 0.42);
          box-shadow: 0 16px 32px rgba(126, 161, 47, 0.16);
        }

        .cateringFlavorCardActiveRemove {
          animation: cateringFlavorCardPulseRemove 260ms cubic-bezier(0.22, 1, 0.36, 1);
          border-color: rgba(171, 90, 61, 0.32);
          box-shadow: 0 16px 32px rgba(171, 90, 61, 0.12);
        }

        .cateringMenuAccordionItem,
        .cateringMenuAccordionContent {
          overflow-anchor: none;
        }

        .cateringRowTrigger[data-state='open'] {
          color: #171510;
        }

        .cateringRowIndicator {
          align-items: center;
          color: rgba(23, 21, 16, 0.72);
          display: inline-flex;
          height: 3rem;
          justify-content: center;
          position: relative;
          width: 3rem;
          border-radius: 999px;
          border: 1px solid rgba(23, 21, 16, 0.12);
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 8px 18px rgba(23, 21, 16, 0.05);
          overflow: visible;
        }

        .cateringRowChevron {
          align-items: center;
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid rgba(23, 21, 16, 0.12);
          border-radius: 999px;
          box-shadow: 0 8px 18px rgba(23, 21, 16, 0.05);
          color: rgba(23, 21, 16, 0.72);
          display: inline-flex;
          height: 3rem;
          justify-content: center;
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease,
            transform 200ms ease;
          width: 3rem;
        }

        .cateringRowChevronIcon {
          height: 1.1rem;
          transition: transform 220ms ease;
          width: 1.1rem;
        }

        .cateringRowTrigger[data-state='open'] .cateringRowChevronIcon {
          transform: rotate(180deg);
        }

        .cateringRowTrigger:hover .cateringRowIndicator,
        .cateringRowTrigger:focus-visible .cateringRowIndicator,
        .cateringRowTrigger[data-state='open'] .cateringRowIndicator,
        .cateringRowTrigger:hover .cateringRowChevron,
        .cateringRowTrigger:focus-visible .cateringRowChevron,
        .cateringRowTrigger[data-state='open'] .cateringRowChevron {
          background: #17341f;
          border-color: #17341f;
          color: #f7f5ef;
        }

        .cateringRowIndicatorSpinner {
          animation: cateringRowSpinner 1s linear infinite;
          height: 1.06rem;
          width: 1.06rem;
        }

        .cateringRowIndicatorFlowerWrap {
          bottom: calc(100% - 0.18rem);
          height: 2rem;
          left: 50%;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%);
          width: 2rem;
        }

        .cateringRowIndicatorFlower {
          animation: cateringRowFlowerBob 2.4s ease-in-out infinite;
          display: block;
          height: 100%;
          width: 100%;
        }

        .cateringFlavorCloud {
          animation: cateringFlavorCloudDrift 9.8s ease-in-out infinite;
          filter: drop-shadow(0 6px 10px rgba(255, 255, 255, 0.28));
        }

        .cateringFlavorStep {
          align-items: center;
          background: rgba(28, 46, 16, 0.06);
          border: 1px solid rgba(28, 46, 16, 0.12);
          border-radius: 999px;
          color: #1c2e10;
          display: inline-flex;
          height: 1.45rem;
          justify-content: center;
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease;
          width: 1.45rem;
        }

        .cateringFlavorStep:hover,
        .cateringFlavorStep:focus-visible {
          background: #1c2e10;
          border-color: #1c2e10;
          color: white;
          transform: translateY(-1px);
        }

        .cateringFlavorStep:disabled {
          cursor: not-allowed;
          opacity: 0.38;
          transform: none;
        }

        .cateringFlavorStepActive {
          background: #1c2e10;
          border-color: #1c2e10;
          color: white;
          transform: translateY(-1px) scale(1.04);
        }

        .cateringFlavorCount {
          transition:
            color 180ms ease,
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .cateringFlavorCountActive {
          color: #1c2e10;
          transform: scale(1.16);
        }

        .cateringFlavorRail {
          overflow-x: auto;
          overflow-y: visible;
          padding-bottom: 0.6rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(23, 21, 16, 0.26) transparent;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          touch-action: pan-x pinch-zoom;
          scroll-snap-type: x proximity;
        }

        .cateringFlavorRailInner {
          transform: translateX(var(--catering-edge-offset, 0)) scaleX(var(--catering-edge-scale, 1));
          transform-origin: center center;
          transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }

        .cateringFlavorRail[data-edge-stretch-side='left'] {
          --catering-edge-offset: calc(var(--catering-edge-stretch, 0px) * 0.72);
          --catering-edge-scale: calc(1 + (var(--catering-edge-stretch, 0px) / 900));
        }

        .cateringFlavorRail[data-edge-stretch-side='right'] {
          --catering-edge-offset: calc(var(--catering-edge-stretch, 0px) * -0.72);
          --catering-edge-scale: calc(1 + (var(--catering-edge-stretch, 0px) / 900));
        }

        .cateringFlavorRail[data-edge-stretch-side='left'] .cateringFlavorRailItem:first-child .cateringFlavorCard,
        .cateringFlavorRail[data-edge-stretch-side='right'] .cateringFlavorRailItem:last-child .cateringFlavorCard {
          transform: scaleX(calc(1 + (var(--catering-edge-stretch, 0px) / 240))) translateY(-1px);
        }

        .cateringFlavorRail::-webkit-scrollbar {
          height: 0.45rem;
        }

        .cateringFlavorRail::-webkit-scrollbar-thumb {
          background: rgba(23, 21, 16, 0.18);
          border-radius: 999px;
        }

        .cateringFlavorRail::-webkit-scrollbar-track {
          background: transparent;
        }

        .cateringFlavorRailInner {
          display: flex;
          gap: 1rem;
          padding-bottom: 0.2rem;
          width: max-content;
        }

        .cateringFlavorRailItem {
          flex: 0 0 min(86vw, 20.75rem);
          scroll-snap-align: start;
        }

        .cateringTraySummaryPulse {
          animation: cateringTraySummaryPulse 260ms cubic-bezier(0.22, 1, 0.36, 1);
          border-color: rgba(126, 161, 47, 0.24);
          box-shadow: 0 14px 28px rgba(126, 161, 47, 0.08);
        }

        .cookieSheepBodyImage {
          transform: scale(1.04);
          transform-origin: center center;
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }

        .cateringFlavorCard:hover .cookieSheepBodyImage,
        .cateringFlavorCard:focus-within .cookieSheepBodyImage {
          transform: scale(1.18);
        }

        .cookieSheepBurstPart {
          opacity: 1;
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          transition:
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 260ms ease-out;
          will-change: transform, opacity;
        }

        .cateringFlavorCard:hover .cookieSheepBurstPart,
        .cateringFlavorCard:focus-within .cookieSheepBurstPart {
          opacity: 0;
          transform: translate3d(var(--sheep-burst-x, 0), var(--sheep-burst-y, 0), 0)
            rotate(var(--sheep-burst-rotate, 0deg))
            scale(var(--sheep-burst-scale, 0.72));
        }

        @keyframes cateringGardenStemGrow {
          0%,
          100% {
            height: var(--garden-stem-min, 0.9rem);
          }

          50% {
            height: var(--garden-stem-max, 1.4rem);
          }
        }

        @keyframes cateringFlavorCardPulseAdd {
          0% {
            transform: scale(1);
          }

          45% {
            transform: translateY(-2px) scale(1.015);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes selectedGrassDotIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.2);
          }

          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        @keyframes selectedGrassLineGrow {
          0% {
            opacity: 0;
            transform: scaleX(0);
          }

          100% {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        @keyframes selectedGrassBladeGrow {
          0% {
            opacity: 0;
            transform: scaleY(0);
            transform-origin: bottom center;
          }

          100% {
            opacity: 1;
            transform: scaleY(1);
            transform-origin: bottom center;
          }
        }

        @keyframes cateringFlavorCardPulseRemove {
          0% {
            transform: scale(1);
          }

          45% {
            transform: translateY(1px) scale(0.992);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes cateringRowSpinner {
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes cateringRowFlowerBob {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-0.14rem);
          }
        }

        @keyframes cateringTraySummaryPulse {
          0% {
            transform: scale(1);
          }

          45% {
            transform: translateY(-1px) scale(1.008);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes cateringPhotoSkeletonSweep {
          0% {
            background-position:
              120% 0,
              0 0;
          }

          100% {
            background-position:
              -120% 0,
              0 0;
          }
        }

        @keyframes cateringPanelContentEnter {
          0% {
            opacity: 0;
            transform: translate3d(0, 0.28rem, 0) scale(0.996);
          }

          58% {
            opacity: 1;
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes cateringPhotoItemEnter {
          0% {
            opacity: 0;
            transform: translate3d(0, 0.38rem, 0) scale(0.992);
          }

          65% {
            opacity: 1;
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes cateringPaintRevealDown {
          0% {
            clip-path: inset(0 0 100% 0 round 1.45rem);
          }

          100% {
            clip-path: inset(0 0 0 0 round 1.45rem);
          }
        }

        @keyframes cateringPaintRevealUp {
          0% {
            clip-path: inset(100% 0 0 0 round 1.45rem);
          }

          100% {
            clip-path: inset(0 0 0 0 round 1.45rem);
          }
        }

        @keyframes cateringRepaintLineToPhotos {
          0% {
            opacity: 0.68;
            transform: translate3d(0, -50%, 0) scaleY(0.72);
          }

          16% {
            opacity: 0.96;
          }

          82% {
            opacity: 0.94;
          }

          100% {
            opacity: 0.74;
            transform: translate3d(
              0,
              var(--catering-panel-transition-distance, var(--scene-panel-min-height, 34rem)),
              0
            )
              scaleY(0.86);
          }
        }

        @keyframes cateringRepaintLineToDetails {
          0% {
            opacity: 0.74;
            transform: translate3d(
              0,
              var(--catering-panel-transition-distance, var(--scene-panel-min-height, 34rem)),
              0
            )
              scaleY(0.86);
          }

          18% {
            opacity: 0.96;
          }

          84% {
            opacity: 0.94;
          }

          100% {
            opacity: 0.68;
            transform: translate3d(0, -50%, 0) scaleY(0.72);
          }
        }

        @keyframes cateringFlavorCloudDrift {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0.9rem, -0.32rem, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cateringPanelForeground,
          .cateringGalleryContent,
          .cateringPhotoImage {
            transition-duration: 1ms !important;
          }

          .cateringPanelLayerPaintInFromTop,
          .cateringPanelLayerPaintInFromBottom,
          .cateringPanelRepaintLineToPhotos,
          .cateringPanelRepaintLineToDetails,
          .cateringPanelForegroundEntering,
          .cateringGalleryContentEntering,
          .cateringGalleryContentEntering .cateringPhotoBoard > div > * {
            animation-delay: 0ms !important;
            animation-duration: 1ms !important;
          }
        }

        @media (min-width: 960px) {
          .cateringFlavorRailItem {
            flex-basis: 20.75rem;
          }
        }

        @media (max-width: 767px) {
          .cateringPriceBlock {
            min-width: 0;
          }

          .cateringScene-blossom .cateringPersuasionSky img {
            object-position: 16% center;
          }

          .cateringScene-fairy-castle .cateringPersuasionSky {
            left: -8%;
            right: auto;
            width: 116%;
          }

          .cateringScene-fairy-castle .cateringPersuasionSky img {
            object-position: center top;
          }

          .cateringScene-moonlit .cateringPersuasionSky img {
            object-position: 28% top;
          }

          .cateringPersuasionFrame {
            --catering-persuasion-panel-min-height: 37rem;
          }

          .cateringPersuasionFrame[data-has-gallery='true'] {
            --catering-persuasion-panel-min-height: 39rem;
          }

          .cateringPersuasionPanel {
            padding-inline: 1rem;
          }

          .cateringPanelForeground {
            padding-bottom: 10.8rem;
          }

          .cateringPanelActionRow {
            display: grid !important;
            gap: 0.5rem;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: 100%;
            width: 100%;
          }

          .cateringPanelActionRow .cateringActionButtonWrap {
            display: flex;
            flex: none;
            min-width: 0;
            width: 100%;
          }

          .cateringPanelActionRow .cateringActionButtonWrap > .cateringSpawnButton {
            font-size: clamp(0.72rem, 3vw, 0.8rem);
            letter-spacing: 0;
            min-height: 2.5rem;
            padding-inline: 0.54rem;
            white-space: nowrap;
            width: 100%;
          }

          .cateringPanelActionRow .cateringPhotosButton {
            gap: 0.32rem;
            padding: 0.48rem 0.54rem 0.5rem;
          }

          .cateringPanelActionRow .cateringPhotosButtonIcon {
            height: 1.08rem;
            transform: translateY(-0.16rem);
            width: 1.34rem;
          }

          .cateringPersuasionFlower {
            width: 2.05rem;
          }

          .cateringScene-blossom .cateringPersuasionFlowerSpawned {
            bottom: 0.74rem;
            width: 3.5rem;
          }

          .cateringPersuasionWildflower {
            width: 1.28rem;
          }

          .cateringScene-moonlit .cateringPersuasionFlower {
            width: 2.34rem;
          }

          .cateringScene-moonlit .cateringPersuasionWildflower {
            width: 1.42rem;
          }

          .cateringPixelSheep {
            height: 4.45rem;
            width: 6rem;
          }

          .cateringRowTrigger > svg {
            height: 2.8rem;
            margin-top: 0.1rem;
            width: 2.8rem;
          }

          .cateringFlavorRail {
            padding-bottom: 0.85rem;
          }

          .cateringFlavorRailItem {
            flex-basis: min(90vw, 19rem);
          }

          .cateringPortionInline {
            font-size: 0.76rem;
          }
        }

        @media (max-width: 430px) {
          .cateringPersuasionFrame {
            --catering-persuasion-panel-min-height: 38.25rem;
          }

          .cateringPersuasionFrame[data-has-gallery='true'] {
            --catering-persuasion-panel-min-height: 40.25rem;
          }

          .cateringPersuasionHeading {
            font-size: clamp(1.5rem, 6.2vw, 1.82rem);
            letter-spacing: 0;
            line-height: 1.04;
          }

          .cateringPersuasionBody :is(p, li) {
            font-size: 0.9rem;
            line-height: 1.62;
          }

          .cateringPanelForeground {
            padding-bottom: 11rem;
          }
        }
      `}</style>
    </div>
  )
}
