import type { StaticImageData } from 'next/image'
import type { ElementType, Ref } from 'react'

import type { Media as MediaType } from '@/payload-types'

export interface Props {
  alt?: string
  className?: string
  fill?: boolean // for NextImage only
  /**
   * Serve the original upload and let the Next optimizer downscale it, instead
   * of using Payload's largest pre-generated variant (1024px wide). Use for
   * focal/hero imagery that must stay crisp on high-DPR screens (e.g. iPhone
   * DPR 3), where the small variant gets visibly upscaled.
   */
  fullResolution?: boolean
  height?: number
  htmlElement?: ElementType | null
  imgClassName?: string
  onClick?: () => void
  onLoad?: () => void
  priority?: boolean // for NextImage only
  ref?: Ref<HTMLImageElement | HTMLVideoElement | null>
  resource?: MediaType | string | number // for Payload media
  size?: string // for NextImage only
  src?: StaticImageData // for static media
  unoptimized?: boolean // for NextImage only
  videoClassName?: string
  width?: number
}
