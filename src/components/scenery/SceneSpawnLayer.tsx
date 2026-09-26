'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'

import { cn } from '@/utilities/cn'

import { groundSpawnMotions, type SceneSprite, type SpawnParticles } from './spawnables'

import './scene-spawn.css'

export function SpriteParticles({ particles }: { particles: SpawnParticles }) {
  return (
    <span className={cn('sceneSpriteParticles', `sceneSpriteParticles--${particles.effect}`)}>
      {Array.from({ length: particles.count }, (_, index) => (
        <Image
          alt=""
          className="sceneSpriteParticle"
          draggable={false}
          height={24}
          key={index}
          src={particles.asset}
          style={
            {
              ['--particle-index' as string]: index,
              ['--particle-count' as string]: particles.count,
            } as CSSProperties
          }
          unoptimized
          width={24}
        />
      ))}
    </span>
  )
}

type SceneSpawnLayerProps = {
  className?: string
  sprites: readonly SceneSprite[]
  style?: CSSProperties
  zone: 'ground' | 'sky'
}

export function SceneSpawnLayer({ className, sprites, style, zone }: SceneSpawnLayerProps) {
  const visible = sprites.filter(
    (entry) => groundSpawnMotions.has(entry.motion) === (zone === 'ground'),
  )

  if (visible.length === 0) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className={cn('sceneSpawnLayer', `sceneSpawnLayer--${zone}`, className)}
      style={style}
    >
      {visible.map((entry) => (
        <span
          className={cn('sceneSprite', `sceneSprite--${entry.motion}`)}
          data-item={entry.itemId}
          key={entry.id}
          style={entry.style}
        >
          <span className="sceneSpritePop">
            <Image
              alt=""
              className={cn('sceneSpriteArt', `sceneSpriteArt--${entry.idle}`)}
              draggable={false}
              height={120}
              src={entry.asset}
              unoptimized
              width={120}
            />
            {entry.particles ? <SpriteParticles particles={entry.particles} /> : null}
          </span>
        </span>
      ))}
    </div>
  )
}
