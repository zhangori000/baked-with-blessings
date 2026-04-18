import type { Metadata } from 'next'

import { HomeCookieCarousel } from '../HomeCookieCarousel.client'
import {
  buildCookiePosterAssets,
  cookiePosterMetas,
  type CookiePosterAsset,
} from '../shop/cookiePosterData'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'

import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home'
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params }: Args) {
  const { slug = 'home' } = await params

  if (slug === 'home') {
    const posters = await queryHomeCookiePosters()

    return <HomeCookieCarousel posters={posters} />
  }

  const page = await queryPageBySlug({
    slug,
  })

  if (!page) {
    return notFound()
  }

  const { hero, layout } = page

  return (
    <article className="pt-16 pb-24">
      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = 'home' } = await params

  const page = await queryPageBySlug({
    slug,
  })

  return generateMeta({ doc: page })
}

const queryPageBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
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
}

const buildFallbackHomeCookiePosters = (): CookiePosterAsset[] =>
  cookiePosterMetas.map((meta) => ({
    ...meta,
    amount: 'Fresh weekly',
    href: `/cookies/${meta.slug}`,
    image: null,
    productHref: `/products/${meta.slug}`,
  }))

const queryHomeCookiePosters = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'products',
    draft: false,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: {
      gallery: true,
      id: true,
      meta: true,
      priceInUSD: true,
      slug: true,
      title: true,
    },
    sort: 'title',
  })

  const posters = buildCookiePosterAssets(result.docs)

  return posters.length > 0 ? posters : buildFallbackHomeCookiePosters()
}
