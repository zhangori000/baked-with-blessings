import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { cookiePosterAssets, getCookiePosterAsset } from '../../shop/cookiePosterData'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return cookiePosterAssets.map((poster) => ({
    slug: poster.slug,
  }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const poster = getCookiePosterAsset(slug)

  if (!poster) {
    return {
      title: 'Cookie',
    }
  }

  return {
    description: poster.summary,
    title: `${poster.title} | Baked with Blessings`,
  }
}

export default async function CookiePosterPage({ params }: Args) {
  const { slug } = await params
  const poster = getCookiePosterAsset(slug)

  if (!poster) {
    notFound()
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div
          className="overflow-hidden rounded-[3rem] border p-6 shadow-[0_20px_50px_rgba(93,74,41,0.12)]"
          style={{
            backgroundColor: '#fffdf8',
            borderColor: 'rgba(38, 29, 16, 0.12)',
          }}
        >
          <img
            alt={`${poster.title} cookie poster`}
            className="block w-full rounded-[2.25rem] bg-white/60 object-contain"
            src={poster.src}
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <span
              className="inline-flex rounded-[0.8rem] px-3 py-2 font-mono text-[0.88rem] uppercase tracking-[0.04em] text-[#0d2848]"
              style={{ backgroundColor: poster.labelTone }}
            >
              {poster.label}
            </span>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-medium leading-[0.92] tracking-[-0.07em] text-[#082a53]">
                {poster.title}
              </h1>
              <p className="font-mono text-[1.1rem] uppercase tracking-[0.08em] text-[#082a53]">
                {poster.amount}
              </p>
            </div>
            <p className="max-w-[36rem] text-base leading-7 text-black/62">{poster.summary}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {poster.chips.map((chip) => (
              <span
                className="rounded-[0.8rem] border border-black/8 bg-white/70 px-3 py-2 font-mono text-[0.82rem] uppercase tracking-[0.05em] text-[#082a53]"
                key={chip}
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="rounded-[2rem] border border-black/8 bg-[#fffaf2] p-6">
            <p className="text-sm leading-7 text-black/62">
              This cookie card is currently a poster-style showcase page. The catalog is not yet wired
              one-to-one to these custom cookie designs, so the live cart action will be added after the
              matching product records exist.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-[1.25rem] bg-[#1d3b1f] px-6 py-4 font-mono text-[0.9rem] uppercase tracking-[0.14em] text-white transition duration-200 hover:bg-[#2b4f2a]"
              href="/shop?section=sweets"
            >
              Back to Menu
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-[1.25rem] border border-black/10 bg-white px-6 py-4 font-mono text-[0.9rem] uppercase tracking-[0.14em] text-[#082a53] transition duration-200 hover:bg-[#fff7ec]"
              href="/checkout"
            >
              Open Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
