'use client'

import { CMSLink } from '@/components/Link'
import { CartSceneShell } from '@/components/scenery/CartSceneShell'
import { BakeryAction, BakeryCard, SceneSurface } from '@/design-system/bakery'
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
  const footerPillClassName =
    'min-h-[2.6rem] shrink-0 border-[var(--bakery-footer-link-border)] bg-[var(--bakery-footer-link-bg)] px-3.5 py-2.5 whitespace-nowrap text-[0.92rem] tracking-[0.01em] text-[var(--bakery-footer-link-color)]'

  const footerSocialClassName =
    'border-transparent bg-[var(--bakery-footer-link-bg)] px-3.5 py-2.5 text-[0.9rem] tracking-[0.01em] text-[var(--bakery-footer-link-color)]'

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
      <SceneSurface
        as="footer"
        className="relative min-h-[34rem] overflow-hidden px-3 pb-4 pt-10 sm:min-h-[32rem] sm:px-4 sm:pb-5 sm:pt-12 md:min-h-[29rem] md:px-6 md:pb-6 md:pt-14"
        variant="footer"
      >
        <CartSceneShell
          className="absolute inset-0 !overflow-hidden"
          contentClassName="relative z-[1] min-h-full"
          hideCompactFlowers
          hideSheep
          variant="compact"
        >
          <div className="relative z-[1] mx-auto grid h-full max-w-[1320px] box-border content-stretch px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5 md:px-6 md:pb-7 md:pt-6">
            <BakeryCard
              className="grid border px-4 pb-4 pt-7 sm:px-5 sm:pb-5 sm:pt-8 md:px-6 md:py-6"
              radius="lg"
              spacing="none"
              tone="transparent"
              style={{
                backgroundColor: 'var(--bakery-footer-panel-bg)',
                borderColor: 'var(--bakery-footer-border)',
                boxShadow: 'var(--bakery-footer-panel-shadow)',
                color: 'var(--bakery-footer-fg)',
              }}
            >
              <div className="flex min-h-[19rem] flex-col gap-5 md:min-h-[17rem] md:flex-row md:items-start md:justify-between">
                <section className="max-w-[34rem] md:pt-1">
                  <BakeryCard
                    aria-label={brand.brandName}
                    as={Link}
                    className="inline-flex shrink-0 rounded-2xl bg-[#fff8e6]/90 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_24px_rgba(5,12,5,0.12)]"
                    href="/"
                    radius="lg"
                    spacing="none"
                    tone="transparent"
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
                  </BakeryCard>
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

                        return (
                          <li key={item.id ?? `footer-link-${index}`}>
                            {isContactFooterLink(linkProps) ? (
                              <DialogTrigger asChild>
                                <BakeryAction
                                  className={footerPillClassName}
                                  size="sm"
                                  type="button"
                                  variant="secondary"
                                >
                                  {getFooterLinkLabel(linkProps) || 'Contact'}
                                </BakeryAction>
                              </DialogTrigger>
                            ) : (
                              <CMSLink
                                appearance="link"
                                className={`bakeryAction bakeryAction-secondary bakeryAction-sm ${footerPillClassName}`}
                                {...footerLinkProps}
                              />
                            )}
                          </li>
                        )
                      })}
                      <li>
                        <BakeryAction
                          as={Link}
                          className={footerPillClassName}
                          href="/account"
                          size="sm"
                          variant="secondary"
                        >
                          Account
                        </BakeryAction>
                      </li>
                    </ul>
                  </nav>

                  <div className="flex flex-wrap gap-2.5 md:justify-end">
                    {socialLinks.map(({ href, icon: Icon, label }) => (
                      <BakeryAction
                        aria-label={label}
                        as="a"
                        className={footerSocialClassName}
                        href={href}
                        key={label}
                        rel="noreferrer"
                        size="sm"
                        target="_blank"
                        variant="secondary"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </BakeryAction>
                    ))}
                  </div>
                </section>
              </div>

              <BakeryCard
                className="mt-3 rounded-2xl border border-[rgba(31, 47, 32, 0.08)] px-3 py-3 text-[0.9rem] font-semibold tracking-[0.005em] sm:text-[0.95rem]"
                radius="lg"
                spacing="none"
                tone="transparent"
                style={{
                  backgroundColor: 'var(--bakery-footer-link-bg)',
                  borderColor: 'var(--bakery-footer-border)',
                  color: 'var(--bakery-footer-muted)',
                }}
              >
                <p>
                  &copy; {currentYear} {copyrightName}
                  {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights
                  reserved.
                </p>
              </BakeryCard>
            </BakeryCard>
          </div>
        </CartSceneShell>
      </SceneSurface>

      <DialogContent
        className="sm:max-w-md"
        style={{
          backgroundColor: 'var(--bakery-color-bg-primary)',
          borderColor: 'var(--bakery-color-border)',
          boxShadow: '0 24px 80px rgba(47,36,20,0.24)',
          color: 'var(--bakery-color-fg)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold tracking-[-0.02em]">
            Contact Baked with Blessings
          </DialogTitle>
          <DialogDescription
            className="text-base leading-7"
            style={{ color: 'var(--bakery-color-fg-muted)' }}
          >
            Hey, for now, we only have Instagram. DM me at{' '}
            <a
              className="font-extrabold underline underline-offset-4 transition hover:opacity-75"
              href={instagramHref}
              rel="noreferrer"
              style={{
                color: 'var(--bakery-color-fg)',
                textDecorationColor: 'color-mix(in srgb, var(--bakery-color-fg) 25%, transparent)',
              }}
              target="_blank"
            >
              {instagramHandle}
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <BakeryAction size="sm" type="button" variant="primary">
              Got it
            </BakeryAction>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
