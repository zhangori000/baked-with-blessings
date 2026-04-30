'use client'

import { CookieSheepRig } from '@/app/(app)/menu/_components/cookie-sheep-rig'
import { cn } from '@/utilities/cn'
import Image from 'next/image'
import { type ReactNode } from 'react'

import {
  menuHeroCloudsByScene,
  menuHeroCrittersByScene,
  menuHeroFlowersByScene,
  menuHeroMeadowByScene,
  menuHeroMobileMeadowByScene,
  menuHeroMobileSkyByScene,
  menuHeroPiecesByScene,
  menuHeroSkyByScene,
  type SceneCloudConfig,
  type SceneFlowerConfig,
  type SceneTone,
} from './menuHeroScenery'
import { usePersistentMenuSceneTone } from './usePersistentMenuSceneTone'

export type CartSceneShellVariant = 'default' | 'compact'

const absoluteDecorationStyle = {
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 1,
} as const

const cartCompactCloudsByScene: Partial<Record<SceneTone, readonly SceneCloudConfig[]>> = {
  classic: [
    {
      className: 'left-[42%] top-[20%] w-[6.6rem] md:w-[7.4rem]',
      src: '/clouds/three-ball-cloud-compact.svg',
      style: { animationDelay: '-8s' },
    },
    {
      className: 'right-[14%] top-[15%] w-[5.8rem] md:w-[6.6rem]',
      src: '/clouds/three-ball-cloud.svg',
      style: { animationDelay: '-13s' },
    },
  ],
}

const cartCompactFlowersByScene: Partial<Record<SceneTone, readonly SceneFlowerConfig[]>> = {
  classic: [
    { asset: '/flowers/daisy-small.svg', left: '19%', scale: 0.42 },
    {
      asset: '/flowers/pink-daisy-wildflower.svg',
      left: '36%',
      scale: 0.38,
      variant: 'wildflower',
    },
    { asset: '/flowers/sunflower.svg', left: '58%', scale: 0.46 },
    { asset: '/flowers/rose.svg', left: '78%', scale: 0.4, variant: 'wildflower' },
  ],
}

const compactCloudClassNames = [
  'left-[38%] top-[18%] w-[5.6rem] md:left-[44%] md:top-[16%] md:w-[6.8rem]',
  'right-[12%] top-[12%] w-[6.4rem] md:right-[14%] md:top-[10%] md:w-[8rem]',
]

const compactFlowerPositions = ['18%', '34%', '50%', '66%', '82%']

const getCompactClouds = (
  sceneTone: SceneTone,
  clouds: readonly SceneCloudConfig[],
): readonly SceneCloudConfig[] =>
  cartCompactCloudsByScene[sceneTone] ??
  clouds.slice(0, 2).map((cloud, index) => ({
    ...cloud,
    className: compactCloudClassNames[index] ?? compactCloudClassNames[0],
  }))

const getCompactFlowers = (sceneTone: SceneTone): readonly SceneFlowerConfig[] =>
  cartCompactFlowersByScene[sceneTone] ??
  (menuHeroFlowersByScene[sceneTone] ?? []).slice(0, 5).map((flower, index) => ({
    ...flower,
    left: compactFlowerPositions[index] ?? flower.left,
    scale: Math.min(flower.scale * 0.52, 0.5),
  }))

type CartSceneShellProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  hideCompactFlowers?: boolean
  hideSheep?: boolean
  variant?: CartSceneShellVariant
}

export function CartSceneShell({
  children,
  className,
  contentClassName,
  hideCompactFlowers = false,
  hideSheep = false,
  variant = 'default',
}: CartSceneShellProps) {
  const [sceneTone] = usePersistentMenuSceneTone('classic')
  const skySrc = menuHeroSkyByScene[sceneTone] ?? menuHeroSkyByScene.classic
  const mobileSkySrc = menuHeroMobileSkyByScene[sceneTone]
  const meadowSrc = menuHeroMeadowByScene[sceneTone] ?? menuHeroMeadowByScene.classic
  const mobileMeadowSrc = menuHeroMobileMeadowByScene[sceneTone]
  const clouds = menuHeroCloudsByScene[sceneTone] ?? menuHeroCloudsByScene.classic
  const pieces = menuHeroPiecesByScene[sceneTone] ?? menuHeroPiecesByScene.classic
  const critters = menuHeroCrittersByScene[sceneTone] ?? menuHeroCrittersByScene.classic
  const compactClouds = getCompactClouds(sceneTone, clouds)
  const compactFlowers = getCompactFlowers(sceneTone)

  const isCompact = variant === 'compact'
  const renderedClouds = isCompact ? compactClouds : clouds
  const shouldRenderPieces = !isCompact
  const shouldRenderCritters = !isCompact

  return (
    <div
      className={cn('cartSceneShell relative isolate overflow-hidden', className)}
      data-scene={sceneTone}
      data-variant={variant}
    >
      <picture
        className="cartSceneSky"
        style={{
          inset: 0,
          height: '100%',
          pointerEvents: 'none',
          position: 'absolute',
          width: '100%',
          zIndex: 0,
        }}
      >
        {mobileSkySrc ? <source media="(max-width: 767px)" srcSet={mobileSkySrc} /> : null}
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover"
          fill
          priority
          sizes="min(100vw, 32rem)"
          src={skySrc}
          unoptimized
        />
      </picture>

      {renderedClouds.map((cloud, index) => (
        <Image
          alt=""
          aria-hidden="true"
          className={cn('cartSceneCloud', cloud.className)}
          height={320}
          key={`cart-scene-cloud-${sceneTone}-${index}-${cloud.src}`}
          priority
          src={cloud.src}
          style={{ ...absoluteDecorationStyle, height: 'auto', ...cloud.style }}
          unoptimized
          width={640}
        />
      ))}

      {shouldRenderPieces
        ? pieces.map((piece, index) => (
            <Image
              alt=""
              aria-hidden="true"
              className={cn('cartScenePiece', piece.className)}
              height={900}
              key={`cart-scene-piece-${sceneTone}-${index}-${piece.src}`}
              priority
              src={piece.src}
              style={{
                ...absoluteDecorationStyle,
                transformOrigin: 'center bottom',
                ...piece.style,
              }}
              unoptimized
              width={900}
            />
          ))
        : null}

      {shouldRenderCritters
        ? critters.map((critter, index) => (
            <Image
              alt=""
              aria-hidden="true"
              className={cn('cartScenePiece', critter.className)}
              height={240}
              key={`cart-scene-critter-${sceneTone}-${index}-${critter.src}`}
              priority
              src={critter.src}
              style={{
                ...absoluteDecorationStyle,
                transformOrigin: 'center bottom',
                ...critter.style,
              }}
              unoptimized
              width={240}
            />
          ))
        : null}

      {isCompact && !hideCompactFlowers
        ? compactFlowers.map((flower, index) => (
            <Image
              alt=""
              aria-hidden="true"
              className={cn(
                'cartSceneFlower',
                flower.variant === 'wildflower' && 'cartSceneFlowerWild',
              )}
              height={120}
              key={`cart-scene-flower-${sceneTone}-${index}-${flower.asset}`}
              priority
              src={flower.asset}
              style={{
                ...absoluteDecorationStyle,
                height: 'auto',
                left: flower.left,
                transform: `translateX(-50%) scale(${flower.scale})`,
              }}
              unoptimized
              width={120}
            />
          ))
        : null}

      <picture
        className="cartSceneMeadow"
        style={{
          bottom: '-0.3rem',
          height: 'clamp(4.5rem, 24%, 6.6rem)',
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          width: '100%',
          zIndex: 0,
        }}
      >
        {mobileMeadowSrc ? <source media="(max-width: 767px)" srcSet={mobileMeadowSrc} /> : null}
        <Image
          alt=""
          aria-hidden="true"
          className="w-full object-cover object-bottom"
          height={420}
          priority
          sizes="min(100vw, 32rem)"
          src={meadowSrc}
          unoptimized
          width={1200}
        />
      </picture>

      {!hideSheep ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]">
          <CookieSheepRig
            bodyFallbackSrc="/cookie-singular-brookie.svg"
            className="left-auto right-5 translate-x-0 [--cookie-bottom:0.5rem] [--cookie-size:6.8rem] md:[--cookie-size:8rem]"
            image={null}
            title="Cart sheep"
          />
        </div>
      ) : null}

      <div className={cn('relative z-[3]', contentClassName)}>{children}</div>
    </div>
  )
}
