'use client'

import {
  BakeryAction,
  BakeryCard,
  BakeryPressable,
  bakeryMediaQueries,
  useBakeryAnnouncer,
  useBakeryMediaQuery,
} from '@/design-system/bakery'
import { cn } from '@/utilities/cn'
import { Megaphone, MenuIcon, ShoppingBag, UserRound, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'

type Props = {
  accountButtonLabel: string
  cartQuantity: number
  hasUnseenAnnouncements: boolean
  isAccountOpen: boolean
  onOpenAccount: () => void
  onOpenAnnouncements: () => void
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

type MobileFlowerTone = 'orange' | 'plum' | 'rose' | 'sage' | 'sunflower'

const mainCardFlowerTones: MobileFlowerTone[] = ['orange', 'sage']
const appCardFlowerTones: MobileFlowerTone[] = ['rose', 'sunflower', 'plum']

export function MobileMenu({
  accountButtonLabel,
  cartQuantity,
  hasUnseenAnnouncements,
  isAccountOpen,
  items,
  onOpenAccount,
  onOpenAnnouncements,
  onOpenCart,
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
    tone: MobileFlowerTone
  }) => (
    <BakeryCard
      as="article"
      className="siteHeaderMobileCard"
      data-flower-tone={tone}
      key={key}
      radius="lg"
      spacing="none"
      tone="transparent"
    >
      <div className="siteHeaderMobileCardCopy">
        <p className="siteHeaderMobileCardEyebrow">{eyebrow}</p>
        <h3 className="siteHeaderMobileCardTitle">{title}</h3>
        <p className="siteHeaderMobileCardDescription">{description}</p>
      </div>

      <BakeryAction
        as={Link}
        aria-label={`Open ${title}`}
        className="siteHeaderMobileCardAction"
        href={href}
        onClick={() => {
          setIsOpen(false)
        }}
        size="sm"
        variant="secondary"
      >
        <span className="siteHeaderMobileCardActionLabel">GO</span>
      </BakeryAction>
    </BakeryCard>
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
            setIsOpen(nextOpen)
            announce(nextOpen ? 'Mobile navigation opened.' : 'Mobile navigation closed.')
          }}
          type="button"
        >
          {isOpen ? <X className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
        </BakeryPressable>

        <BakeryPressable
          aria-label={
            hasUnseenAnnouncements
              ? 'Open announcements. New announcements available'
              : 'Open announcements'
          }
          className="siteHeaderMobileIconButton siteHeaderMobileAnnouncementsButton"
          onClick={() => {
            setIsOpen(false)
            onOpenAnnouncements()
          }}
          type="button"
        >
          <Megaphone className="h-4 w-4" />
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
          <UserRound className="h-4 w-4" />
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
          <ShoppingBag className="siteHeaderMobileBagIcon h-4 w-4" />
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
              tone: mainCardFlowerTones[index % mainCardFlowerTones.length],
            }),
          )}

          {appCards.length ? (
            <div className="siteHeaderMobileSectionDivider" role="separator">
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
                  tone: appCardFlowerTones[index % appCardFlowerTones.length],
                }),
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
