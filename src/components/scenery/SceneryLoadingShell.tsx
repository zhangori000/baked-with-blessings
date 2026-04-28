import React from 'react'

import { cn } from '@/utilities/cn'

type SceneryLoadingShellProps = {
  cardCount?: number
  message: string
  titleWidth?: string
  variant?: 'list' | 'menu' | 'posters'
}

function SkeletonPill({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-full bg-white/72', className)}
    />
  )
}

function LoadingHero({ message, titleWidth }: { message: string; titleWidth: string }) {
  return (
    <section className="sceneryLoadingHero relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <div aria-hidden="true" className="sceneryLoadingHeroSky" />
      <div aria-hidden="true" className="sceneryLoadingHeroOverlay" />
      <div aria-hidden="true" className="sceneryLoadingHeroMeadow" />
      <div aria-hidden="true" className="sceneryLoadingSpark sceneryLoadingSpark--one" />
      <div aria-hidden="true" className="sceneryLoadingSpark sceneryLoadingSpark--two" />
      <div aria-hidden="true" className="sceneryLoadingSpark sceneryLoadingSpark--three" />

      <div className="container relative z-10 flex min-h-[28rem] items-center py-14 md:min-h-[34rem] md:py-16">
        <div className="w-full max-w-[44rem] space-y-5">
          <div className="sceneryLoadingBanner" role="status" aria-live="polite">
            {message}
          </div>
          <SkeletonPill className="h-3 w-36 bg-white/60" />
          <div className={cn('h-16 animate-pulse rounded-[1.2rem] bg-white/72', titleWidth)} />
          <div className="space-y-3">
            <SkeletonPill className="h-4 w-[min(38rem,88vw)]" />
            <SkeletonPill className="h-4 w-[min(31rem,78vw)]" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <SkeletonPill className="h-10 w-36 bg-white/82" />
            <SkeletonPill className="h-10 w-36 bg-white/82" />
            <SkeletonPill className="h-10 w-40 bg-white/82" />
          </div>
        </div>
      </div>
    </section>
  )
}

function ListCard({ tone = 'neutral' }: { tone?: 'discussion' | 'neutral' }) {
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
        {tone === 'discussion' ? <SkeletonPill className="h-7 w-20 bg-[#dfe9d6]" /> : null}
      </div>
    </article>
  )
}

function MenuCard() {
  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-[rgba(91,70,37,0.12)] bg-[#fff8f2] shadow-[0_10px_24px_rgba(23,21,16,0.05)]">
      <div className="space-y-3 px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <SkeletonPill className="h-5 w-28" />
          <div className="flex items-center gap-1.5">
            <SkeletonPill className="h-6 w-6" />
            <SkeletonPill className="h-4 w-5" />
            <SkeletonPill className="h-6 w-6" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-black/8" />
          <div className="h-3 w-3/4 rounded-full bg-black/6" />
        </div>
      </div>

      <div className="sceneryLoadingCardScene mt-3 h-[16rem]" />
    </article>
  )
}

function MenuBody() {
  return (
    <section className="container py-6 md:py-10">
      <div className="rounded-[1.4rem] border border-[rgba(91,70,37,0.1)] bg-[#fffaf4] p-4 shadow-[0_18px_40px_rgba(23,21,16,0.06)] md:p-6">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="space-y-3">
              <SkeletonPill className="h-4 w-28" />
              <div className="h-11 w-64 rounded-[1.2rem] bg-black/7" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-black/7" />
                <div className="h-3 w-4/5 rounded-full bg-black/6" />
              </div>
            </div>
            <div className="space-y-2 md:justify-self-end">
              <SkeletonPill className="h-4 w-20" />
              <div className="h-8 w-24 rounded-full bg-black/7" />
            </div>
          </div>

          <div className="space-y-4 rounded-[1.1rem] border border-[rgba(91,70,37,0.08)] bg-[rgba(255,248,242,0.88)] p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <SkeletonPill className="h-3 w-24" />
                <div className="h-6 w-32 rounded-full bg-black/8" />
              </div>
              <div className="space-y-2 md:text-right">
                <SkeletonPill className="ml-auto h-3 w-20" />
                <div className="ml-auto h-6 w-24 rounded-full bg-black/8" />
              </div>
            </div>

            <div className="h-3 rounded-full bg-[#dce7bf]">
              <div className="h-full w-[36%] rounded-full bg-[#91b945]" />
            </div>
          </div>

          <div className="flex gap-4 overflow-hidden pb-2">
            <div className="w-[min(86vw,20.75rem)] shrink-0">
              <MenuCard />
            </div>
            <div className="hidden w-[20.75rem] shrink-0 md:block">
              <MenuCard />
            </div>
            <div className="hidden w-[20.75rem] shrink-0 lg:block">
              <MenuCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ListBody({ cardCount }: { cardCount: number }) {
  return (
    <section className="container grid gap-3 py-6 md:py-8">
      {Array.from({ length: cardCount }, (_, index) => (
        <ListCard key={index} tone={cardCount > 5 ? 'discussion' : 'neutral'} />
      ))}
    </section>
  )
}

function PosterCard({ active = false }: { active?: boolean }) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-[1.4rem] border border-white/30 bg-white/16 shadow-[0_18px_46px_rgba(17,20,28,0.14)] backdrop-blur-[4px]',
        active ? 'scale-[1.02]' : 'opacity-72',
      )}
    >
      <div className="space-y-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <SkeletonPill className="h-4 w-16" />
            <div className="h-9 w-40 rounded-[1rem] bg-white/78" />
          </div>
          <div className="h-10 w-20 rounded-full bg-[#183014]/16" />
        </div>
        <div className="space-y-2 pb-1">
          <div className="h-3 w-full rounded-full bg-white/60" />
          <div className="h-3 w-3/4 rounded-full bg-white/50" />
        </div>
      </div>

      <div className="sceneryLoadingCardScene relative h-[18rem]" />
    </article>
  )
}

function PostersBody() {
  return (
    <section className="container py-6 md:py-10">
      <div className="mx-auto max-w-[70rem] space-y-6">
        <div className="grid gap-4 md:grid-cols-[0.82fr_1.18fr_0.82fr] lg:gap-6">
          <div className="hidden md:block">
            <PosterCard />
          </div>
          <PosterCard active />
          <div className="hidden md:block">
            <PosterCard />
          </div>
        </div>

        <div className="mx-auto flex max-w-[26rem] items-center justify-center gap-2 pt-2">
          <SkeletonPill className="h-2.5 w-10" />
          <SkeletonPill className="h-2.5 w-16" />
          <SkeletonPill className="h-2.5 w-10" />
        </div>
      </div>
    </section>
  )
}

export function SceneryLoadingShell({
  cardCount = 4,
  message,
  titleWidth = 'w-[min(30rem,78vw)]',
  variant = 'list',
}: SceneryLoadingShellProps) {
  return (
    <main
      aria-busy="true"
      aria-label={message}
      className={cn('routeLoadingSurface sceneryLoadingShell min-h-screen overflow-hidden')}
    >
      <LoadingHero message={message} titleWidth={titleWidth} />
      {variant === 'menu' ? <MenuBody /> : null}
      {variant === 'list' ? <ListBody cardCount={cardCount} /> : null}
      {variant === 'posters' ? <PostersBody /> : null}
    </main>
  )
}
