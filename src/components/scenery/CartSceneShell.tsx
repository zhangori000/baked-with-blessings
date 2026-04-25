'use client'

import { CookieSheepRig } from '@/app/(app)/shop/cookie-sheep-rig'
import { cn } from '@/utilities/cn'
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
      <picture aria-hidden="true" className="cartSceneSky">
        {mobileSkySrc ? <source media="(max-width: 767px)" srcSet={mobileSkySrc} /> : null}
        <img alt="" aria-hidden="true" className="h-full w-full object-cover" src={skySrc} />
      </picture>

      {clouds.map((cloud, index) => (
        <img
          alt=""
          aria-hidden="true"
          className={cn('cartSceneCloud', cloud.className)}
          key={`cart-scene-cloud-${sceneTone}-${index}-${cloud.src}`}
          src={cloud.src}
          style={cloud.style}
        />
      ))}

      {pieces.map((piece, index) => (
        <img
          alt=""
          aria-hidden="true"
          className={cn('cartScenePiece', piece.className)}
          key={`cart-scene-piece-${sceneTone}-${index}-${piece.src}`}
          src={piece.src}
          style={piece.style}
        />
      ))}

      {critters.map((critter, index) => (
        <img
          alt=""
          aria-hidden="true"
          className={cn('cartScenePiece', critter.className)}
          key={`cart-scene-critter-${sceneTone}-${index}-${critter.src}`}
          src={critter.src}
          style={critter.style}
        />
      ))}

      <img alt="" aria-hidden="true" className="cartSceneMeadow" src={meadowSrc} />

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
