import type { MetadataRoute } from 'next'

import configPromise from '@payload-config'
import {
  blogHref,
  discussionBoardHref,
  menuHref,
  reviewsHref,
  rotatingCookieFlavorsHref,
} from '@/utilities/routes'
import { getServerSideURL } from '@/utilities/getURL'
import { getPayload } from 'payload'

const staticPublicRoutes = [
  '/',
  rotatingCookieFlavorsHref,
  menuHref,
  blogHref,
  discussionBoardHref,
  reviewsHref,
]

const toAbsoluteURL = (path: string) => new URL(path, getServerSideURL()).toString()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const staticEntries = staticPublicRoutes.map((route) => ({
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.75,
    url: toAbsoluteURL(route),
  }))

  const pageEntries = pages.docs
    .filter((page) => page.slug && page.slug !== 'home')
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

  return [...staticEntries, ...pageEntries, ...postEntries]
}
