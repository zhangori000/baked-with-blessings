'use client'

import type { SceneTone } from '@/components/scenery/menuHeroScenery'

import { CMSLink } from '@/components/Link'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import { Instagram, Linkedin } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type FooterLinkItem = {
  id?: string | null
  link: Record<string, unknown>
}

type FooterBrand = {
  brandName: string
  logoAlt: string
  logoUrl: string
}

type FooterClientProps = {
  brand: FooterBrand
  copyrightName: string
  currentYear: number
  navItems: FooterLinkItem[]
}

const footerPaletteByScene: Record<
  SceneTone,
  {
    shell: string
    panel: string
    text: string
    muted: string
    border: string
    icon: string
    iconBg: string
  }
> = {
  dawn: {
    shell: 'linear-gradient(180deg, #7cc3e8 0%, #c5dff0 50%, #f5d5d8 80%, #f8e4c8 100%)',
    panel: 'rgba(255, 251, 239, 0.84)',
    text: '#5b4716',
    muted: 'rgba(91, 71, 22, 0.72)',
    border: 'rgba(143, 115, 39, 0.18)',
    icon: '#7a5812',
    iconBg: 'rgba(255, 239, 183, 0.88)',
  },
  'under-tree': {
    shell: 'linear-gradient(180deg, #2a7fc4 0%, #67a7db 62%, #a8d0ea 100%)',
    panel: 'rgba(255, 249, 237, 0.82)',
    text: '#324520',
    muted: 'rgba(50, 69, 32, 0.7)',
    border: 'rgba(62, 87, 51, 0.16)',
    icon: '#3c5325',
    iconBg: 'rgba(245, 235, 205, 0.88)',
  },
  moonlit: {
    shell: 'linear-gradient(180deg, #0a1540 0%, #1a3060 40%, #2a6878 70%, #3a9880 100%)',
    panel: 'rgba(20, 31, 70, 0.78)',
    text: '#f6f1ff',
    muted: 'rgba(246, 241, 255, 0.72)',
    border: 'rgba(214, 206, 255, 0.14)',
    icon: '#faf7ff',
    iconBg: 'rgba(119, 102, 210, 0.3)',
  },
  classic: {
    shell: 'linear-gradient(180deg, #8ec9f0 0%, #cfeafd 62%, #f8f8eb 100%)',
    panel: 'rgba(248, 252, 255, 0.8)',
    text: '#1c3d29',
    muted: 'rgba(28, 61, 41, 0.62)',
    border: 'rgba(44, 88, 62, 0.12)',
    icon: '#21492d',
    iconBg: 'rgba(228, 245, 235, 0.92)',
  },
  blossom: {
    shell: 'linear-gradient(180deg, #aee1f0 0%, #d7eef6 65%, #eef8fb 100%)',
    panel: 'rgba(255, 247, 251, 0.82)',
    text: '#63385b',
    muted: 'rgba(99, 56, 91, 0.68)',
    border: 'rgba(121, 74, 113, 0.12)',
    icon: '#834679',
    iconBg: 'rgba(255, 226, 237, 0.9)',
  },
  'fairy-castle': {
    shell: 'linear-gradient(180deg, #4d91d8 0%, #bfe3f3 100%)',
    panel: 'rgba(250, 246, 232, 0.84)',
    text: '#4c5630',
    muted: 'rgba(76, 86, 48, 0.7)',
    border: 'rgba(93, 104, 60, 0.15)',
    icon: '#5e6940',
    iconBg: 'rgba(238, 231, 206, 0.92)',
  },
}

function TikTokIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M14.75 3c.45 2.34 1.8 4 4.25 4.33v2.74c-1.7.05-3.17-.44-4.49-1.35v5.89c0 3.55-2.08 6.39-6.21 6.39A5.8 5.8 0 0 1 2.5 15.2c0-3.12 2.3-5.83 5.95-5.83.57 0 1.02.05 1.48.2v2.96a3.42 3.42 0 0 0-1.4-.28c-1.67 0-2.92 1.18-2.92 2.82 0 1.77 1.1 3.02 2.77 3.02 2.03 0 2.88-1.35 2.88-3.29V3h3.49Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function FooterClient({
  brand,
  copyrightName,
  currentYear,
  navItems,
}: FooterClientProps) {
  const [sceneTone] = usePersistentMenuSceneTone()
  const palette = footerPaletteByScene[sceneTone]

  const socialLinks = [
    {
      href: 'https://www.linkedin.com/',
      icon: Linkedin,
      label: 'LinkedIn',
    },
    {
      href: 'https://www.instagram.com/',
      icon: Instagram,
      label: 'Instagram',
    },
    {
      href: 'https://www.tiktok.com/',
      icon: TikTokIcon,
      label: 'TikTok',
    },
  ]

  return (
    <footer className="px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5 md:px-6 md:pb-6 md:pt-6" style={{ background: palette.shell }}>
      <div
        className="mx-auto max-w-[1400px] rounded-[1.75rem] border px-4 py-4 shadow-[0_18px_42px_rgba(22,18,10,0.08)] sm:px-5 sm:py-5 md:px-6 md:py-5"
        style={{
          backgroundColor: palette.panel,
          borderColor: palette.border,
          color: palette.text,
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <Link aria-label={brand.brandName} className="shrink-0" href="/">
              <img
                alt={brand.logoAlt}
                className="h-auto w-[8.25rem] object-contain sm:w-[9rem] md:w-[10rem]"
                loading="eager"
                src={brand.logoUrl}
              />
            </Link>

            <p className="hidden text-[0.92rem] leading-relaxed md:block" style={{ color: palette.muted }}>
              Fresh bakes, rotating scenes, and cookie-sheep energy.
            </p>
          </div>

          <nav aria-label="Footer links" className="min-w-0 md:flex-1 md:justify-center">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[0.98rem] font-semibold tracking-[-0.02em] md:justify-center">
              {navItems.map((item, index) => {
                const linkProps =
                  item.link && typeof item.link === 'object'
                    ? (item.link as Record<string, unknown>)
                    : {}

                return (
                  <li key={item.id ?? `footer-link-${index}`}>
                    <CMSLink
                      appearance="link"
                      className="inline-flex transition hover:opacity-70"
                      {...(linkProps as any)}
                    />
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2 md:justify-end">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:-translate-y-0.5"
                href={href}
                key={label}
                rel="noreferrer"
                style={{ backgroundColor: palette.iconBg, color: palette.icon }}
                target="_blank"
              >
                <Icon className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </div>

        <div
          className="mt-4 flex flex-col gap-2 border-t pt-3 text-[0.82rem] sm:text-[0.86rem] md:flex-row md:items-center md:justify-between"
          style={{ borderColor: palette.border, color: palette.muted }}
        >
          <p>
            &copy; {currentYear} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link className="transition hover:opacity-70" href="/account">
              Account
            </Link>
            <Link className="transition hover:opacity-70" href="/menu">
              Menu
            </Link>
            <Link className="transition hover:opacity-70" href="/contact">
              Contact
            </Link>
            <a
              className="transition hover:opacity-70"
              href="https://payloadcms.com"
              rel="noreferrer"
              target="_blank"
            >
              Credits
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
