import type { Page, Post } from '@/payload-types'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { contactHref, isContactLinkHint } from '@/utilities/routes'
import Link from 'next/link'
import React from 'react'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number
  } | null
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const referencePrefix = reference?.relationTo === 'posts' ? '/blog' : ''

  const referenceSlug =
    typeof reference?.value === 'object' && 'slug' in reference.value ? reference.value.slug : null

  const rawHref =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? `${referencePrefix}/${reference.value.slug}`
      : url

  const isContactLink = isContactLinkHint({ href: rawHref, label, slug: referenceSlug })
  const href = isContactLink ? contactHref : rawHref

  if (!href) return null

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps =
    newTab && !isContactLink ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={href} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={cn(className)} href={href} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}
