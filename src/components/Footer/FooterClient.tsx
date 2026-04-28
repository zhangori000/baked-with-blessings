'use client'

import { CMSLink } from '@/components/Link'
import { CartSceneShell } from '@/components/scenery/CartSceneShell'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

const instagramHref = 'https://www.instagram.com/_bakedwithblessings/'
const instagramHandle = '@_bakedwithblessings'

const getFooterLinkLabel = (linkProps: Record<string, unknown>) =>
  typeof linkProps.label === 'string' ? linkProps.label.trim() : ''

const getFooterLinkHref = (linkProps: Record<string, unknown>) => {
  if (typeof linkProps.url === 'string') return linkProps.url.trim()

  const reference = linkProps.reference
  if (!reference || typeof reference !== 'object') return ''

  const referenceValue = (reference as { value?: unknown }).value
  if (!referenceValue || typeof referenceValue !== 'object') return ''

  const slug = (referenceValue as { slug?: unknown }).slug
  return typeof slug === 'string' ? `/${slug.trim()}` : ''
}

const isUnavailableFooterLink = (linkProps: Record<string, unknown>) => {
  const label = getFooterLinkLabel(linkProps).toLowerCase()
  const href = getFooterLinkHref(linkProps).toLowerCase()

  return (
    label.includes('find my order') ||
    label.includes('admin') ||
    href.includes('find-order') ||
    href.includes('find-my-order') ||
    href === '/admin' ||
    href.startsWith('/admin/')
  )
}

const isContactFooterLink = (linkProps: Record<string, unknown>) => {
  const label = getFooterLinkLabel(linkProps).toLowerCase()
  const href = getFooterLinkHref(linkProps).toLowerCase()

  return label === 'contact' || href === '/contact'
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
  const footerText = '#1f2f20'
  const footerMuted = 'rgba(31, 47, 32, 0.72)'
  const footerBorder = 'rgba(31, 47, 32, 0.16)'
  const footerPillClassName =
    'inline-flex min-h-[2.6rem] min-w-0 shrink-0 items-center gap-2 rounded-full border border-[var(--footer-link-border)] bg-[var(--footer-link-bg)] px-3.5 py-2.5 whitespace-nowrap text-[0.92rem] font-extrabold leading-none tracking-[0.01em] text-[var(--footer-link-color)] transition hover:-translate-y-0.5'

  const socialLinks = [
    {
      href: 'https://www.linkedin.com/',
      icon: Linkedin,
      label: 'LinkedIn',
    },
    {
      href: instagramHref,
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
    <Dialog>
      <footer
        className="relative min-h-[26rem] overflow-hidden px-3 pb-4 pt-10 sm:px-4 sm:pb-5 sm:pt-12 md:min-h-[24rem] md:px-6 md:pb-6 md:pt-14"
        style={{ background: '#d8ecfb' }}
      >
        <CartSceneShell
          className="absolute inset-0 !overflow-hidden"
          contentClassName="relative z-[1] min-h-full"
          hideSheep
          variant="compact"
        >
          <div className="relative z-[1] mx-auto grid h-full max-w-[1320px] content-stretch">
            <div
              className="grid rounded-[1.35rem] border px-4 pb-4 pt-7 sm:px-5 sm:pb-5 sm:pt-8 md:px-6 md:py-6"
              style={{
                backgroundColor: 'rgba(255, 252, 244, 0.2)',
                borderColor: 'rgba(255, 252, 244, 0.22)',
                color: footerText,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
              }}
            >
              <div className="flex min-h-[19rem] flex-col gap-5 md:min-h-[17rem] md:flex-row md:items-start md:justify-between">
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
                    <ul className="flex flex-wrap gap-2.5 md:justify-end">
                      {navItems.map((item, index) => {
                        const linkProps =
                          item.link && typeof item.link === 'object'
                            ? (item.link as Record<string, unknown>)
                            : {}

                        if (isUnavailableFooterLink(linkProps)) return null

                        const footerLinkProps = linkProps as React.ComponentProps<typeof CMSLink>
                        const footerLinkStyle = {
                          '--footer-link-bg': 'rgba(255,252,244,0.56)',
                          '--footer-link-border': footerBorder,
                          '--footer-link-color': footerText,
                        } as React.CSSProperties

                        return (
                          <li key={item.id ?? `footer-link-${index}`} style={footerLinkStyle}>
                            {isContactFooterLink(linkProps) ? (
                              <DialogTrigger asChild>
                                <button className={footerPillClassName} type="button">
                                  {getFooterLinkLabel(linkProps) || 'Contact'}
                                </button>
                              </DialogTrigger>
                            ) : (
                              <CMSLink
                                appearance="link"
                                className={footerPillClassName}
                                {...footerLinkProps}
                              />
                            )}
                          </li>
                        )
                      })}
                      <li
                        style={
                          {
                            '--footer-link-bg': 'rgba(255,252,244,0.56)',
                            '--footer-link-border': footerBorder,
                            '--footer-link-color': footerText,
                          } as React.CSSProperties
                        }
                      >
                        <Link className={footerPillClassName} href="/account">
                          Account
                        </Link>
                      </li>
                    </ul>
                  </nav>

                  <div className="flex flex-wrap gap-2.5 md:justify-end">
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
                className="mt-3 rounded-2xl border border-[rgba(31, 47, 32, 0.08)] px-3 py-3 text-[0.9rem] font-semibold tracking-[0.005em] sm:text-[0.95rem]"
                style={{ backgroundColor: 'rgba(255,252,244,0.48)', color: footerMuted }}
              >
                <p>
                  &copy; {currentYear} {copyrightName}
                  {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </CartSceneShell>
      </footer>

      <DialogContent className="border-[#4b3b24]/15 bg-[#fffaf0] text-[#2f2414] shadow-[0_24px_80px_rgba(47,36,20,0.24)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold tracking-[-0.02em]">
            Contact Baked with Blessings
          </DialogTitle>
          <DialogDescription className="text-base leading-7 text-[#6c583a]">
            Hey, for now, we only have Instagram. DM me at{' '}
            <a
              className="font-extrabold text-[#2f2414] underline decoration-[#2f2414]/25 underline-offset-4 transition hover:opacity-75"
              href={instagramHref}
              rel="noreferrer"
              target="_blank"
            >
              {instagramHandle}
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <button
              className="inline-flex items-center justify-center rounded-full bg-[#2f2414] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#4b3b24]"
              type="button"
            >
              Got it
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
