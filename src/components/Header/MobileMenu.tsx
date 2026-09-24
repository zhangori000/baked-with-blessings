'use client'

import {
  BakeryPressable,
  bakeryMediaQueries,
  useBakeryAnnouncer,
  useBakeryMediaQuery,
} from '@/design-system/bakery'
import { cn } from '@/utilities/cn'
import {
  AccountGlyph,
  AnnouncementsGlyph,
  BagGlyph,
  MenuGlyph,
} from './HeaderGlyphs'
import {
  appMenuFlowerTones,
  HeaderMenuCard,
  type HeaderMenuFlowerTone,
  mainMenuFlowerTones,
} from './HeaderMenuCard'
import { X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'

type Props = {
  accountButtonLabel: string
  cartQuantity: number
  hasUnseenAnnouncements: boolean
  isAccountOpen: boolean
  isAnnouncementsOpen: boolean
  onOpenAccount: () => void
  onOpenAnnouncements: (event?: { stopPropagation: () => void }) => void
  onOpenMenu: () => void
  onOpenCart: () => void
  items: Array<{
    id: string
    href: string
    isActive?: boolean
    kind?: 'link' | 'apps' | 'announcements'
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

export function MobileMenu({
  accountButtonLabel,
  cartQuantity,
  hasUnseenAnnouncements,
  isAccountOpen,
  isAnnouncementsOpen,
  items,
  onOpenAccount,
  onOpenAnnouncements,
  onOpenCart,
  onOpenMenu,
}: Props) {
  const pathname = usePathname()
  const { announce } = useBakeryAnnouncer()
  const isTabletUp = useBakeryMediaQuery(bakeryMediaQueries.tabletUp)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  // The announcements entry is represented by the megaphone icon button in
  // the controls row, not by a nav card.
  const mainItems = items.filter((item) => item.kind !== 'apps' && item.kind !== 'announcements')
  const appItems = items.filter((item) => item.kind === 'apps')
  const appCards = appItems.flatMap((item) =>
    (item.panel.cards ?? []).map((card) => ({
      card,
      item,
    })),
  )
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
      announce('Mobile navigation closed.')
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown)

    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
    }
  }, [announce, isOpen])

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
    tone: HeaderMenuFlowerTone
  }) => (
    <HeaderMenuCard
      description={description}
      eyebrow={eyebrow}
      href={href}
      key={key}
      onNavigate={() => {
        setIsOpen(false)
      }}
      title={title}
      tone={tone}
    />
  )

  return (
    <div className={cn('siteHeaderMobileMenu', isOpen && 'is-open')} ref={menuRef}>
      <div className="siteHeaderMobileControls">
        <BakeryPressable
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          className="siteHeaderMobileIconButton"
          onClick={() => {
            const nextOpen = !isOpen
            if (nextOpen) onOpenMenu()
            setIsOpen(nextOpen)
            announce(nextOpen ? 'Mobile navigation opened.' : 'Mobile navigation closed.')
          }}
          type="button"
        >
          {isOpen ? <X className="h-5 w-5" /> : <MenuGlyph className="h-5 w-5" />}
        </BakeryPressable>

        <BakeryPressable
          aria-expanded={isAnnouncementsOpen}
          aria-label={
            isAnnouncementsOpen
              ? 'Close announcements'
              : hasUnseenAnnouncements
                ? 'Open announcements. New announcements available'
                : 'Open announcements'
          }
          className="siteHeaderMobileIconButton siteHeaderMobileAnnouncementsButton"
          onClick={(event) => {
            event.stopPropagation()
            setIsOpen(false)
            onOpenAnnouncements(event)
          }}
          type="button"
        >
          <AnnouncementsGlyph className="h-5 w-5" />
          {hasUnseenAnnouncements ? (
            <span aria-hidden="true" className="siteHeaderNewDot" />
          ) : null}
        </BakeryPressable>

        <BakeryPressable
          aria-label={accountButtonLabel}
          className={cn('siteHeaderMobileIconButton siteHeaderMobileAccountButton', {
            'is-active': isAccountOpen,
          })}
          onClick={() => {
            setIsOpen(false)
            onOpenAccount()
          }}
          type="button"
        >
          <AccountGlyph className="h-5 w-5" />
        </BakeryPressable>

        <BakeryPressable
          aria-label={`Open cart with ${cartQuantity} items`}
          className="siteHeaderMobileBagButton"
          onClick={() => {
            setIsOpen(false)
            onOpenCart()
          }}
          type="button"
        >
          <BagGlyph className="siteHeaderMobileBagIcon h-5 w-5" />
          <span className="siteHeaderMobileBagCount">[{cartQuantity}]</span>
        </BakeryPressable>
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
              tone: mainMenuFlowerTones[index % mainMenuFlowerTones.length],
            }),
          )}

          {appCards.length ? (
            <div className="siteHeaderMenuSectionDivider" role="separator">
              <span>Apps</span>
            </div>
          ) : null}

          {appCards.length ? (
            <div className="siteHeaderMobileAppScroller" aria-label="Other pages">
              {appCards.map(({ card, item }, index) =>
                renderCard({
                  description: card.description,
                  eyebrow: card.eyebrow,
                  href: card.href,
                  key: `${item.id}-${card.href}`,
                  title: card.title,
                  tone: appMenuFlowerTones[index % appMenuFlowerTones.length],
                }),
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
