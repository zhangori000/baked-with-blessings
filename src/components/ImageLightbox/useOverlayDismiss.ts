'use client'

import { type RefObject, useEffect } from 'react'

export const getOverlayRoot = () =>
  document.querySelector<HTMLElement>('.bakeryThemeRoot') ?? document.body

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const getFocusable = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.getClientRects().length > 0,
  )

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
        return
      }

      if (event.key !== 'Tab') return

      const dialog = focusRef.current?.closest<HTMLElement>('[role="dialog"]')
      if (!dialog) return

      const focusable = getFocusable(dialog)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null
      const isInside = active ? dialog.contains(active) : false

      if (event.shiftKey && (!isInside || active === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!isInside || active === last)) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      scroller.style.overflow = previousOverflow
      if (
        previouslyFocused &&
        previouslyFocused !== document.body &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [focusRef, isOpen, onClose])
}
