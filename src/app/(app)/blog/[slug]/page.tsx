import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { RichText } from '@/components/RichText'
import { formatDateTime } from '@/utilities/formatDateTime'
import { generateMeta } from '@/utilities/generateMeta'
import { ArrowLeft } from 'lucide-react'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { cache } from 'react'

import { BlogSceneryHero } from '../BlogSceneryHero.client'
import '../../menu/_components/catering-menu-hero.css'
import '../blog.css'

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
    <div className="blogTypography">
      <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
        <div className="blogHero blogHeroPost">
          <BlogSceneryHero
            eyebrow={heroEyebrow || 'Baked with Blessings'}
            summary={post.excerpt}
            title={post.title}
          />
        </div>

        <section className="blogContentBand relative left-1/2 w-screen -translate-x-1/2">
          <article className="blogPostShell container">
            <h1 className="blogPostTitle">{post.title}</h1>

            <div className="blogPostByline">
              {publishedDate ? <span>{publishedDate}</span> : null}
              {post.authorName ? <span>Written by {post.authorName}</span> : null}
            </div>

            <RichText className="blogPostProse" data={post.content} enableGutter={false} />

            <Link className="blogBackLink" href="/blog">
              <ArrowLeft size={16} strokeWidth={2.2} />
              Back to blog
            </Link>
          </article>
        </section>
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
