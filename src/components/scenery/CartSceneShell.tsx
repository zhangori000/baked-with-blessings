'use client'

import { CookieSheepRig } from '@/app/(app)/menu/_components/cookie-sheep-rig'
import { cn } from '@/utilities/cn'
import Image from 'next/image'
import { type ReactNode } from 'react'

import {
  menuHeroCloudsByScene,
  menuHeroCrittersByScene,
  menuHeroMeadowByScene,
  menuHeroMobileSkyByScene,
  menuHeroPiecesByScene,
  menuHeroSkyByScene,
} from './menuHeroScenery'
import { usePersistentMenuSceneTone } from './usePersistentMenuSceneTone'

type CartSceneShellProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  hideSheep?: boolean
}

export function CartSceneShell({
  children,
  className,
  contentClassName,
  hideSheep = false,
}: CartSceneShellProps) {
  const [sceneTone] = usePersistentMenuSceneTone('classic')
  const skySrc = menuHeroSkyByScene[sceneTone] ?? menuHeroSkyByScene.classic
  const mobileSkySrc = menuHeroMobileSkyByScene[sceneTone]
  const meadowSrc = menuHeroMeadowByScene[sceneTone] ?? menuHeroMeadowByScene.classic
  const clouds = menuHeroCloudsByScene[sceneTone] ?? menuHeroCloudsByScene.classic
  const pieces = menuHeroPiecesByScene[sceneTone] ?? menuHeroPiecesByScene.classic
  const critters = menuHeroCrittersByScene[sceneTone] ?? menuHeroCrittersByScene.classic

  return (
    <div className={cn('cartSceneShell', className)}>
      <picture className="cartSceneSky">
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

      {clouds.map((cloud, index) => (
        <Image
          alt=""
          aria-hidden="true"
          className={cn('cartSceneCloud', cloud.className)}
          height={320}
          key={`cart-scene-cloud-${sceneTone}-${index}-${cloud.src}`}
          priority
          src={cloud.src}
          style={cloud.style}
          unoptimized
          width={640}
        />
      ))}

      {pieces.map((piece, index) => (
        <Image
          alt=""
          aria-hidden="true"
          className={cn('cartScenePiece', piece.className)}
          height={900}
          key={`cart-scene-piece-${sceneTone}-${index}-${piece.src}`}
          priority
          src={piece.src}
          style={piece.style}
          unoptimized
          width={900}
        />
      ))}

      {critters.map((critter, index) => (
        <Image
          alt=""
          aria-hidden="true"
          className={cn('cartScenePiece', critter.className)}
          height={240}
          key={`cart-scene-critter-${sceneTone}-${index}-${critter.src}`}
          priority
          src={critter.src}
          style={critter.style}
          unoptimized
          width={240}
        />
      ))}

      <Image
        alt=""
        aria-hidden="true"
        className="cartSceneMeadow"
        height={420}
        priority
        sizes="min(100vw, 32rem)"
        src={meadowSrc}
        unoptimized
        width={1200}
      />

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
