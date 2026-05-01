import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { RichText } from '@/components/RichText'
import {
  BakeryPageHeader,
  BakeryPageShell,
  BakeryPageSurface,
  BakeryPageTitle,
} from '@/design-system/bakery'
import { getMenuSceneToneFromCookies } from '@/components/scenery/getMenuSceneToneFromCookies'
import { formatDateTime } from '@/utilities/formatDateTime'
import { generateMeta } from '@/utilities/generateMeta'
import { ArrowLeft } from 'lucide-react'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { Cormorant_Garamond } from 'next/font/google'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { cache } from 'react'

import { BlogSceneryHero } from '../BlogSceneryHero.client'
import '../../menu/_components/catering-menu-hero.css'
import '../blog.css'

const blogHeroSerif = Cormorant_Garamond({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-catering-serif',
  weight: ['500', '600', '700'],
})

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = '' } = await params
  const post = await queryPostBySlug(slug)

  return generateMeta({
    doc: post,
    pathname: post?.slug ? `/blog/${post.slug}` : '/blog',
  })
}

export default async function BlogPostPage({ params }: Args) {
  const { slug = '' } = await params
  const initialSceneryTone = await getMenuSceneToneFromCookies()
  const post = await queryPostBySlug(slug)

  if (!post) {
    return notFound()
  }

  const publishedDate = post.publishedOn
    ? formatDateTime({ date: post.publishedOn, format: 'MMMM d, yyyy' })
    : null
  const heroEyebrow = [post.authorName ? `By ${post.authorName}` : null, publishedDate]
    .filter(Boolean)
    .join(' / ')

  return (
    <div className={`blogTypography ${blogHeroSerif.variable}`}>
      <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
        <div className="blogHero blogHeroPost">
          <BlogSceneryHero
            eyebrow={heroEyebrow || 'Baked with Blessings'}
            initialSceneryTone={initialSceneryTone}
            summary="This page is experimental."
            title={post.title}
          />
        </div>

        <BakeryPageShell as="section" bleed className="blogContentBand" spacing="none" width="full">
          <BakeryPageSurface
            as="article"
            className="blogPostShell container"
            spacing="none"
            tone="plain"
            width="narrow"
          >
            <BakeryPageHeader>
              <BakeryPageTitle className="blogPostTitle">{post.title}</BakeryPageTitle>
            </BakeryPageHeader>

            <div className="blogPostByline">
              {publishedDate ? <span>{publishedDate}</span> : null}
              {post.authorName ? <span>Written by {post.authorName}</span> : null}
            </div>

            <RichText className="blogPostProse" data={post.content} enableGutter={false} />

            <Link className="blogBackLink" href="/blog">
              <ArrowLeft size={16} strokeWidth={2.2} />
              Back to blog
            </Link>
          </BakeryPageSurface>
        </BakeryPageShell>
      </div>
    </div>
  )
}

const queryPostBySlug = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
  })

  return result.docs?.[0] || null
})
