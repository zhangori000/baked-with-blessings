'use client'

import type { SceneTone } from '@/components/scenery/menuHeroScenery'

import { CMSLink } from '@/components/Link'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import { Instagram, Linkedin } from 'lucide-react'
import Image from 'next/image'
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
    accent: string
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
    accent: '#ffe8a3',
    icon: '#7a5812',
    iconBg: 'rgba(255, 239, 183, 0.88)',
  },
  'under-tree': {
    shell: 'linear-gradient(180deg, #2a7fc4 0%, #67a7db 62%, #a8d0ea 100%)',
    panel: 'rgba(255, 249, 237, 0.82)',
    text: '#324520',
    muted: 'rgba(50, 69, 32, 0.7)',
    border: 'rgba(62, 87, 51, 0.16)',
    accent: '#d9f0b5',
    icon: '#3c5325',
    iconBg: 'rgba(245, 235, 205, 0.88)',
  },
  moonlit: {
    shell: 'linear-gradient(180deg, #0a1540 0%, #1a3060 40%, #2a6878 70%, #3a9880 100%)',
    panel: 'rgba(20, 31, 70, 0.78)',
    text: '#f6f1ff',
    muted: 'rgba(246, 241, 255, 0.72)',
    border: 'rgba(214, 206, 255, 0.14)',
    accent: '#8976ff',
    icon: '#faf7ff',
    iconBg: 'rgba(119, 102, 210, 0.3)',
  },
  classic: {
    shell: 'linear-gradient(180deg, #8ec9f0 0%, #cfeafd 62%, #f8f8eb 100%)',
    panel: 'rgba(248, 252, 255, 0.8)',
    text: '#1c3d29',
    muted: 'rgba(28, 61, 41, 0.62)',
    border: 'rgba(44, 88, 62, 0.12)',
    accent: '#d6f1c5',
    icon: '#21492d',
    iconBg: 'rgba(228, 245, 235, 0.92)',
  },
  blossom: {
    shell: 'linear-gradient(180deg, #aee1f0 0%, #d7eef6 65%, #eef8fb 100%)',
    panel: 'rgba(255, 247, 251, 0.82)',
    text: '#63385b',
    muted: 'rgba(99, 56, 91, 0.68)',
    border: 'rgba(121, 74, 113, 0.12)',
    accent: '#ffd6ea',
    icon: '#834679',
    iconBg: 'rgba(255, 226, 237, 0.9)',
  },
  'fairy-castle': {
    shell: 'linear-gradient(180deg, #4d91d8 0%, #bfe3f3 100%)',
    panel: 'rgba(250, 246, 232, 0.84)',
    text: '#4c5630',
    muted: 'rgba(76, 86, 48, 0.7)',
    border: 'rgba(93, 104, 60, 0.15)',
    accent: '#e7e0b3',
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
    <footer
      className="px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5 md:px-6 md:pb-6 md:pt-6"
      style={{ background: palette.shell }}
    >
      <div
        className="mx-auto max-w-[1400px] rounded-[2rem] border px-4 py-4 shadow-[0_18px_42px_rgba(22,18,10,0.08)] sm:px-5 sm:py-5 md:px-6 md:py-6"
        style={{
          backgroundColor: palette.panel,
          borderColor: palette.border,
          color: palette.text,
        }}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <section
            className="rounded-[1.6rem] border p-5 sm:p-6"
            style={{
              background:
                sceneTone === 'moonlit'
                  ? 'linear-gradient(135deg, rgba(20,31,70,0.72), rgba(35,63,104,0.58))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.52), rgba(255,255,255,0.16))',
              borderColor: palette.border,
            }}
          >
            <p
              className="text-[0.68rem] font-semibold uppercase tracking-[0.24em]"
              style={{ color: palette.muted }}
            >
              Baked With Blessings
            </p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-4">
                <Link aria-label={brand.brandName} className="block shrink-0" href="/">
                  <Image
                    alt={brand.logoAlt}
                    className="h-auto w-[9rem] object-contain sm:w-[10.5rem] md:w-[11rem]"
                    height={64}
                    loading="eager"
                    src={brand.logoUrl}
                    unoptimized
                    width={176}
                  />
                </Link>

                <div className="max-w-[28rem] space-y-2">
                  <p className="text-[1.45rem] leading-[1.02] tracking-[-0.04em] sm:text-[1.8rem]">
                    Fresh cookie trays, honest portions, and a storefront that still feels handmade.
                  </p>
                  <p className="max-w-[24rem] text-[0.96rem] leading-7" style={{ color: palette.muted }}>
                    The custom mixed tray will come later. For now, we are keeping it clean:
                    one flavor, one full tray, one less thing to second-guess.
                  </p>
                </div>
              </div>

              <div
                className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.18em]"
                style={{
                  backgroundColor: palette.accent,
                  borderColor: palette.border,
                  color: palette.text,
                }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />
                Designed for group orders
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div
              className="rounded-[1.6rem] border p-5"
              style={{
                background:
                  sceneTone === 'moonlit'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.42)',
                borderColor: palette.border,
              }}
            >
              <p
                className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
                style={{ color: palette.muted }}
              >
                Browse fast
              </p>
              <nav aria-label="Footer links" className="mt-3">
                <ul className="flex flex-wrap gap-2">
                  {navItems.map((item, index) => {
                    const linkProps =
                      item.link && typeof item.link === 'object'
                        ? (item.link as Record<string, unknown>)
                        : {}
                    const footerLinkProps = linkProps as React.ComponentProps<typeof CMSLink>

                    return (
                      <li key={item.id ?? `footer-link-${index}`}>
                        <CMSLink
                          appearance="link"
                          className="inline-flex rounded-full border px-3 py-2 text-[0.9rem] font-semibold tracking-[-0.02em] transition hover:-translate-y-0.5"
                          style={{
                            borderColor: palette.border,
                            backgroundColor:
                              sceneTone === 'moonlit' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.74)',
                            color: palette.text,
                          }}
                          {...footerLinkProps}
                        />
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>

            <div
              className="rounded-[1.6rem] border p-5"
              style={{
                background:
                  sceneTone === 'moonlit'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.42)',
                borderColor: palette.border,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: palette.muted }}
                  >
                    Stay in the loop
                  </p>
                  <p className="mt-2 text-[0.94rem] leading-6" style={{ color: palette.muted }}>
                    Follow the bakery for rotating drops, tray updates, and the eventual custom tray launch.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                  <a
                    aria-label={label}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.86rem] font-semibold transition hover:-translate-y-0.5"
                    href={href}
                    key={label}
                    rel="noreferrer"
                    style={{ backgroundColor: palette.iconBg, color: palette.icon }}
                    target="_blank"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div
          className="mt-4 flex flex-col gap-3 border-t pt-4 text-[0.82rem] sm:text-[0.86rem] md:flex-row md:items-center md:justify-between"
          style={{ borderColor: palette.border, color: palette.muted }}
        >
          <p>
            &copy; {currentYear} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 font-medium">
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
