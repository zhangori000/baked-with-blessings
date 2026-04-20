'use client'

import { cn } from '@/utilities/cn'
import { menuHref } from '@/utilities/routes'
import { MenuIcon, Search, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'

type Props = {
  cartQuantity: number
  items: Array<{
    id: string
    href: string
    isActive?: boolean
    label: string
    panel: {
      eyebrow: string
      description: string
    }
  }>
}

export function MobileMenu({ cartQuantity, items }: Props) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const closeMenu = useEffectEvent(() => {
    setIsOpen(false)
  })

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    closeMenu()
  }, [pathname])

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current || !event.target) return
      if (menuRef.current.contains(event.target as Node)) return
      setIsOpen(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown)

    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
    }
  }, [isOpen])

  return (
    <div className={cn('siteHeaderMobileMenu', isOpen && 'is-open')} ref={menuRef}>
      <div className="siteHeaderMobileControls">
        <Link
          aria-label="Search the menu"
          className="siteHeaderMobileIconButton"
          href={menuHref}
        >
          <Search className="h-4 w-4" />
        </Link>

        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          className="siteHeaderMobileIconButton"
          onClick={() => {
            setIsOpen((current) => !current)
          }}
          type="button"
        >
          {isOpen ? <X className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
        </button>

        <Link aria-label={`Cart with ${cartQuantity} items`} className="siteHeaderMobileBagCount" href="/checkout">
          [{cartQuantity}]
        </Link>
      </div>

      <div className={cn('siteHeaderMobilePanel', isOpen && 'is-open')}>
        <div className="siteHeaderMobilePanelCards">
          {items.map((item) => (
            <article className="siteHeaderMobileCard" key={item.id}>
              <div className="siteHeaderMobileCardCopy">
                <p className="siteHeaderMobileCardEyebrow">{item.panel.eyebrow}</p>
                <h3 className="siteHeaderMobileCardTitle">{item.label}</h3>
                <p className="siteHeaderMobileCardDescription">{item.panel.description}</p>
              </div>

              <Link
                aria-label={`Open ${item.label}`}
                className="siteHeaderMobileCardAction"
                href={item.href}
                onClick={() => {
                  setIsOpen(false)
                }}
              >
                <span className="siteHeaderMobileCardActionLabel">GO</span>
              </Link>
            </article>
          ))}
        </div>

        <div className="siteHeaderMobileTabs" role="tablist" aria-label="Mobile navigation tabs">
          {items.map((item) => (
            <Link
              className={cn('siteHeaderMobileTab', item.isActive && 'is-active')}
              href={item.href}
              key={`tab-${item.id}`}
              onClick={() => {
                setIsOpen(false)
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
