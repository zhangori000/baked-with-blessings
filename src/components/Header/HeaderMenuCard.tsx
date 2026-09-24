'use client'

import { BakeryAction, BakeryCard } from '@/design-system/bakery'
import Link from 'next/link'
import React from 'react'

export type HeaderMenuFlowerTone = 'orange' | 'plum' | 'rose' | 'sage' | 'sunflower'

export const mainMenuFlowerTones: HeaderMenuFlowerTone[] = ['orange', 'sage']
export const appMenuFlowerTones: HeaderMenuFlowerTone[] = ['rose', 'sunflower', 'plum']

type Props = {
  description: string
  eyebrow: string
  href: string
  onNavigate?: () => void
  title: string
  tone: HeaderMenuFlowerTone
}

export function HeaderMenuCard({ description, eyebrow, href, onNavigate, title, tone }: Props) {
  return (
    <BakeryCard
      as="article"
      className="siteHeaderMenuCard"
      data-flower-tone={tone}
      radius="lg"
      spacing="none"
      tone="transparent"
    >
      <div className="siteHeaderMenuCardCopy">
        <p className="siteHeaderMenuCardEyebrow">{eyebrow}</p>
        <h3 className="siteHeaderMenuCardTitle">{title}</h3>
        <p className="siteHeaderMenuCardDescription">{description}</p>
      </div>

      <BakeryAction
        as={Link}
        aria-label={`Open ${title}`}
        className="siteHeaderMenuCardAction"
        href={href}
        onClick={onNavigate}
        size="sm"
        variant="secondary"
      >
        <span className="siteHeaderMenuCardActionLabel">GO</span>
      </BakeryAction>
    </BakeryCard>
  )
}
