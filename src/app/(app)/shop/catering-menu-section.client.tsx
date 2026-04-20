'use client'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { RichText } from '@/components/RichText'
import { TraySelectionSummary } from '@/components/TraySelectionSummary'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { Media as MediaType, Product } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Minus, Plus } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { buildCookiePosterAsset } from './cookiePosterData'
import { CookieSheepRig } from './cookie-sheep-rig'

type CateringMenuSectionProps = {
  products: Partial<Product>[]
}

type BloomTone = 'gold' | 'plum' | 'rose' | 'sage' | 'sunflower'

type SelectableFlavor = {
  bodyFallbackSrc: string
  id: number
  image: MediaType | null
  summary: string
  title: string
}

type SpawnedCloud = {
  id: number
  left: string
  src: string
  top: string
  width: string
}

type SpawnedFlower = {
  id: number
  left: string
  scale: number
  tone: BloomTone
  variant: BloomVariant
}

type BloomVariant = {
  centerSize: number
  petalCount: number
  petalHeight: number
  petalOffset: number
  petalWidth: number
  rotation: number
}

const cateringDisplayOrder = [
  'cookie-tray',
  'mini-cookie-tray',
  'banana-pudding-10-pack',
  'sticky-toffee-pudding-10-pack',
  'focaccia-tray',
] as const

const bloomTones: BloomTone[] = ['gold', 'sage', 'plum', 'rose']
const progressBloomTones: BloomTone[] = ['gold', 'sage', 'plum', 'rose', 'gold', 'sunflower']
const randomFlowerTones: BloomTone[] = ['gold', 'sage', 'plum', 'rose', 'sunflower']
const cloudSpawnDesigns = [
  { maxWidth: 14.5, minWidth: 10.8, src: '/clouds/three-ball-cloud-jumbo.svg' },
  { maxWidth: 12.2, minWidth: 9.2, src: '/clouds/three-ball-cloud-loft.svg' },
  { maxWidth: 20.5, minWidth: 15.5, src: '/clouds/three-ball-cloud-long.svg' },
] as const
const bloomVariantPresets: BloomVariant[] = [
  { centerSize: 0.38, petalCount: 4, petalHeight: 0.72, petalOffset: 0.26, petalWidth: 0.66, rotation: 0 },
  { centerSize: 0.4, petalCount: 4, petalHeight: 0.78, petalOffset: 0.29, petalWidth: 0.58, rotation: 14 },
  { centerSize: 0.36, petalCount: 5, petalHeight: 0.7, petalOffset: 0.28, petalWidth: 0.46, rotation: 8 },
  { centerSize: 0.38, petalCount: 4, petalHeight: 0.68, petalOffset: 0.26, petalWidth: 0.54, rotation: -10 },
  { centerSize: 0.52, petalCount: 8, petalHeight: 0.64, petalOffset: 0.34, petalWidth: 0.3, rotation: 0 },
] as const
const cookieTrayPersuasionCopy = [
  'We love Crumbl cookies. But sometimes they are too sweet. These cookies are less sweet than Crumbl.',
  'The normal size cookies are quite thick, so they are good value. But if you want smaller cookies, go buy the mini cookies.',
] as const
const maxSpawnedFlowers = 14

const persuasionGardenFlowers = [
  { left: '8%', tone: 'gold' as const },
  { left: '23%', tone: 'sage' as const },
  { left: '41%', tone: 'rose' as const },
  { left: '58%', tone: 'gold' as const },
  { left: '74%', tone: 'plum' as const },
  { left: '88%', tone: 'sage' as const },
] as const

const dividerFlowers = [
  { bloomSize: '0.82rem', delay: '0s', left: '4.5%', stemMax: '0.56rem', stemMin: '0.38rem', tone: 'gold' as const },
  { bloomSize: '0.74rem', delay: '0.14s', left: '8%', stemMax: '0.46rem', stemMin: '0.3rem', tone: 'sage' as const, desktopOnly: true },
  { bloomSize: '0.78rem', delay: '0.28s', left: '11.5%', stemMax: '0.5rem', stemMin: '0.34rem', tone: 'gold' as const },
  { bloomSize: '0.74rem', delay: '0.55s', left: '16.5%', stemMax: '0.46rem', stemMin: '0.3rem', tone: 'sage' as const },
  { bloomSize: '0.76rem', delay: '0.86s', left: '21.5%', stemMax: '0.48rem', stemMin: '0.32rem', tone: 'plum' as const },
  { bloomSize: '1.2rem', delay: '1.02s', left: '29%', stemMax: '0.62rem', stemMin: '0.4rem', tone: 'gold' as const },
  { bloomSize: '0.78rem', delay: '1.24s', left: '36%', stemMax: '0.5rem', stemMin: '0.34rem', tone: 'sage' as const, desktopOnly: true },
  { bloomSize: '0.82rem', delay: '1.48s', left: '44%', stemMax: '0.54rem', stemMin: '0.36rem', tone: 'gold' as const },
  { bloomSize: '0.76rem', delay: '1.82s', left: '52%', stemMax: '0.48rem', stemMin: '0.32rem', tone: 'rose' as const },
  { bloomSize: '0.74rem', delay: '2.12s', left: '60%', stemMax: '0.44rem', stemMin: '0.28rem', tone: 'sage' as const },
  { bloomSize: '1.36rem', delay: '2.38s', left: '68%', stemMax: '0.66rem', stemMin: '0.42rem', tone: 'sunflower' as const },
  { bloomSize: '0.78rem', delay: '2.62s', left: '75%', stemMax: '0.5rem', stemMin: '0.34rem', tone: 'plum' as const, desktopOnly: true },
  { bloomSize: '0.82rem', delay: '2.9s', left: '81%', stemMax: '0.54rem', stemMin: '0.36rem', tone: 'rose' as const },
  { bloomSize: '1.18rem', delay: '3.06s', left: '89%', stemMax: '0.62rem', stemMin: '0.4rem', tone: 'gold' as const },
  { bloomSize: '0.76rem', delay: '3.3s', left: '95%', stemMax: '0.48rem', stemMin: '0.32rem', tone: 'gold' as const },
] as const

const dividerRocks = [
  { bottom: '0.2rem', color: '#8b8174', height: '0.48rem', left: '8%', rotate: '-8deg', width: '0.9rem' },
  { bottom: '0.16rem', color: '#6d6458', height: '0.64rem', left: '27%', rotate: '7deg', width: '1.35rem', hideOnMobile: true },
  { bottom: '0.22rem', color: '#91887a', height: '0.42rem', left: '40%', rotate: '-10deg', width: '0.8rem', hideOnMobile: true },
  { bottom: '0.18rem', color: '#736a5d', height: '0.78rem', left: '59%', rotate: '5deg', width: '1.6rem' },
  { bottom: '0.18rem', color: '#968c7e', height: '0.44rem', left: '73%', rotate: '-6deg', width: '0.94rem', hideOnMobile: true },
  { bottom: '0.22rem', color: '#665d52', height: '0.62rem', left: '86%', rotate: '11deg', width: '1.28rem' },
] as const

const dividerPines = [
  { left: '14%', scale: 0.92, hideOnMobile: true },
  { left: '33%', scale: 0.82 },
  { left: '54%', scale: 1.04, hideOnMobile: true },
  { left: '77%', scale: 0.88 },
] as const

const persuasionSheep = [
  { left: '58%', src: '/catering/decor/sheep-sleepy.svg' },
  { left: '72%', src: '/catering/decor/sheep-curious.svg' },
  { left: '86%', src: '/catering/decor/sheep-grin.svg' },
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
  const selectableProducts = Array.isArray(product.selectableProducts) ? product.selectableProducts : []

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

const buildPersuasionHeading = () => 'Honest persuasion...'

const buildPersuasionCopy = (product: Partial<Product>, summary: string) => {
  if (product.slug === 'cookie-tray') {
    return cookieTrayPersuasionCopy
  }

  if (summary.trim()) {
    return [summary.trim()]
  }

  return []
}

const defaultToneVariants: Record<BloomTone, BloomVariant> = {
  gold: bloomVariantPresets[1],
  plum: bloomVariantPresets[0],
  rose: bloomVariantPresets[2],
  sage: bloomVariantPresets[3],
  sunflower: bloomVariantPresets[4],
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min

const getRandomBloomVariant = () =>
  bloomVariantPresets[Math.floor(Math.random() * bloomVariantPresets.length)] ?? bloomVariantPresets[0]

const createSpawnedCloud = (kind: 'hero' | 'panel' = 'panel'): SpawnedCloud => {
  const design = cloudSpawnDesigns[Math.floor(Math.random() * cloudSpawnDesigns.length)] ?? cloudSpawnDesigns[0]
  const leftRange = kind === 'hero' ? [4, 78] : [5, 78]
  const topRange = kind === 'hero' ? [1.2, 13.5] : [0.4, 6.2]

  return {
    id: Date.now() + Math.random(),
    left: `${randomBetween(leftRange[0], leftRange[1]).toFixed(2)}%`,
    src: design.src,
    top: `${randomBetween(topRange[0], topRange[1]).toFixed(2)}rem`,
    width: `${randomBetween(design.minWidth, design.maxWidth).toFixed(2)}rem`,
  }
}

const createSpawnedFlower = (): SpawnedFlower => ({
  id: Date.now() + Math.random(),
  left: `${randomBetween(6, 94).toFixed(2)}%`,
  scale: Number(randomBetween(0.88, 1.28).toFixed(2)),
  tone: randomFlowerTones[Math.floor(Math.random() * randomFlowerTones.length)] ?? 'sage',
  variant: getRandomBloomVariant(),
})

function MenuBloomMark({
  className,
  style,
  tone = 'sage',
  variant,
}: {
  className?: string
  style?: React.CSSProperties
  tone?: BloomTone
  variant?: BloomVariant
}) {
  const bloomVariant = variant ?? defaultToneVariants[tone]

  return (
    <span
      aria-hidden="true"
      className={cn('cateringBloomMark', `tone-${tone}`, className)}
      style={
        {
          ...style,
          ['--bloom-center-size' as string]: `${bloomVariant.centerSize}em`,
          ['--bloom-petal-height' as string]: `${bloomVariant.petalHeight}em`,
          ['--bloom-petal-offset' as string]: `${bloomVariant.petalOffset}em`,
          ['--bloom-petal-width' as string]: `${bloomVariant.petalWidth}em`,
        } as React.CSSProperties
      }
    >
      <span
        className="cateringBloomFlower"
        style={
          {
            ['--bloom-rotation' as string]: `${bloomVariant.rotation}deg`,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: bloomVariant.petalCount }).map((_, index) => (
          <span
            className="cateringBloomPetal"
            key={`${tone}-${index}`}
            style={
              {
                ['--petal-rotation' as string]: `${(360 / bloomVariant.petalCount) * index}deg`,
              } as React.CSSProperties
            }
          />
        ))}
        <span className="cateringBloomCenter" />
      </span>
      <span className="cateringBloomStem" />
    </span>
  )
}

function GardenDivider() {
  return (
    <div
      aria-hidden="true"
      className="cateringGardenDivider relative left-1/2 w-screen -translate-x-1/2"
    >
      <div className="cateringGardenInner">
        <svg
          className="cateringGardenGrass cateringGardenGrassBack"
          preserveAspectRatio="none"
          viewBox="0 0 1440 88"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect fill="#6f8f2b" height="32" width="1440" x="0" y="56" />
          <path
            d="M0 58L24 52L36 58L66 46L80 58L116 50L128 58L166 44L178 58L226 52L238 58L284 45L298 58L346 50L360 58L416 44L430 58L486 51L500 58L556 45L570 58L626 51L640 58L704 44L720 58L780 50L796 58L860 44L876 58L944 50L960 58L1032 44L1048 58L1118 51L1134 58L1208 45L1224 58L1298 51L1314 58L1388 44L1404 58L1440 58V88H0V58Z"
            fill="#98b64a"
          />
        </svg>

        {dividerFlowers.map((flower) => (
          <span
            className={cn(
              'cateringGardenFlower',
              `tone-${flower.tone}`,
              'desktopOnly' in flower && flower.desktopOnly && 'cateringGardenFlowerDesktopOnly',
            )}
            key={`${flower.left}-${flower.delay}`}
            style={
              {
                '--garden-delay': flower.delay,
                '--garden-bloom-size': flower.bloomSize,
                '--garden-stem-max': flower.stemMax,
                '--garden-stem-min': flower.stemMin,
                left: flower.left,
              } as React.CSSProperties
            }
          >
            <MenuBloomMark tone={flower.tone} variant={defaultToneVariants[flower.tone]} />
          </span>
        ))}

        {dividerPines.map((tree) => (
          <span
            className={cn(
              'cateringGardenPine',
              'hideOnMobile' in tree && tree.hideOnMobile && 'cateringGardenPineMobileHidden',
            )}
            key={`${tree.left}-${tree.scale}`}
            style={{ left: tree.left, transform: `translateX(-50%) scale(${tree.scale})` }}
          >
            <span className="cateringGardenPineTier cateringGardenPineTierTop" />
            <span className="cateringGardenPineTier cateringGardenPineTierMid" />
            <span className="cateringGardenPineTier cateringGardenPineTierBase" />
            <span className="cateringGardenPineTrunk" />
          </span>
        ))}

        {dividerRocks.map((rock) => (
          <span
            className={cn(
              'cateringGardenRock',
              'hideOnMobile' in rock && rock.hideOnMobile && 'cateringGardenRockMobileHidden',
            )}
            key={`${rock.left}-${rock.width}`}
            style={
              {
                background: `linear-gradient(180deg, ${rock.color}, rgba(52, 44, 36, 0.92))`,
                bottom: rock.bottom,
                height: rock.height,
                left: rock.left,
                transform: `translateX(-50%) rotate(${rock.rotate})`,
                width: rock.width,
              } as React.CSSProperties
            }
          />
        ))}

        <svg
          className="cateringGardenGrass cateringGardenGrassFront"
          preserveAspectRatio="none"
          viewBox="0 0 1440 88"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect fill="#6f8f2b" height="18" width="1440" x="0" y="70" />
          <path
            d="M0 71L18 66L30 71L54 61L66 71L92 65L104 71L134 60L146 71L176 66L188 71L220 60L232 71L268 64L280 71L314 59L326 71L366 66L378 71L416 60L430 71L472 65L486 71L530 59L544 71L592 66L606 71L654 60L668 71L718 65L732 71L784 59L798 71L852 66L866 71L920 60L934 71L992 65L1006 71L1064 59L1078 71L1138 66L1152 71L1214 60L1228 71L1290 65L1304 71L1368 59L1382 71L1440 71V88H0V71Z"
            fill="#89a836"
          />
        </svg>
      </div>
    </div>
  )
}

function MenuHero() {
  const [spawnedClouds, setSpawnedClouds] = useState<SpawnedCloud[]>([])
  const [spawnedFlowers, setSpawnedFlowers] = useState<SpawnedFlower[]>([])

  const spawnCloud = () => {
    setSpawnedClouds((current) => [...current, createSpawnedCloud('hero')])
  }

  const spawnFlower = () => {
    setSpawnedFlowers((current) => [...current.slice(-(maxSpawnedFlowers - 1)), createSpawnedFlower()])
  }

  return (
    <section className="cateringHeroBand relative left-1/2 w-screen -translate-x-1/2">
      <img
        alt=""
        aria-hidden="true"
        className="cateringHeroCloud left-[1%] top-[8%] w-[16rem] md:w-[20rem]"
        src="/clouds/three-ball-cloud-jumbo.svg"
      />
      <img
        alt=""
        aria-hidden="true"
        className="cateringHeroCloud left-[30%] top-[4%] w-[20rem] md:left-[37%] md:w-[29rem]"
        src="/clouds/three-ball-cloud-long.svg"
        style={{ animationDelay: '-10s' }}
      />
      <img
        alt=""
        aria-hidden="true"
        className="cateringHeroCloud right-[8%] top-[12%] w-[14rem] md:right-[9%] md:w-[18rem]"
        src="/clouds/three-ball-cloud-loft.svg"
        style={{ animationDelay: '-17s' }}
      />
      <img
        alt=""
        aria-hidden="true"
        className="cateringHeroCloud right-[-2%] top-[28%] hidden w-[18rem] md:block"
        src="/clouds/three-ball-cloud-long.svg"
        style={{ animationDelay: '-5s' }}
      />
      {spawnedClouds.map((cloud) => (
        <img
          alt=""
          aria-hidden="true"
          className="cateringHeroCloud"
          key={cloud.id}
          src={cloud.src}
          style={{
            left: cloud.left,
            top: cloud.top,
            width: cloud.width,
          }}
        />
      ))}
      <div className="container relative z-[2] py-14 md:py-20">
        <div className="max-w-[42rem] space-y-4">
          <div className="space-y-4">
            <p className="cateringMenuEyebrow cateringHeroEyebrow">Baked with Blessings</p>
            <h1 className="cateringMenuHeroDisplay max-w-[10ch] text-[clamp(3.5rem,8.6vw,6rem)] leading-[0.88] tracking-[-0.045em] text-[#19395f]">
              Catering Menu
            </h1>
            <p className="cateringHeroSummary max-w-[35rem] text-[1.02rem] leading-8 md:text-[1.14rem]">
              Clear portions, honest descriptions, and expandable ordering details for each item so
              the customer understands exactly what the group is buying.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button className="cateringSpawnButton" onClick={spawnCloud} type="button">
                Spawn a cloud
              </button>
              <button className="cateringSpawnButton" onClick={spawnFlower} type="button">
                Spawn a flower
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[0.3rem] z-[1] h-[4.2rem] overflow-hidden">
        {spawnedFlowers.map((flower) => (
          <span
            className="cateringHeroSpawnFlower"
            key={flower.id}
            style={{ left: flower.left, transform: `translateX(-50%) scale(${flower.scale})` }}
          >
            <MenuBloomMark tone={flower.tone} variant={flower.variant} />
          </span>
        ))}
      </div>
    </section>
  )
}

function PersuasionGardenPanel({
  product,
  summary,
}: {
  product: Partial<Product>
  summary: string
}) {
  const [spawnedClouds, setSpawnedClouds] = useState<SpawnedCloud[]>([])
  const [spawnedFlowers, setSpawnedFlowers] = useState<SpawnedFlower[]>([])
  const persuasionCopy = buildPersuasionCopy(product, summary)

  const spawnCloud = () => {
    setSpawnedClouds((current) => [...current, createSpawnedCloud('panel')])
  }

  const spawnFlower = () => {
    setSpawnedFlowers((current) => [...current.slice(-(maxSpawnedFlowers - 1)), createSpawnedFlower()])
  }

  return (
    <div className="cateringPersuasionPanel relative overflow-hidden rounded-[1.45rem] border border-[rgba(91,70,37,0.12)] bg-[#dbeeff] px-5 py-5 shadow-[0_10px_24px_rgba(23,21,16,0.07)] md:px-6 md:py-6">
      <img
        alt=""
        aria-hidden="true"
        className="cateringPersuasionCloud left-[2%] top-[0.5rem] w-[14rem]"
        src="/clouds/three-ball-cloud-long.svg"
      />
      <img
        alt=""
        aria-hidden="true"
        className="cateringPersuasionCloud right-[24%] top-[0.95rem] w-[9.8rem]"
        src="/clouds/three-ball-cloud-loft.svg"
        style={{ animationDelay: '-8s' }}
      />
      <img
        alt=""
        aria-hidden="true"
        className="cateringPersuasionCloud right-[2%] top-[3.5rem] w-[13.4rem]"
        src="/clouds/three-ball-cloud-jumbo.svg"
        style={{ animationDelay: '-14s' }}
      />
      {spawnedClouds.map((cloud) => (
        <img
          alt=""
          aria-hidden="true"
          className="cateringPersuasionCloud"
          key={cloud.id}
          src={cloud.src}
          style={{
            left: cloud.left,
            top: cloud.top,
            width: cloud.width,
          }}
        />
      ))}

      <div className="relative z-[2] max-w-[44rem] space-y-4 pb-14 pr-0 md:pb-16 md:pr-[10rem]">
        <h4 className="cateringMenuRoundHeading cateringPersuasionHeading text-[clamp(1.85rem,3.6vw,2.45rem)] leading-[0.95] tracking-[-0.04em]">
          {buildPersuasionHeading()}
        </h4>

        {product.slug === 'cookie-tray' ? (
          <div className="cateringPersuasionBody space-y-4">
            {persuasionCopy.map((paragraph) => (
              <p className="text-[1rem] leading-8 md:text-[1.06rem]" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : product.menuExpandedPitch ? (
          <RichText
            className="cateringPitch cateringPersuasionBody prose-p:leading-7"
            data={product.menuExpandedPitch}
            enableGutter={false}
          />
        ) : (
          <div className="cateringPersuasionBody space-y-4">
            {persuasionCopy.map((paragraph) => (
              <p className="text-[1rem] leading-8 md:text-[1.06rem]" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button className="cateringSpawnButton" onClick={spawnCloud} type="button">
            Spawn a cloud
          </button>
          <button className="cateringSpawnButton" onClick={spawnFlower} type="button">
            Spawn a flower
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4.8rem] overflow-hidden">
        <div className="cateringPersuasionGrassBack" />
        {persuasionSheep.map((sheep) => (
          <img
            alt=""
            aria-hidden="true"
            className="cateringPixelSheep"
            key={sheep.left}
            src={sheep.src}
            style={{ left: sheep.left }}
          />
        ))}

        {persuasionGardenFlowers.map((flower) => (
          <span
            className={cn('cateringPersuasionFlower', `tone-${flower.tone}`)}
            key={`${flower.left}-${flower.tone}`}
            style={{ left: flower.left }}
          >
            <MenuBloomMark tone={flower.tone} />
          </span>
        ))}
        {spawnedFlowers.map((flower) => (
          <span
            className={cn('cateringPersuasionFlower cateringPersuasionFlowerSpawned', `tone-${flower.tone}`)}
            key={flower.id}
            style={{ left: flower.left, transform: `translateX(-50%) scale(${flower.scale})` }}
          >
            <MenuBloomMark tone={flower.tone} variant={flower.variant} />
          </span>
        ))}
        <div className="cateringPersuasionGrassFront" />
      </div>
    </div>
  )
}

function TrayFlavorCard({
  addSelection,
  canIncrement,
  count,
  flavor,
  removeSelection,
}: {
  addSelection: () => void
  canIncrement: boolean
  count: number
  flavor: SelectableFlavor
  removeSelection: () => void
}) {
  return (
    <article className="cateringFlavorCard flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(91,70,37,0.14)] bg-[rgba(255,250,242,0.98)]">
      <div className="px-4 pt-3.5">
        <div className="min-w-0">
          <h4 className="cateringMenuRoundHeading truncate text-[1.02rem] leading-tight tracking-[-0.02em] text-[#171510]">
            {flavor.title}
          </h4>
          <div className="mt-2.5 flex items-center justify-between gap-2.5">
            <button
              aria-label={`Remove one ${flavor.title}`}
              className="cateringFlavorStep"
              disabled={count < 1}
              onClick={removeSelection}
              type="button"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="text-center">
              <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[rgba(23,21,16,0.42)]">
                In tray
              </p>
              <p className="cateringMenuRoundHeading text-[0.94rem] tracking-[-0.02em] text-[#171510]">
                {count}
              </p>
            </div>

            <button
              aria-label={`Add one ${flavor.title}`}
              className="cateringFlavorStep"
              disabled={!canIncrement}
              onClick={addSelection}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {flavor.summary ? (
            <p className="mt-2.5 line-clamp-2 text-[0.8rem] leading-6 text-[rgba(23,21,16,0.62)]">
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
            '--cookie-size': 'clamp(10rem, 64%, 11.6rem)',
          } as React.CSSProperties
        }
      >
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          src="/grassland.svg"
        />
        <img
          alt=""
          aria-hidden="true"
          className="cateringFlavorCloud pointer-events-none absolute left-[-18%] top-[14%] z-10 w-[5rem]"
          src="/clouds/three-ball-cloud-compact.svg"
        />
        <img
          alt=""
          aria-hidden="true"
          className="cateringFlavorCloud pointer-events-none absolute left-[-12%] top-[30%] z-10 w-[4.2rem]"
          src="/clouds/three-ball-cloud.svg"
          style={{ animationDelay: '-6s' }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[54%] bg-gradient-to-b from-[rgba(255,255,255,0.18)] to-transparent" />

        <div className="relative h-[14.3rem]">
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

function SimpleItemPanel({
  image,
  onAddToCart,
  priceInUSD,
  product,
}: {
  image: MediaType | null
  onAddToCart: () => void
  priceInUSD?: number | null
  product: Partial<Product>
}) {
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
          <p className="text-[1rem] leading-8 text-[rgba(23,21,16,0.76)]">{resolveSummary(product)}</p>
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
          className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[#171510] px-5 text-[0.98rem] tracking-[-0.02em] text-white transition duration-200 hover:bg-[#2a2822]"
          onClick={onAddToCart}
          type="button"
        >
          Add to cart
        </button>
      </div>
    </div>
  )
}

function BatchBuilderPanel({
  onAddFlavor,
  onAddToCart,
  onRemoveFlavor,
  priceInUSD,
  product,
  requiredSelectionCount,
  selectableFlavors,
  selectedCounts,
  totalSelected,
  traySelectionsForSummary,
}: {
  onAddFlavor: (flavorID: number) => void
  onAddToCart: () => void
  onRemoveFlavor: (flavorID: number) => void
  priceInUSD?: number | null
  product: Partial<Product>
  requiredSelectionCount: number
  selectableFlavors: SelectableFlavor[]
  selectedCounts: Record<number, number>
  totalSelected: number
  traySelectionsForSummary: {
    product: Product
    quantity: number
  }[]
}) {
  const canAddTray =
    requiredSelectionCount > 0 &&
    totalSelected === requiredSelectionCount &&
    traySelectionsForSummary.length > 0
  const progressPercentage =
    requiredSelectionCount > 0
      ? Math.min(1, totalSelected / requiredSelectionCount) * 100
      : 0
  const progressFlowers = Array.from({ length: totalSelected }, (_, index) => ({
    id: `slot-${index}`,
    tone: progressBloomTones[index % progressBloomTones.length] ?? 'sage',
  }))

  return (
    <div className="space-y-5">
      <PersuasionGardenPanel product={product} summary={resolveSummary(product)} />

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

                {progressFlowers.map((bloom, index) => (
                  <span
                    className={cn('cateringProgressBloom', `tone-${bloom.tone}`)}
                    key={bloom.id}
                    style={{
                      left: `${((index + 1) / requiredSelectionCount) * 100}%`,
                    }}
                  >
                    <MenuBloomMark tone={bloom.tone} variant={defaultToneVariants[bloom.tone]} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <TraySelectionSummary
          compact
          label="Current tray mix"
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
                      count={flavorCount}
                      flavor={flavor}
                      removeSelection={() => onRemoveFlavor(flavor.id)}
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
            canAddTray
              ? 'cursor-pointer bg-[#171510] text-white hover:bg-[#2a2822]'
              : 'cursor-not-allowed bg-[#171510]/12 text-[#171510]/42',
          )}
          disabled={!canAddTray}
          onClick={onAddToCart}
          type="button"
        >
          Add tray to cart
        </button>
      </div>
    </div>
  )
}

function CateringMenuRow({ index, product }: { index: number; product: Partial<Product> }) {
  const { addItem, isLoading } = useCart()
  const [selectedCounts, setSelectedCounts] = useState<Record<number, number>>({})
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

  const handleAddFlavor = (flavorID: number) => {
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

  const handleAddToCart = () => {
    if (!product.id || isLoading) {
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

      addItem({
        batchSelections: traySelectionsForCart,
        product: product.id,
      } as Parameters<typeof addItem>[0]).then(() => {
        toast.success(`${product.title ?? 'Tray'} added to cart.`)
        setSelectedCounts({})
      })

      return
    }

    addItem({ product: product.id }).then(() => {
      toast.success(`${product.title ?? 'Item'} added to cart.`)
    })
  }

  return (
    <AccordionItem className="border-b border-[rgba(23,21,16,0.14)]" value={product.slug ?? `row-${index}`}>
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
            onAddFlavor={handleAddFlavor}
            onAddToCart={handleAddToCart}
            onRemoveFlavor={handleRemoveFlavor}
            priceInUSD={product.priceInUSD}
            product={product}
            requiredSelectionCount={requiredSelectionCount}
            selectableFlavors={selectableFlavors}
            selectedCounts={selectedCounts}
            totalSelected={totalSelected}
            traySelectionsForSummary={traySelectionsForSummary}
          />
        ) : (
          <SimpleItemPanel
            image={image}
            onAddToCart={handleAddToCart}
            priceInUSD={product.priceInUSD}
            product={product}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export function CateringMenuSection({ products }: CateringMenuSectionProps) {
  const orderedProducts = useMemo(() => sortProductsForDisplay(products), [products])

  if (orderedProducts.length === 0) {
    return null
  }

  return (
    <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
      <MenuHero />
      <GardenDivider />

      <section className="cateringMenuBand relative left-1/2 w-screen -translate-x-1/2" id="catering-menu-items">
        <div className="container pt-0 pb-6 md:pt-0 md:pb-10">
          <div className="cateringMenuPanel">
            <Accordion collapsible defaultValue={orderedProducts[0]?.slug ?? undefined} type="single">
              {orderedProducts.map((product, index) => (
                <CateringMenuRow
                  index={index}
                  key={product.id ?? product.slug ?? index}
                  product={product}
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

        .cateringPersuasionBody :is(h1, h2, h3, h4) {
          display: none;
        }

        .cateringPersuasionBody :is(p, li) {
          color: #27496b;
          font-weight: 650;
        }

        .cateringHeroBand {
          background: transparent;
          overflow: hidden;
        }

        .cateringMenuBand {
          background: #fff8f2;
        }

        .cateringMenuPanel {
          padding: 0;
        }

        .cateringGardenDivider {
          background: #dbeeff;
        }

        .cateringGardenInner {
          background: #dbeeff;
          height: 4.1rem;
          overflow: hidden;
          position: relative;
        }

        .cateringGardenGrass {
          display: block;
          left: 0;
          position: absolute;
          width: 100%;
        }

        .cateringGardenGrassBack {
          bottom: -0.1rem;
          height: 2.2rem;
          z-index: 1;
        }

        .cateringGardenGrassFront {
          bottom: -0.1rem;
          height: 1.55rem;
          z-index: 4;
        }

        .cateringGardenFlower {
          align-items: center;
          bottom: 0.55rem;
          display: inline-flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 0;
          position: absolute;
          transform: translateX(-50%);
          z-index: 3;
        }

        .cateringGardenFlower .cateringBloomFlower {
          height: 0.92rem;
          width: 0.92rem;
        }

        .cateringGardenFlower .cateringBloomStem {
          animation: cateringGardenStemGrow 3.4s ease-in-out infinite;
          animation-delay: var(--garden-delay, 0s);
          height: var(--garden-stem-min, 0.9rem);
          margin-top: -0.06rem;
        }

        .cateringGardenFlowerDesktopOnly {
          display: inline-flex;
        }

        .cateringGardenBloom {
          align-items: center;
          display: inline-flex;
          height: var(--garden-bloom-size, 0.82rem);
          justify-content: center;
          margin-bottom: -0.06rem;
          width: var(--garden-bloom-size, 0.82rem);
        }

        .cateringGardenBloom .cateringBloomFlower {
          height: 100%;
          width: 100%;
        }

        .cateringGardenStem {
          animation: cateringGardenStemGrow 3.4s ease-in-out infinite;
          animation-delay: var(--garden-delay, 0s);
          background: linear-gradient(180deg, #98a44a 0%, #536520 100%);
          border-radius: 999px;
          height: var(--garden-stem-min, 0.9rem);
          width: 2px;
        }

        .cateringGardenRock {
          border-radius: 999px 999px 0.7rem 0.7rem;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 1px 3px rgba(23, 21, 16, 0.18);
          position: absolute;
          z-index: 2;
        }

        .cateringGardenRockMobileHidden {
          display: block;
        }

        .cateringGardenPine {
          align-items: center;
          bottom: 0.7rem;
          display: inline-flex;
          flex-direction: column;
          gap: 0.02rem;
          position: absolute;
          transform-origin: center bottom;
          z-index: 2;
        }

        .cateringGardenPineTier {
          background: #406a22;
          border-radius: 0.16rem;
          display: block;
        }

        .cateringGardenPineTierTop {
          height: 0.34rem;
          width: 0.52rem;
        }

        .cateringGardenPineTierMid {
          height: 0.42rem;
          width: 0.8rem;
        }

        .cateringGardenPineTierBase {
          height: 0.5rem;
          width: 1.08rem;
        }

        .cateringGardenPineTrunk {
          background: #5e4829;
          border-radius: 999px;
          height: 0.36rem;
          width: 0.14rem;
        }

        .cateringGardenPineMobileHidden {
          display: block;
        }

        .cateringPersuasionPanel {
          isolation: isolate;
        }

        .cateringPersuasionCloud {
          animation: cateringCloudBob 8.4s ease-in-out infinite;
          opacity: 0.96;
          position: absolute;
          z-index: 0;
        }

        .cateringHeroCloud {
          animation: cateringCloudBob 9.6s ease-in-out infinite;
          opacity: 0.95;
          position: absolute;
          z-index: 0;
        }

        .cateringSpawnButton {
          align-items: center;
          background: rgba(255, 248, 242, 0.84);
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
          padding: 0.45rem 0.95rem;
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 2;
        }

        .cateringSpawnButton:hover,
        .cateringSpawnButton:focus-visible {
          background: #fff8f2;
          border-color: rgba(25, 57, 95, 0.26);
          transform: translateY(-1px);
        }

        .cateringPersuasionGrassBack,
        .cateringPersuasionGrassFront {
          inset-inline: 0;
          position: absolute;
        }

        .cateringPersuasionGrassBack {
          background:
            radial-gradient(circle at 8% 110%, #8db03a 0 16%, transparent 17%),
            radial-gradient(circle at 20% 110%, #8db03a 0 17%, transparent 18%),
            radial-gradient(circle at 34% 110%, #8db03a 0 15%, transparent 16%),
            radial-gradient(circle at 48% 110%, #8db03a 0 18%, transparent 19%),
            radial-gradient(circle at 63% 110%, #8db03a 0 16%, transparent 17%),
            radial-gradient(circle at 79% 110%, #8db03a 0 19%, transparent 20%),
            radial-gradient(circle at 92% 110%, #8db03a 0 16%, transparent 17%),
            linear-gradient(180deg, #a6c656 0%, #7ea12f 100%);
          bottom: 0;
          height: 2.9rem;
          z-index: 1;
        }

        .cateringPersuasionGrassFront {
          background:
            radial-gradient(circle at 10% 115%, #6f8f2b 0 18%, transparent 19%),
            radial-gradient(circle at 26% 115%, #6f8f2b 0 17%, transparent 18%),
            radial-gradient(circle at 44% 115%, #6f8f2b 0 19%, transparent 20%),
            radial-gradient(circle at 60% 115%, #6f8f2b 0 17%, transparent 18%),
            radial-gradient(circle at 78% 115%, #6f8f2b 0 19%, transparent 20%),
            radial-gradient(circle at 94% 115%, #6f8f2b 0 17%, transparent 18%),
            linear-gradient(180deg, #7f9f31 0%, #60771d 100%);
          bottom: 0;
          height: 1.35rem;
          z-index: 3;
        }

        .cateringPersuasionFlower,
        .cateringPersuasionFlowerSpawned {
          position: absolute;
          z-index: 2;
        }

        .cateringPersuasionFlower {
          bottom: 1.1rem;
          transform: translateX(-50%);
        }

        .cateringPersuasionFlower .cateringBloomStem {
          height: 0.76rem;
        }

        .cateringPersuasionFlowerSpawned {
          bottom: 1.06rem;
        }

        .cateringHeroSpawnFlower {
          bottom: 0.2rem;
          position: absolute;
          z-index: 1;
        }

        .cateringPixelSheep {
          bottom: 0.86rem;
          display: block;
          height: 4.4rem;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%);
          width: 5.8rem;
          z-index: 2;
        }

        .cateringPersuasionHeading {
          color: #143e63;
          font-weight: 520;
          text-wrap: balance;
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
        }

        .cateringFlavorCard button {
          touch-action: manipulation;
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
          animation: cateringCloudBob 7.6s ease-in-out infinite;
          filter: drop-shadow(0 6px 10px rgba(255, 255, 255, 0.28));
        }

        .cateringFlavorStep {
          align-items: center;
          background: rgba(28, 46, 16, 0.06);
          border: 1px solid rgba(28, 46, 16, 0.12);
          border-radius: 999px;
          color: #1c2e10;
          display: inline-flex;
          height: 1.9rem;
          justify-content: center;
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease;
          width: 1.9rem;
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
          flex: 0 0 min(82vw, 18rem);
          scroll-snap-align: start;
        }

        .cateringProgressBloom {
          bottom: 0.12rem;
          opacity: 1;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%);
          transform-origin: center bottom;
          z-index: 2;
        }

        .cateringProgressBloom .cateringBloomFlower {
          animation: cateringProgressFlowerGrow 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
          height: 0.96rem;
          transform: scale(0.42);
          transform-origin: center center;
          width: 0.96rem;
        }

        .cateringProgressBloom .cateringBloomStem {
          animation: cateringProgressStemGrow 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
          height: 0.14rem;
          margin-top: -0.02rem;
          width: 2px;
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

        @keyframes cateringProgressStemGrow {
          0% {
            height: 0.14rem;
          }

          68% {
            height: 1rem;
          }

          100% {
            height: 0.78rem;
          }
        }

        @keyframes cateringProgressFlowerGrow {
          0% {
            transform: scale(0.36);
          }

          74% {
            transform: scale(1.08);
          }

          100% {
            transform: scale(0.94);
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

        @media (min-width: 960px) {
          .cateringFlavorRailItem {
            flex-basis: 18rem;
          }
        }

        @media (max-width: 767px) {
          .cateringPriceBlock {
            min-width: 0;
          }

          .cateringGardenInner {
            height: 3.5rem;
          }

          .cateringGardenGrassBack {
            height: 1.9rem;
          }

          .cateringGardenGrassFront {
            height: 1.35rem;
          }

          .cateringGardenFlowerDesktopOnly,
          .cateringGardenRockMobileHidden,
          .cateringGardenPineMobileHidden {
            display: none;
          }

          .cateringPersuasionPanel {
            padding-inline: 1rem;
          }

          .cateringPersuasionCloud {
            width: 6.2rem;
          }

          .cateringHeroCloud:first-of-type {
            left: 0;
          }

          .cateringPixelSheep {
            height: 3.65rem;
            width: 4.8rem;
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
            flex-basis: min(84vw, 17rem);
          }

          .cateringPortionInline {
            font-size: 0.76rem;
          }
        }
      `}</style>
    </div>
  )
}
