import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Baked with Blessings is a bakery and cafe sharing cookies, catering, and notes from the business.',
  images: [
    {
      url: '/baked-with-blessings-logo-pasture-restored.svg',
    },
  ],
  siteName: 'Baked with Blessings',
  title: 'Baked with Blessings',
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
