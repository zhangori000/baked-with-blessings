import React from 'react'

type PageResponseSkeletonProps = {
  cardCount?: number
  titleWidth?: string
  tone?: 'discussion' | 'reviews'
}

function SkeletonPill({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-full bg-white/72 ${className}`}
    />
  )
}

function SkeletonCard({ tone }: { tone: 'discussion' | 'reviews' }) {
  const isDiscussion = tone === 'discussion'

  return (
    <article className="rounded-lg border border-[rgba(67,92,37,0.16)] bg-[#fffdf6]/92 p-4 shadow-[0_18px_40px_rgba(46,65,42,0.08)]">
      <div className="flex flex-wrap items-center gap-2">
        <SkeletonPill className="h-6 w-24 bg-[#dfe9d6]" />
        <SkeletonPill className="h-4 w-20 bg-[#eadfcf]" />
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonPill className="h-5 w-[min(27rem,80vw)] bg-[#d9decf]" />
        <SkeletonPill className="h-4 w-[min(34rem,88vw)] bg-[#e8eddf]" />
        <SkeletonPill className="h-4 w-[min(24rem,72vw)] bg-[#edf1e6]" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <SkeletonPill className="h-7 w-24 bg-[#dfe9d6]" />
        <SkeletonPill className="h-7 w-28 bg-[#dfe9d6]" />
        {isDiscussion ? <SkeletonPill className="h-7 w-20 bg-[#dfe9d6]" /> : null}
      </div>
    </article>
  )
}

export function PageResponseSkeleton({
  cardCount = 4,
  titleWidth = 'w-[min(30rem,78vw)]',
  tone = 'reviews',
}: PageResponseSkeletonProps) {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="routeLoadingSurface min-h-screen overflow-hidden bg-[#fff8f2] text-[#172415]"
    >
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-b from-[#eef8ef] via-[#f4f2dc] to-[#eef7e8]">
        <div className="container flex min-h-[31rem] items-center py-16 md:min-h-[36rem]">
          <div className="w-full max-w-[44rem] space-y-5">
            <SkeletonPill className="h-3 w-36 bg-[#244f2d]/18" />
            <div className={`h-16 ${titleWidth} animate-pulse rounded-[1.2rem] bg-white/76`} />
            <div className="space-y-3">
              <SkeletonPill className="h-4 w-[min(38rem,88vw)]" />
              <SkeletonPill className="h-4 w-[min(31rem,78vw)]" />
            </div>
            <div className="flex flex-wrap gap-3 pt-3">
              <SkeletonPill className="h-10 w-36 bg-[#fffdf6]/88" />
              <SkeletonPill className="h-10 w-36 bg-[#fffdf6]/88" />
              <SkeletonPill className="h-10 w-40 bg-[#fffdf6]/88" />
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-[#91bf42]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-12 bg-[#6fa934]/70" />
        <div className="absolute bottom-8 left-[8%] h-3 w-3 animate-pulse rounded-full bg-white/80" />
        <div className="absolute bottom-10 left-[18%] h-2 w-2 animate-pulse rounded-full bg-[#e48dac]" />
        <div className="absolute bottom-8 left-[34%] h-3 w-3 animate-pulse rounded-full bg-[#f1d943]" />
        <div className="absolute bottom-11 right-[28%] h-2.5 w-2.5 animate-pulse rounded-full bg-white/82" />
        <div className="absolute bottom-8 right-[12%] h-3 w-3 animate-pulse rounded-full bg-[#d66494]" />
      </section>

      <section className="container grid gap-3 py-6 md:py-8">
        {Array.from({ length: cardCount }, (_, index) => (
          <SkeletonCard key={index} tone={tone} />
        ))}
      </section>
    </main>
  )
}
