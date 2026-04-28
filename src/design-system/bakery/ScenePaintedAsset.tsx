'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'

import { cn } from '@/utilities/cn'

import {
  ScenePainterManager,
  type SceneAssetLayer,
  type SceneAssetMotion,
} from './ScenePainterManager'
import type { BakeryColorRole } from './styleProps'

type ScenePaintedAssetProps = {
  alt?: string
  asset: string
  centerRole?: BakeryColorRole
  className?: string
  decorative?: boolean
  fill?: boolean
  fit?: 'contain' | 'cover'
  glowRole?: BakeryColorRole
  height?: number
  layer?: SceneAssetLayer
  mobileAsset?: string
  motion?: SceneAssetMotion
  paintMode?: 'image' | 'mask'
  petalRole?: BakeryColorRole
  priority?: boolean
  sizes?: string
  style?: CSSProperties
  width?: number
}

export const ScenePaintedAsset = ({
  alt,
  asset,
  centerRole,
  className,
  decorative = true,
  fill = false,
  fit = 'contain',
  glowRole,
  height = 320,
  layer = 'content',
  mobileAsset,
  motion = 'none',
  paintMode = 'image',
  petalRole,
  priority = false,
  sizes = '100vw',
  style,
  width = 320,
}: ScenePaintedAssetProps) => {
  const sharedStyle = {
    ...ScenePainterManager.getLayerStyle(layer),
    ...ScenePainterManager.getMotionStyle(motion),
    ...ScenePainterManager.getPaintVars({ centerRole, glowRole, petalRole }),
    ...style,
  }

  if (paintMode === 'mask') {
    return (
      <span
        aria-hidden={decorative || undefined}
        className={cn('bakeryScenePaintedAsset', 'bakeryScenePaintedAsset-mask', className)}
        role={decorative ? undefined : 'img'}
        style={{
          ...sharedStyle,
          ...ScenePainterManager.getMaskPaintStyle(asset, petalRole),
          display: 'inline-block',
          height,
          width,
        }}
      />
    )
  }

  const image = (
    <Image
      alt={decorative ? '' : (alt ?? '')}
      aria-hidden={decorative || undefined}
      className={cn(
        'bakeryScenePaintedAssetImage',
        fit === 'cover' ? 'object-cover' : 'object-contain',
      )}
      fill={fill}
      height={fill ? undefined : height}
      priority={priority}
      sizes={sizes}
      src={asset}
      unoptimized
      width={fill ? undefined : width}
    />
  )

  return (
    <span
      aria-hidden={decorative || undefined}
      className={cn('bakeryScenePaintedAsset', className)}
      style={{
        ...sharedStyle,
        display: 'inline-block',
        height: fill ? undefined : height,
        position: fill ? 'absolute' : sharedStyle.position,
        width: fill ? undefined : width,
      }}
    >
      {mobileAsset ? (
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileAsset} />
          {image}
        </picture>
      ) : (
        image
      )}
    </span>
  )
}
