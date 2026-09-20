import type { Metadata } from 'next'

import { RotationsShowcase } from '@/app/(app)/RotationsShowcase'
import { defaultSocialImage, siteDescription, siteName } from '@/utilities/siteMetadata'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  description: siteDescription,
  openGraph: {
    description: siteDescription,
    images: [defaultSocialImage],
    locale: 'en_US',
    siteName,
    title: siteName,
    type: 'website',
    url: '/',
  },
  title: {
    absolute: siteName,
  },
  twitter: {
    card: 'summary_large_image',
    description: siteDescription,
    images: [defaultSocialImage.url],
    title: siteName,
  },
}

export default function HomePage() {
  return <RotationsShowcase />
}
