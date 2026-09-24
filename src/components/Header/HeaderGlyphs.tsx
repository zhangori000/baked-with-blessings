'use client'

import { useId } from 'react'

import { cn } from '@/utilities/cn'

type GlyphProps = {
  className?: string
}

const svgProps = {
  fill: 'none',
  viewBox: '0 0 24 24',
  'aria-hidden': true as const,
}

export function MenuGlyph({ className }: GlyphProps) {
  return (
    <svg className={cn('siteHeaderGlyph', className)} {...svgProps}>
      <path
        d="M4.5 7.2h15M6.2 12h11.6M4.5 16.8h15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.15"
      />
    </svg>
  )
}

export function AnnouncementsGlyph({ className }: GlyphProps) {
  return (
    <svg className={cn('siteHeaderGlyph', className)} {...svgProps}>
      <path
        d="M4.2 7.2h15.6v10.2c0 .7-.5 1.2-1.2 1.2H5.4c-.7 0-1.2-.5-1.2-1.2V7.2Z"
        fill="currentColor"
      />
      <path
        d="M4.6 7.6 12 13.1 19.4 7.6"
        fill="none"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

export function PinGlyph({ className }: GlyphProps) {
  return (
    <svg className={cn('siteHeaderGlyph', className)} {...svgProps}>
      <path
        d="M12 3.4c2.15 0 3.9 1.65 3.9 3.7 0 2.7-3.9 7.3-3.9 7.3S8.1 9.8 8.1 7.1c0-2.05 1.75-3.7 3.9-3.7Z"
        fill="currentColor"
      />
      <circle cx="12" cy="7.1" r="1.25" fill="#fff" />
      <path d="M12 14.2v5.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.05" />
    </svg>
  )
}

export function AccountGlyph({ className }: GlyphProps) {
  return (
    <svg className={cn('siteHeaderGlyph', className)} {...svgProps}>
      <circle cx="12" cy="8.2" r="3.35" fill="currentColor" />
      <path
        d="M5.2 19.1c.7-3.35 3.15-5.1 6.8-5.1s6.1 1.75 6.8 5.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.15"
      />
    </svg>
  )
}

export function BagGlyph({ className }: GlyphProps) {
  return (
    <svg className={cn('siteHeaderGlyph', className)} {...svgProps}>
      <path
        d="M7.1 8.4h9.8l.85 10.1c.08.9-.62 1.7-1.52 1.7H7.77c-.9 0-1.6-.8-1.52-1.7L7.1 8.4Z"
        fill="currentColor"
      />
      <path
        d="M9 8.2V7.1A3 3 0 0 1 12 4.1 3 3 0 0 1 15 7.1v1.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="13.6" r="1.35" fill="#fff" />
    </svg>
  )
}

export function BackGlyph({ className }: GlyphProps) {
  return (
    <svg className={cn('siteHeaderGlyph', className)} {...svgProps}>
      <path
        d="M14.2 5.8 7.6 12l6.6 6.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.15"
      />
    </svg>
  )
}

export function InboxHeartGlyph({ className }: GlyphProps) {
  const fillId = useId()

  return (
    <svg className={cn('siteHeaderGlyph', className)} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#f04cc4" />
          <stop offset="100%" stopColor="#ff6a4a" />
        </linearGradient>
      </defs>
      <circle cx="10" cy="12" r="7.2" fill={`url(#${fillId})`} />
      <circle cx="20.2" cy="12" r="7.2" fill={`url(#${fillId})`} />
      <path fill={`url(#${fillId})`} d="M4.2 15.2 Q16 32 26.2 15.2" />
    </svg>
  )
}

export function InboxCookieGlyph({ className }: GlyphProps) {
  return (
    <svg className={cn('siteHeaderGlyph', className)} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="#e7b56a" />
      <circle cx="12" cy="13" r="1.7" fill="#6b3a1e" />
      <circle cx="20" cy="12.5" r="1.4" fill="#6b3a1e" />
      <circle cx="15.5" cy="19" r="1.6" fill="#6b3a1e" />
      <circle cx="21" cy="19.5" r="1.2" fill="#6b3a1e" />
      <circle cx="11.2" cy="18.2" r="1.1" fill="#6b3a1e" />
    </svg>
  )
}
