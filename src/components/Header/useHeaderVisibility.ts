'use client'

import { useEffect, useState } from 'react'

const STICKY_SCROLL_OFFSET = 120

export const useHeaderVisibility = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const isHidden = false

  useEffect(() => {
    let animationFrame = 0

    const updateVisibility = () => {
      const currentScrollY = window.scrollY

      setIsScrolled(currentScrollY > STICKY_SCROLL_OFFSET)
      animationFrame = 0
    }

    const handleScroll = () => {
      if (animationFrame !== 0) return

      animationFrame = window.requestAnimationFrame(updateVisibility)
    }

    updateVisibility()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame)
      }

      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return {
    isHidden,
    isScrolled,
  }
}
