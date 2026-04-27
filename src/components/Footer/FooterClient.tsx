'use client'

import { CMSLink } from '@/components/Link'
import {
  menuHeroCloudsByScene,
  menuHeroMeadowByScene,
  menuHeroMobileMeadowByScene,
  menuHeroSkyByScene,
} from '@/components/scenery/menuHeroScenery'
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

export function FooterClient({ brand, copyrightName, currentYear, navItems }: FooterClientProps) {
  const [sceneTone] = usePersistentMenuSceneTone()
  const skySrc = menuHeroSkyByScene[sceneTone] ?? menuHeroSkyByScene.classic
  const meadowSrc = menuHeroMeadowByScene[sceneTone] ?? menuHeroMeadowByScene.classic
  const mobileMeadowSrc = menuHeroMobileMeadowByScene[sceneTone]
  const sceneClouds = menuHeroCloudsByScene[sceneTone] ?? menuHeroCloudsByScene.classic
  const footerText = '#1f2f20'
  const footerMuted = 'rgba(31, 47, 32, 0.72)'
  const footerBorder = 'rgba(31, 47, 32, 0.16)'

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
      className="relative overflow-hidden px-3 pb-4 pt-10 sm:px-4 sm:pb-5 sm:pt-12 md:px-6 md:pb-6 md:pt-14"
      style={{ background: '#d8ecfb' }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover"
          fill
          sizes="100vw"
          src={skySrc}
          unoptimized
        />

        {sceneClouds.slice(0, 2).map((cloud) => (
          <span
            className={`absolute opacity-80 ${cloud.className}`}
            key={`${sceneTone}-${cloud.className}-${cloud.src}`}
            style={cloud.style}
          >
            <Image
              alt=""
              aria-hidden="true"
              className="h-auto w-full"
              height={240}
              src={cloud.src}
              unoptimized
              width={360}
            />
          </span>
        ))}

        <picture className="absolute inset-x-0 bottom-0 h-24 md:h-32">
          {mobileMeadowSrc ? <source media="(max-width: 767px)" srcSet={mobileMeadowSrc} /> : null}
          <Image
            alt=""
            aria-hidden="true"
            className="object-cover object-bottom"
            draggable="false"
            fill
            sizes="100vw"
            src={meadowSrc}
            unoptimized
          />
        </picture>
      </div>

      <div className="relative z-[1] mx-auto grid min-h-[24rem] max-w-[1320px] content-stretch">
        <div
          className="grid rounded-[1.35rem] border px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6"
          style={{
            backgroundColor: 'rgba(255, 252, 244, 0.2)',
            borderColor: 'rgba(255, 252, 244, 0.22)',
            color: footerText,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
          }}
        >
          <div className="flex min-h-[17rem] flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <section className="max-w-[34rem] md:pt-1">
              <Link
                aria-label={brand.brandName}
                className="inline-flex shrink-0 rounded-2xl bg-[#fff8e6]/90 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_24px_rgba(5,12,5,0.12)]"
                href="/"
              >
                <Image
                  alt={brand.logoAlt}
                  className="h-auto w-[8.75rem] object-contain sm:w-[10rem]"
                  height={64}
                  loading="eager"
                  src={brand.logoUrl}
                  unoptimized
                  width={176}
                />
              </Link>
            </section>

            <section className="mt-auto flex max-w-[34rem] flex-col gap-4 md:items-end">
              <nav aria-label="Footer links">
                <ul className="flex flex-wrap gap-2 md:justify-end">
                  {navItems.map((item, index) => {
                    const linkProps =
                      item.link && typeof item.link === 'object'
                        ? (item.link as Record<string, unknown>)
                        : {}
                    const footerLinkProps = linkProps as React.ComponentProps<typeof CMSLink>
                    const footerLinkStyle = {
                      '--footer-link-bg': 'rgba(255,252,244,0.56)',
                      '--footer-link-border': footerBorder,
                      '--footer-link-color': footerText,
                    } as React.CSSProperties

                    return (
                      <li key={item.id ?? `footer-link-${index}`} style={footerLinkStyle}>
                        <CMSLink
                          appearance="link"
                          className="inline-flex rounded-full border border-[var(--footer-link-border)] bg-[var(--footer-link-bg)] px-3.5 py-2.5 text-[0.92rem] font-extrabold tracking-[0.01em] text-[var(--footer-link-color)] transition hover:-translate-y-0.5"
                          {...footerLinkProps}
                        />
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                  <a
                    aria-label={label}
                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[0.9rem] font-extrabold tracking-[0.01em] transition hover:-translate-y-0.5"
                    href={href}
                    key={label}
                    rel="noreferrer"
                    style={{ backgroundColor: 'rgba(255,252,244,0.56)', color: footerText }}
                    target="_blank"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </section>
          </div>

          <div
            className="mt-auto flex flex-col gap-3 rounded-2xl px-3 py-3 text-[0.9rem] font-semibold tracking-[0.005em] sm:text-[0.95rem] md:flex-row md:items-center md:justify-between"
            style={{ backgroundColor: 'rgba(255,252,244,0.48)', color: footerMuted }}
          >
            <p>
              &copy; {currentYear} {copyrightName}
              {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 font-extrabold">
              <Link className="transition hover:opacity-70" href="/account">
                Account
              </Link>
              <Link className="transition hover:opacity-70" href="/menu">
                Menu
              </Link>
              <Link className="transition hover:opacity-70" href="/contact">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
