import type { Metadata } from 'next'

import configPromise from '@payload-config'
import {
  BakeryCard,
  BakeryPageShell,
  BakeryPageSurface,
  BakerySectionHeader,
} from '@/design-system/bakery'
import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getPayload } from 'payload'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Cormorant_Garamond } from 'next/font/google'

import { BlogSceneryHero } from './BlogSceneryHero.client'
import '../menu/_components/catering-menu-hero.css'
import './blog.css'

const blogHeroSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  description:
    'Read compact essays and notes from Baked with Blessings about school, business, community, and building a bakery/cafe.',
  title: 'Blog',
}

const postsSelect = {
  authorName: true,
  excerpt: true,
  id: true,
  meta: true,
  publishedOn: true,
  slug: true,
  title: true,
  updatedAt: true,
} as const

export default async function BlogPage() {
  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: postsSelect,
    sort: '-publishedOn',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return (
    <div className={`blogTypography ${blogHeroSerif.variable}`}>
      <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
        <div className="blogHero">
          <BlogSceneryHero
            eyebrow="Baked with Blessings"
            initialSceneryTone={initialSceneryTone}
            summary="Compact essays and notes from the bakery about school, business, community, and what is being learned along the way."
            title="Blog"
          />
        </div>

        <BakeryPageShell as="section" bleed className="blogContentBand" spacing="none" width="full">
          <BakeryPageSurface
            as="div"
            className="blogIndexShell container"
            spacing="none"
            tone="plain"
            width="full"
          >
            <BakerySectionHeader
              className="blogListHeader"
              end={
                <p className="blogListCount">
                  {posts.docs.length === 1
                    ? '1 published note'
                    : `${posts.docs.length} published notes`}
                </p>
              }
              title="Documents"
            />

            {posts.docs.length ? (
              <div className="blogRows">
                {posts.docs.map((post) => {
                  const publishedDate = post.publishedOn
                    ? formatDateTime({ date: post.publishedOn, format: 'MMM d, yyyy' })
                    : null

                  return (
                    <BakeryCard
                      as={Link}
                      className="blogRow"
                      href={`/blog/${post.slug}`}
                      interactive
                      key={post.id}
                      radius="none"
                      spacing="none"
                      tone="transparent"
                    >
                      <span className="min-w-0">
                        <span className="blogRowMeta">
                          {publishedDate ? <span>{publishedDate}</span> : null}
                          {post.authorName ? <span>By {post.authorName}</span> : null}
                        </span>
                        <span className="blogRowTitle block">{post.title}</span>
                        {post.excerpt ? (
                          <span className="blogRowExcerpt block">{post.excerpt}</span>
                        ) : null}
                      </span>
                      <span className="blogRowArrow" aria-hidden="true">
                        <ArrowRight size={17} strokeWidth={2.2} />
                      </span>
                    </BakeryCard>
                  )
                })}
              </div>
            ) : (
              <p className="blogEmptyState">
                No published blog posts yet. Draft a post in Payload admin, publish it, and it will
                appear here.
              </p>
            )}
          </BakeryPageSurface>
        </BakeryPageShell>
      </div>
    </div>
  )
}
