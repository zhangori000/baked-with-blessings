'use client'

import { Price } from '@/components/Price'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { Product } from '@/payload-types'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React, { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  BatchBuilderPanel,
  SimpleItemPanel,
} from './catering-menu-panels'
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
} from './catering-menu-scenery'
import type { MenuSceneryTone, SelectableFlavor } from './catering-menu-types'
import { buildCookiePosterAsset } from './cookiePosterData'

type CateringMenuSectionProps = {
  products: Partial<Product>[]
}

type SceneryPickerAnchor = 'hero' | 'panel'

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
        bodyFallbackSrc: posterAsset?.bodyFallbackSrc ?? '/cookie-singular-brookie.svg',
        id: selectableProduct.id,
        image: posterAsset?.image ?? normalizeImage(selectableProduct),
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
  const flavorInteractionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedCounts, setSelectedCounts] = useState<Record<number, number>>({})
  const [isSubmittingToCart, setIsSubmittingToCart] = useState(false)
  const [recentFlavorInteraction, setRecentFlavorInteraction] = useState<{
    action: 'add' | 'remove'
    flavorID: number
  } | null>(null)
  const [shouldPulseTraySummary, setShouldPulseTraySummary] = useState(false)
  const image = normalizeImage(product)
  const summary = resolveSummary(product)
  const isBatchBuilder = product.menuBehavior === 'batchBuilder'
  const requiredSelectionCount =
    isBatchBuilder && typeof product.requiredSelectionCount === 'number'
      ? product.requiredSelectionCount
      : 0
  const selectableFlavors = useMemo(() => buildSelectableFlavors(product), [product])

  const totalSelected = useMemo(
    () => Object.values(selectedCounts).reduce((sum, count) => sum + count, 0),
    [selectedCounts],
  )

  const traySelectionsForSummary = useMemo(
    () =>
      selectableFlavors
        .map((flavor) => ({
          product: {
            id: flavor.id,
            title: flavor.title,
          } as Product,
          quantity: selectedCounts[flavor.id] ?? 0,
        }))
        .filter((selection) => selection.quantity > 0),
    [selectableFlavors, selectedCounts],
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

  useEffect(() => {
    return () => {
      if (flavorInteractionTimeoutRef.current) {
        clearTimeout(flavorInteractionTimeoutRef.current)
      }
    }
  }, [])

  const registerFlavorInteraction = (flavorID: number, action: 'add' | 'remove') => {
    setRecentFlavorInteraction({ action, flavorID })
    setShouldPulseTraySummary(true)

    if (flavorInteractionTimeoutRef.current) {
      clearTimeout(flavorInteractionTimeoutRef.current)
    }

    flavorInteractionTimeoutRef.current = setTimeout(() => {
      setRecentFlavorInteraction(null)
      setShouldPulseTraySummary(false)
    }, 260)
  }

  const handleAddFlavor = (flavorID: number) => {
    registerFlavorInteraction(flavorID, 'add')
    setSelectedCounts((current) => {
      const currentTotal = Object.values(current).reduce((sum, count) => sum + count, 0)

      if (requiredSelectionCount > 0 && currentTotal >= requiredSelectionCount) {
        return current
      }

      return {
        ...current,
        [flavorID]: (current[flavorID] ?? 0) + 1,
      }
    })
  }

  const handleRemoveFlavor = (flavorID: number) => {
    if ((selectedCounts[flavorID] ?? 0) > 0) {
      registerFlavorInteraction(flavorID, 'remove')
    }

    setSelectedCounts((current) => {
      const currentCount = current[flavorID] ?? 0

      if (currentCount <= 0) {
        return current
      }

      if (currentCount <= 1) {
        const { [flavorID]: _removed, ...rest } = current
        return rest
      }

      return {
        ...current,
        [flavorID]: currentCount - 1,
      }
    })
  }

  const isCartPending = isLoading || isSubmittingToCart

  const handleAddToCart = async () => {
    if (!product.id || isCartPending) {
      return
    }

    if (isBatchBuilder) {
      if (
        requiredSelectionCount <= 0 ||
        totalSelected !== requiredSelectionCount ||
        traySelectionsForCart.length === 0
      ) {
        toast.info(`Choose exactly ${requiredSelectionCount} cookies before adding this tray.`)
        return
      }

      setIsSubmittingToCart(true)

      try {
        await addItem({
          batchSelections: traySelectionsForCart,
          product: product.id,
        } as Parameters<typeof addItem>[0])
        toast.success(`${product.title ?? 'Tray'} added to cart.`)
        setSelectedCounts({})
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
      className="border-b border-[rgba(23,21,16,0.14)]"
      value={product.slug ?? `row-${index}`}
    >
      <AccordionTrigger className="cateringRowTrigger gap-6 py-8 text-left hover:no-underline md:py-10">
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

      <AccordionContent className="pt-1 pb-9">
        {isBatchBuilder ? (
          <BatchBuilderPanel
            flavorCardCloudsForScenery={flavorCardCloudsForScenery}
            flavorCardMeadowForScenery={flavorCardMeadowForScenery}
            flavorCardMobileSkyForScenery={flavorCardMobileSkyForScenery}
            flavorCardSkyForScenery={flavorCardSkyForScenery}
            isTrayPending={isCartPending}
            onAddFlavor={handleAddFlavor}
            onAddToCart={handleAddToCart}
            onRemoveFlavor={handleRemoveFlavor}
            persuasionPanel={
              <PersuasionGardenPanel
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
            recentFlavorInteraction={recentFlavorInteraction}
            renderSceneImage={(props) => <DecorativeSceneImage {...props} />}
            shouldPulseTraySummary={shouldPulseTraySummary}
            priceInUSD={product.priceInUSD}
            sceneryTone={sceneryTone}
            requiredSelectionCount={requiredSelectionCount}
            selectableFlavors={selectableFlavors}
            selectedCounts={selectedCounts}
            totalSelected={totalSelected}
            traySelectionsForSummary={traySelectionsForSummary}
          />
        ) : (
          <SimpleItemPanel
            image={image}
            isCartPending={isCartPending}
            onAddToCart={handleAddToCart}
            priceInUSD={product.priceInUSD}
            product={product}
            resolveSummary={resolveSummary}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export function CateringMenuSection({ products }: CateringMenuSectionProps) {
  const orderedProducts = useMemo(() => sortProductsForDisplay(products), [products])
  const [heroSceneryTone, setHeroSceneryTone] = usePersistentMenuSceneTone('classic')
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
            <Accordion
              collapsible
              type="single"
            >
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
        .cateringMenuHeroDisplay {
          font-family: var(--font-catering-serif), 'Iowan Old Style', 'Palatino Linotype', serif;
          font-weight: 800;
          text-shadow: 0 10px 24px rgba(17, 44, 75, 0.08);
        }

        .cateringMenuRoundHeading {
          font-family: var(--font-rounded-display);
          font-weight: 700;
        }

        .cateringMenuEyebrow {
          color: rgba(25, 57, 95, 0.76);
          font-size: 0.72rem;
          font-family: var(--font-rounded-display);
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .cateringHeroEyebrow {
          color: rgba(25, 57, 95, 0.78);
        }

        .cateringHeroSummary {
          color: rgba(25, 57, 95, 0.9);
          font-family: var(--font-rounded-display);
          font-weight: 700;
          letter-spacing: -0.015em;
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
          color: #27496b;
          font-weight: 650;
        }

        .cateringMenuExperience {
          --catering-header-underlap: 7.6rem;
          position: relative;
          isolation: isolate;
          margin-top: calc(var(--catering-header-underlap) * -1);
        }

        .cateringHeroBand {
          --catering-hero-meadow-height: clamp(6.75rem, 12vh, 8.75rem);
          background: transparent;
          box-sizing: border-box;
          min-height: 100svh;
          overflow: hidden;
          position: relative;
        }

        .cateringHeroBackdrop {
          inset: 0;
          position: absolute;
          z-index: 0;
        }

        .cateringHeroContent {
          align-items: flex-start;
          box-sizing: border-box;
          display: flex;
          min-height: 100svh;
          padding-bottom: calc(var(--catering-hero-meadow-height) + clamp(1rem, 2.6vw, 1.8rem));
          padding-top: calc(var(--catering-header-underlap) + clamp(1rem, 2.7vw, 1.8rem));
        }

        .cateringMenuBand {
          background: #fff8f2;
          margin-top: -1px;
        }

        .cateringMenuPanel {
          padding: 0;
        }

        .cateringSceneSky,
        .cateringSceneMeadow,
        .cateringHeroSceneryPiece,
        .cateringPersuasionSceneryPiece {
          pointer-events: none;
          position: absolute;
        }

        .cateringDecorativeImage {
          display: block;
          overflow: visible;
          position: absolute;
        }

        .cateringSceneSky {
          height: 100%;
          inset: 0;
          object-fit: cover;
          width: 100%;
        }

        .cateringSceneMeadow {
          left: 0;
          object-fit: cover;
          object-position: center bottom;
          width: 100%;
        }

        .cateringHeroSky {
          top: 0;
        }

        .cateringHeroMeadow {
          bottom: -0.2rem;
          height: var(--catering-hero-meadow-height);
        }

        .cateringHeroSceneryPiece {
          transform-origin: center bottom;
          z-index: 1;
        }

        .cateringHeroFlowerRail {
          bottom: var(--catering-hero-flower-seam, 0.5rem);
          height: 0;
          inset-inline: 0;
          overflow: visible;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .cateringHeroLineFlower {
          --flower-stem-trim: 10%;
          bottom: 0;
          width: 2.18rem;
          z-index: 2;
        }

        .cateringHeroLineWildflower {
          --flower-stem-trim: 6%;
          bottom: 0;
          width: 1.34rem;
          z-index: 1;
        }

        .cateringFlowerSprite {
          display: inline-flex;
          overflow: hidden;
          pointer-events: none;
          position: absolute;
          transform-origin: center bottom;
          z-index: 5;
        }

        .cateringLivingFlower {
          animation: cateringFlowerLife var(--flower-duration, 4.6s) ease-in-out infinite;
          animation-delay: var(--flower-delay, 0s);
          transform:
            translateX(-50%)
            translateY(0)
            rotate(calc(var(--flower-tilt, 2deg) * -1))
            scale(var(--flower-scale, 1));
          will-change: transform;
        }

        .cateringFlowerSpriteImage {
          display: block;
          height: auto;
          transform: translateY(var(--flower-stem-trim, 0%));
          transform-origin: center bottom;
          width: 100%;
        }

        .cateringHeroLineFlowerSpawned .cateringFlowerSpriteImage,
        .cateringPersuasionFlowerSpawned .cateringFlowerSpriteImage {
          animation: cateringSpriteGrow 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .cateringPersuasionPanel {
          background: var(
            --catering-panel-fill,
            linear-gradient(180deg, rgba(223, 239, 255, 0.92) 0%, rgba(216, 233, 246, 0.94) 100%)
          );
          isolation: isolate;
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

        .cateringHeroCloud {
          animation: cateringCloudBob 9.6s ease-in-out infinite;
          opacity: 0.95;
          position: absolute;
          z-index: 1;
        }

        .cateringSpawnButton {
          align-items: center;
          background:
            linear-gradient(
              90deg,
              color-mix(in srgb, var(--catering-scene-charge, rgba(255, 220, 124, 0.82)) 68%, white 32%) 0%,
              color-mix(in srgb, var(--catering-scene-charge, rgba(255, 220, 124, 0.82)) 82%, white 18%) 100%
            )
            no-repeat,
            rgba(255, 248, 242, 0.84);
          background-size:
            0% 100%,
            100% 100%;
          border: 1px solid rgba(25, 57, 95, 0.16);
          border-radius: 999px;
          color: #173a63;
          cursor: pointer;
          display: inline-flex;
          font-family: var(--font-rounded-display);
          font-size: 0.86rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          min-height: 2.25rem;
          overflow: hidden;
          padding: 0.45rem 0.95rem;
          position: relative;
          transition:
            background-size 220ms ease,
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 2;
        }

        .cateringSpawnButton::before {
          content: '';
          inset: 0;
          opacity: 0;
          pointer-events: none;
          position: absolute;
          background:
            linear-gradient(
              90deg,
              transparent 0%,
              color-mix(in srgb, var(--catering-scene-charge, rgba(255, 220, 124, 0.82)) 28%, white 72%) 52%,
              transparent 100%
            );
          border-radius: inherit;
          transition: opacity 140ms ease;
          z-index: 0;
        }

        .cateringSpawnButton:hover,
        .cateringSpawnButton:focus-visible {
          background: #fff8f2;
          border-color: rgba(25, 57, 95, 0.26);
          transform: translateY(-1px);
        }

        .cateringSpawnButtonCharging {
          border-color: rgba(25, 57, 95, 0.24);
          box-shadow: 0 10px 22px color-mix(in srgb, var(--catering-scene-charge, rgba(255, 220, 124, 0.82)) 38%, transparent);
        }

        .cateringActionButtonWrap {
          position: relative;
          display: inline-flex;
          overflow: visible;
        }

        .cateringSceneryChooser {
          width: min(calc(100vw - 0.9rem), 64rem);
          max-width: none;
          margin-top: 2rem;
        }

        .cateringSceneryChooserBubble {
          position: relative;
          overflow: visible;
          border-radius: 1.45rem;
          background: #ffffff;
          box-shadow: 0 18px 38px rgba(23, 21, 16, 0.12);
          padding: 0.72rem 0.48rem 0.54rem;
        }

        .cateringSceneryChooserTail {
          position: absolute;
          left: 8rem;
          top: -1.28rem;
          width: 0;
          height: 0;
          border-left: 1.35rem solid transparent;
          border-right: 1.35rem solid transparent;
          border-bottom: 1.34rem solid #ffffff;
          filter: none;
        }

        .cateringSceneryChooserRail {
          display: flex;
          gap: 0.7rem;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0.08rem 0.08rem 0.02rem;
          scrollbar-gutter: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          border-radius: 1.08rem;
        }

        .cateringSceneryChooserRail::-webkit-scrollbar {
          display: none;
          height: 0;
        }

        .cateringSceneryChoice {
          display: flex;
          flex: 0 0 13.2rem;
          min-height: 4.3rem;
          flex-direction: column;
          justify-content: center;
          gap: 0.12rem;
          border-radius: 1.1rem;
          border: 2px solid rgba(18, 18, 18, 0.12);
          background: #ffffff;
          padding: 0.85rem 1rem;
          text-align: left;
          margin: 0.06rem 0;
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease;
        }

        .cateringSceneryChoice:hover,
        .cateringSceneryChoice:focus-visible {
          transform: translateY(-1px);
          border-color: rgba(18, 18, 18, 0.32);
          box-shadow: 0 10px 24px rgba(23, 21, 16, 0.08);
        }

        .cateringSceneryChoice:disabled {
          cursor: default;
        }

        .cateringSceneryChoiceActive {
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--catering-scene-charge, rgba(255, 220, 124, 0.82)) 22%, white 78%) 0%,
              #ffffff 100%
            );
          border-color: rgba(18, 18, 18, 0.35);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
        }

        .cateringSceneryChoiceLabel {
          color: #173a63;
          font-family: var(--font-rounded-display);
          font-size: 0.98rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .cateringSceneryChoiceMeta {
          color: rgba(23, 58, 99, 0.62);
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
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

        .cateringPhotoBoard {
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: rgba(146, 146, 146, 0.42) rgba(255, 255, 255, 0.92);
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
          color: #143e63;
          font-weight: 520;
          text-wrap: balance;
        }

        .cateringScene-moonlit .cateringMenuHeroDisplay,
        .cateringScene-moonlit .cateringHeroSummary,
        .cateringScene-moonlit .cateringHeroEyebrow {
          color: #eef6ff;
          text-shadow: 0 12px 22px rgba(5, 10, 28, 0.24);
        }

        .cateringScene-under-tree .cateringHeroLineFlower,
        .cateringScene-under-tree .cateringHeroLineWildflower,
        .cateringScene-under-tree .cateringPersuasionFlower,
        .cateringScene-under-tree .cateringPersuasionWildflower,
        .cateringScene-under-tree .cateringPersuasionFlowerSpawned {
          --flower-stem-trim: 0%;
        }

        .cateringScene-under-tree .cateringHeroLineFlower,
        .cateringScene-under-tree .cateringHeroLineWildflower,
        .cateringScene-under-tree .cateringHeroLineFlowerSpawned {
          bottom: 0.08rem;
          overflow: visible;
        }

        .cateringScene-under-tree .cateringHeroLineFlower {
          width: 2rem;
        }

        .cateringScene-under-tree .cateringHeroLineWildflower {
          width: 1.24rem;
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
          touch-action: manipulation;
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

        .cateringRowTrigger[data-state='open'] {
          color: #171510;
        }

        .cateringRowTrigger > svg {
          align-self: flex-start;
          color: rgba(23, 21, 16, 0.72);
          height: 3rem;
          margin-top: 0.25rem;
          padding: 0.72rem;
          width: 3rem;
          border-radius: 999px;
          border: 1px solid rgba(23, 21, 16, 0.12);
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 8px 18px rgba(23, 21, 16, 0.05);
        }

        .cateringRowTrigger:hover > svg,
        .cateringRowTrigger:focus-visible > svg,
        .cateringRowTrigger[data-state='open'] > svg {
          background: #17341f;
          border-color: #17341f;
          color: #f7f5ef;
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

        .cateringProgressBloom {
          animation: cateringProgressBloomGrow 760ms cubic-bezier(0.22, 1, 0.36, 1) both,
            cateringProgressBloomBob 3.2s ease-in-out 760ms infinite;
          bottom: -0.02rem;
          height: 2.6rem;
          opacity: 1;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%);
          transform-origin: center bottom;
          width: 2.6rem;
          z-index: 2;
        }

        .cateringProgressBloomImage {
          display: block;
          height: 100%;
          object-fit: contain;
          object-position: center bottom;
          width: 100%;
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

        @keyframes cateringProgressBloomGrow {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(0.35rem) scale(0.38);
          }

          72% {
            opacity: 1;
            transform: translateX(-50%) translateY(-0.08rem) scale(1.06);
          }

          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes cateringProgressBloomBob {
          0%,
          100% {
            transform: translateX(-50%) translateY(0) rotate(-2deg) scale(1);
          }

          50% {
            transform: translateX(-50%) translateY(-0.16rem) rotate(2deg) scale(1.02);
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

        @keyframes cateringCloudBob {
          0% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -0.38rem, 0);
          }

          100% {
            transform: translate3d(0, 0, 0);
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

        @keyframes cateringFlowerLife {
          0%,
          100% {
            transform:
              translateX(-50%)
              translateY(0)
              rotate(calc(var(--flower-tilt, 2deg) * -1))
              scale(var(--flower-scale, 1));
          }

          50% {
            transform:
              translateX(-50%)
              translateY(calc(var(--flower-bob, 0.14rem) * -1))
              rotate(var(--flower-tilt, 2deg))
              scale(var(--flower-scale, 1));
          }
        }

        @keyframes cateringSpriteGrow {
          0% {
            opacity: 0;
            transform: scale(0.28);
          }

          72% {
            opacity: 1;
            transform: scale(1.08);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (min-width: 960px) {
          .cateringFlavorRailItem {
            flex-basis: 20.75rem;
          }
        }

        @media (max-width: 767px) {
          .cateringSceneryChooser {
            width: min(calc(100vw - 1rem), 36rem);
          }

          .cateringSceneryChooserBubble {
            padding: 0.56rem 0.38rem 0.44rem;
          }

          .cateringSceneryChooserRail {
            gap: 0.6rem;
            padding: 0.06rem 0.04rem 0.02rem;
          }

          .cateringSceneryChoice {
            margin: 0;
          }

          .cateringSceneryChooserTail {
            top: -0.98rem;
            border-left-width: 1.1rem;
            border-right-width: 1.1rem;
            border-bottom-width: 1.08rem;
          }

          .cateringSceneryChooserRail::-webkit-scrollbar {
            height: 0;
          }

          .cateringSceneryChooserRail::-webkit-scrollbar-track {
            margin-inline: 0;
          }

          .cateringMenuExperience {
            --catering-header-underlap: 7.2rem;
          }

          .cateringPriceBlock {
            min-width: 0;
          }

          .cateringHeroBand {
            --catering-hero-meadow-height: 6.4rem;
          }

          .cateringHeroMeadow {
            height: var(--catering-hero-meadow-height);
          }

          .cateringScene-blossom .cateringHeroSky img,
          .cateringScene-blossom .cateringPersuasionSky img {
            object-position: 16% center;
          }

          .cateringScene-fairy-castle .cateringHeroSky,
          .cateringScene-fairy-castle .cateringPersuasionSky {
            left: -8%;
            right: auto;
            width: 116%;
          }

          .cateringScene-fairy-castle .cateringHeroSky img,
          .cateringScene-fairy-castle .cateringPersuasionSky img {
            object-position: center top;
          }

          .cateringScene-moonlit .cateringHeroSky img,
          .cateringScene-moonlit .cateringPersuasionSky img {
            object-position: 28% top;
          }

          .cateringHeroLineFlower {
            width: 1.74rem;
          }

          .cateringHeroLineWildflower {
            width: 1.12rem;
          }

          .cateringPersuasionPanel {
            padding-inline: 1rem;
          }

          .cateringPersuasionFlower {
            width: 2.05rem;
          }

          .cateringPersuasionWildflower {
            width: 1.28rem;
          }

          .cateringScene-moonlit .cateringHeroLineFlower {
            width: 2.08rem;
          }

          .cateringScene-moonlit .cateringHeroLineWildflower {
            width: 1.32rem;
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
      `}</style>
    </div>
  )
}
