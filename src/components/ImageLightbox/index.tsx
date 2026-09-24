'use client'

import { X } from 'lucide-react'
import NextImage from 'next/image'
import { useRef } from 'react'
import { createPortal } from 'react-dom'

import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'

import { getOverlayRoot, useOverlayDismiss } from './useOverlayDismiss'
import './image-lightbox.css'

export type ImageLightboxItem = {
  fallbackSrc?: string
  image?: MediaType | null
  title: string
}

export function ImageLightbox({
  item,
  onClose,
}: {
  item: ImageLightboxItem | null
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useOverlayDismiss({ focusRef: closeRef, isOpen: Boolean(item), onClose })

  if (!item || typeof document === 'undefined') return null

  return createPortal(
    <div
      aria-label={`${item.title}, enlarged`}
      aria-modal="true"
      className="imageLightbox"
      onClick={onClose}
      role="dialog"
    >
      <button
        aria-label="Close enlarged image"
        className="imageLightboxClose"
        onClick={onClose}
        ref={closeRef}
        type="button"
      >
        <X aria-hidden="true" className="h-5 w-5" />
      </button>
      <figure className="imageLightboxFigure">
        <div className="imageLightboxFrame">
          {item.image ? (
            <Media
              fill
              fullResolution
              htmlElement={null}
              imgClassName="imageLightboxImage"
              resource={item.image}
              size="(max-width: 768px) 92vw, 70vh"
            />
          ) : item.fallbackSrc ? (
            <NextImage
              alt={`${item.title} cookie`}
              className="imageLightboxImage"
              fill
              sizes="(max-width: 768px) 92vw, 70vh"
              src={item.fallbackSrc}
              unoptimized
            />
          ) : null}
        </div>
        <figcaption className="imageLightboxCaption">{item.title}</figcaption>
      </figure>
    </div>,
    getOverlayRoot(),
  )
}
