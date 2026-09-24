'use client'

import { type RefObject, useEffect } from 'react'

export const getOverlayRoot = () =>
  document.querySelector<HTMLElement>('.bakeryThemeRoot') ?? document.body

export const useOverlayDismiss = ({
  focusRef,
  isOpen,
  onClose,
}: {
  focusRef: RefObject<HTMLElement | null>
  isOpen: boolean
  onClose: () => void
}) => {
  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const scroller = document.documentElement
    const previousOverflow = scroller.style.overflow
    scroller.style.overflow = 'hidden'
    focusRef.current?.focus({ preventScroll: true })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      scroller.style.overflow = previousOverflow
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [focusRef, isOpen, onClose])
}
