import type { Metadata } from 'next'

import type { Page, Post, Product } from '../payload-types'

import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'

type MetaDoc = Page | Post | Product | null | undefined

const buildAbsoluteURL = (pathOrURL: string) => {
  if (pathOrURL.startsWith('http://') || pathOrURL.startsWith('https://')) {
    return pathOrURL
  }

  return new URL(pathOrURL, getServerSideURL()).toString()
}

export const generateMeta = async (args: {
  doc: MetaDoc
  pathname?: string
}): Promise<Metadata> => {
  const { doc, pathname } = args || {}
  const excerpt =
    doc && 'excerpt' in doc && typeof doc.excerpt === 'string' ? doc.excerpt : undefined
  const title = doc?.meta?.title || doc?.title || 'Baked with Blessings'
  const description =
    doc?.meta?.description ||
    excerpt ||
    'Baked with Blessings is a bakery and cafe sharing cookies, catering, and notes from the business.'
  const canonicalPath = pathname ?? (doc?.slug ? (doc.slug === 'home' ? '/' : `/${doc.slug}`) : '/')
  const canonicalURL = buildAbsoluteURL(canonicalPath)

  const ogImage =
    typeof doc?.meta?.image === 'object' &&
    doc.meta.image !== null &&
    'url' in doc.meta.image &&
    typeof doc.meta.image.url === 'string'
      ? buildAbsoluteURL(doc.meta.image.url)
      : undefined

  return {
    alternates: {
      canonical: canonicalURL,
    },
    description,
    metadataBase: new URL(getServerSideURL()),
    openGraph: mergeOpenGraph({
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: canonicalURL,
    }),
    title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: ogImage ? [ogImage] : undefined,
      title,
    },
  }
}
