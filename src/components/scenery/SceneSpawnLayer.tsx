'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'

import { cn } from '@/utilities/cn'

import type { SceneSprite, SpawnMotion } from './spawnables'

import './scene-spawn.css'

const groundMotions: ReadonlySet<SpawnMotion> = new Set(['hop', 'sprout'])

type SceneSpawnLayerProps = {
  className?: string
  sprites: readonly SceneSprite[]
  style?: CSSProperties
  zone: 'ground' | 'sky'
}

export function SceneSpawnLayer({ className, sprites, style, zone }: SceneSpawnLayerProps) {
  const visible = sprites.filter((entry) => groundMotions.has(entry.motion) === (zone === 'ground'))

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
          </span>
        </span>
      ))}
    </div>
  )
}
