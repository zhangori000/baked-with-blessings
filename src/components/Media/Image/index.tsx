'use client'

import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/cn'
import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '../types'

import { cssVariables } from '@/cssVariables'
import { isPayloadMediaFileURL, withPayloadMediaCacheTag } from '@/utilities/resolveMediaDisplayURL'

const { breakpoints } = cssVariables
const sameOriginServerURL = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '')

const normalizeImageSrc = (value: string) => {
  if (!value) return value

  if (sameOriginServerURL && value.startsWith(sameOriginServerURL)) {
    const relativePath = value.slice(sameOriginServerURL.length)
    return relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  }

  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value
  }

  return `/${value.replace(/^\/+/, '')}`
}

const resolveResourceImage = (resource: Exclude<MediaProps['resource'], string | number | undefined>) => {
  return (
    resource.sizes?.tablet ??
    resource.sizes?.poster ??
    resource.sizes?.card ??
    resource.sizes?.thumbnail ??
    null
  )
}

export const Image: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill,
    fullResolution,
    height: heightFromProps,
    imgClassName,
    onClick,
    onLoad: onLoadFromProps,
    priority,
    resource,
    size: sizeFromProps,
    src: srcFromProps,
    unoptimized,
    width: widthFromProps,
  } = props

  let width: number | undefined | null
  let height: number | undefined | null
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''

  if (typeof src === 'string') {
    src = normalizeImageSrc(src)
  }

  if (!src && resource && typeof resource === 'object') {
    const {
      alt: altFromResource,
      height: fullHeight,
      url,
      width: fullWidth,
    } = resource
    // fullResolution: hand the original to the Next optimizer (below) so it can
    // emit a sharp, right-sized image for high-DPR screens. Otherwise use
    // Payload's largest pre-generated variant (max 1024px wide).
    const sizedImage = fullResolution ? null : resolveResourceImage(resource)

    width = widthFromProps ?? sizedImage?.width ?? fullWidth
    height = heightFromProps ?? sizedImage?.height ?? fullHeight
    alt = altFromResource

    src = normalizeImageSrc(
      withPayloadMediaCacheTag({ media: resource, url: sizedImage?.url || url || '' }) || '',
    )
  }

  // Payload's pre-sized variants are served as-is (no Next optimization). For
  // fullResolution we DO want Next to optimize the original down to the
  // displayed size, so only bypass the optimizer when not opting in.
  const shouldBypassOptimizer =
    typeof src === 'string' && isPayloadMediaFileURL(src) && !fullResolution

  // NOTE: this is used by the browser to determine which image to download at different screen sizes
  const sizes = sizeFromProps
    ? sizeFromProps
    : Object.entries(breakpoints)
        .map(([, value]) => `(max-width: ${value}px) ${value}px`)
        .join(', ')

  return (
    <NextImage
      alt={alt || ''}
      className={cn(imgClassName)}
      fill={fill}
      height={!fill ? height || heightFromProps : undefined}
      onClick={onClick}
      onLoad={() => {
        if (typeof onLoadFromProps === 'function') {
          onLoadFromProps()
        }
      }}
      priority={priority}
      quality={90}
      sizes={sizes}
      src={src}
      unoptimized={unoptimized || shouldBypassOptimizer}
      width={!fill ? width || widthFromProps : undefined}
    />
  )
}
