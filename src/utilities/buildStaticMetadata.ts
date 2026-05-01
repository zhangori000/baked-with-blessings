import type { Metadata } from 'next'

import { defaultSocialImage, siteName } from './siteMetadata'

type BuildStaticMetadataArgs = {
  description: string
  path?: string
  title: string
}

export const buildStaticMetadata = ({
  description,
  path = '/',
  title,
}: BuildStaticMetadataArgs): Metadata => ({
  alternates: {
    canonical: path,
  },
  description,
  openGraph: {
    description,
    images: [defaultSocialImage],
    siteName,
    title,
    type: 'website',
    url: path,
  },
  title,
  twitter: {
    card: 'summary_large_image',
    description,
    images: [defaultSocialImage.url],
    title,
  },
})
