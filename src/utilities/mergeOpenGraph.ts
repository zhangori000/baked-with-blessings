import type { Metadata } from 'next'

import { defaultSocialImage, siteDescription, siteName } from './siteMetadata'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: siteDescription,
  images: [defaultSocialImage],
  siteName,
  title: siteName,
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
