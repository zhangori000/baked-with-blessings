import type { MetadataRoute } from 'next'

import configPromise from '@payload-config'
import {
  blogHref,
  contactHref,
  discussionBoardHref,
  flavorVoteHref,
  menuHref,
  oldFlavorsHref,
  privacyHref,
  reviewsHref,
  rotationsHref,
  termsHref,
} from '@/utilities/routes'
import { isDatabaseConnectionError } from '@/utilities/databaseConnectionError'
import { getServerSideURL } from '@/utilities/getURL'
import { getPayload } from 'payload'

const staticPublicRoutes = [
  '/',
  rotationsHref,
  menuHref,
  oldFlavorsHref,
  flavorVoteHref,
  contactHref,
  blogHref,
  discussionBoardHref,
  reviewsHref,
  privacyHref,
  termsHref,
]

const staticPublicRouteSet = new Set(staticPublicRoutes)

const toAbsoluteURL = (path: string) => new URL(path, getServerSideURL()).toString()

const staticEntries = (): MetadataRoute.Sitemap =>
  staticPublicRoutes.map((route) => ({
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.75,
    url: toAbsoluteURL(route),
  }))

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = staticEntries()

  try {
    return [...entries, ...(await publishedContentEntries())]
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error

    console.error(
      'Sitemap skipped published pages and posts because the database was unreachable. Static routes are still included.',
      error,
    )
    return entries
  }
}

const publishedContentEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const payload = await getPayload({ config: configPromise })

  const [pages, posts] = await Promise.all([
    payload.find({
      collection: 'pages',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
        updatedAt: true,
      },
      where: {
        _status: {
          equals: 'published',
        },
      },
    }),
    payload.find({
      collection: 'posts',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
        updatedAt: true,
      },
      where: {
        _status: {
          equals: 'published',
        },
      },
    }),
  ])

  const pageEntries = pages.docs
    .filter(
      (page) => page.slug && page.slug !== 'home' && !staticPublicRouteSet.has(`/${page.slug}`),
    )
    .map((page) => ({
      changeFrequency: 'weekly' as const,
      lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
      priority: 0.7,
      url: toAbsoluteURL(`/${page.slug}`),
    }))

  const postEntries = posts.docs
    .filter((post) => post.slug)
    .map((post) => ({
      changeFrequency: 'monthly' as const,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
      priority: 0.65,
      url: toAbsoluteURL(`/blog/${post.slug}`),
    }))

  return [...pageEntries, ...postEntries]
}
