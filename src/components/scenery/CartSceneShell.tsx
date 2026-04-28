'use client'

import { CookieSheepRig } from '@/app/(app)/menu/_components/cookie-sheep-rig'
import { cn } from '@/utilities/cn'
import Image from 'next/image'
import { type ReactNode } from 'react'

import {
  menuHeroCloudsByScene,
  menuHeroCrittersByScene,
  menuHeroMeadowByScene,
  menuHeroMobileMeadowByScene,
  menuHeroMobileSkyByScene,
  menuHeroPiecesByScene,
  menuHeroSkyByScene,
} from './menuHeroScenery'
import { usePersistentMenuSceneTone } from './usePersistentMenuSceneTone'

export type CartSceneShellVariant = 'default' | 'compact'

const absoluteDecorationStyle = {
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 1,
} as const

type CartSceneShellProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  hideSheep?: boolean
  variant?: CartSceneShellVariant
}

export function CartSceneShell({
  children,
  className,
  contentClassName,
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

  const isCompact = variant === 'compact'
  const renderedClouds = isCompact ? clouds.slice(0, 2) : clouds
  const shouldRenderPieces = !isCompact
  const shouldRenderCritters = !isCompact

  return (
    <div className={cn('cartSceneShell', className)}>
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
          style={{ ...absoluteDecorationStyle, ...cloud.style }}
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
              style={{ ...absoluteDecorationStyle, transformOrigin: 'center bottom', ...piece.style }}
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
