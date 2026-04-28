'use client'

import { bakeryMediaQueries, useBakeryMediaQuery } from '@/design-system/bakery'
import { cn } from '@/utilities/cn'
import { MenuIcon, ShoppingBag, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'

type Props = {
  cartQuantity: number
  onOpenCart: () => void
  items: Array<{
    id: string
    href: string
    isActive?: boolean
    kind?: 'link' | 'apps'
    label: string
    panel: {
      eyebrow: string
      description: string
      cards?: Array<{
        description: string
        eyebrow: string
        href: string
        title: string
      }>
    }
  }>
}

type MobileFlowerTone = 'orange' | 'plum' | 'rose' | 'sage' | 'sunflower'

const mainCardFlowerTones: MobileFlowerTone[] = ['orange', 'sage']
const appCardFlowerTones: MobileFlowerTone[] = ['rose', 'sunflower', 'plum']

export function MobileMenu({ cartQuantity, items, onOpenCart }: Props) {
  const pathname = usePathname()
  const isTabletUp = useBakeryMediaQuery(bakeryMediaQueries.tabletUp)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const mainItems = items.filter((item) => item.kind !== 'apps')
  const appItems = items.filter((item) => item.kind === 'apps')
  const closeMenu = useEffectEvent(() => {
    setIsOpen(false)
  })

  useEffect(() => {
    if (isTabletUp) closeMenu()
  }, [isTabletUp])

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

  const renderCard = ({
    description,
    eyebrow,
    href,
    key,
    title,
    tone,
  }: {
    description: string
    eyebrow: string
    href: string
    key: string
    title: string
    tone: MobileFlowerTone
  }) => (
    <article className="siteHeaderMobileCard" data-flower-tone={tone} key={key}>
      <div className="siteHeaderMobileCardCopy">
        <p className="siteHeaderMobileCardEyebrow">{eyebrow}</p>
        <h3 className="siteHeaderMobileCardTitle">{title}</h3>
        <p className="siteHeaderMobileCardDescription">{description}</p>
      </div>

      <Link
        aria-label={`Open ${title}`}
        className="siteHeaderMobileCardAction"
        href={href}
        onClick={() => {
          setIsOpen(false)
        }}
      >
        <span className="siteHeaderMobileCardActionLabel">GO</span>
      </Link>
    </article>
  )

  return (
    <div className={cn('siteHeaderMobileMenu', isOpen && 'is-open')} ref={menuRef}>
      <div className="siteHeaderMobileControls">
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

        <button
          aria-label={`Open cart with ${cartQuantity} items`}
          className="siteHeaderMobileBagButton"
          onClick={() => {
            setIsOpen(false)
            onOpenCart()
          }}
          type="button"
        >
          <ShoppingBag className="siteHeaderMobileBagIcon h-4 w-4" />
          <span className="siteHeaderMobileBagCount">[{cartQuantity}]</span>
        </button>
      </div>

      <div className={cn('siteHeaderMobilePanel', isOpen && 'is-open')}>
        <div className="siteHeaderMobilePanelCards">
          {mainItems.map((item, index) =>
            renderCard({
              description: item.panel.description,
              eyebrow: item.panel.eyebrow,
              href: item.href,
              key: item.id,
              title: item.label,
              tone: mainCardFlowerTones[index % mainCardFlowerTones.length],
            }),
          )}

          {appItems.length ? (
            <div className="siteHeaderMobileSectionDivider" role="separator">
              <span>Other pages</span>
            </div>
          ) : null}

          {appItems.flatMap((item) =>
            (item.panel.cards?.length
              ? item.panel.cards
              : [
                  {
                    description: item.panel.description,
                    eyebrow: item.panel.eyebrow,
                    href: item.href,
                    title: item.label,
                  },
                ]
            ).map((card, index) =>
              renderCard({
                description: card.description,
                eyebrow: card.eyebrow,
                href: card.href,
                key: `${item.id}-${card.href}`,
                title: card.title,
                tone: appCardFlowerTones[index % appCardFlowerTones.length],
              }),
            ),
          )}
        </div>
      </div>
    </div>
  )
}
