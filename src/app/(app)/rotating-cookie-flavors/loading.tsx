import React from 'react'

function Pill({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-white/75 ${className}`} />
}

function PosterSkeleton({ active = false }: { active?: boolean }) {
  return (
    <article
      className={`overflow-hidden rounded-[1.6rem] border border-white/30 bg-white/16 shadow-[0_18px_46px_rgba(17,20,28,0.14)] backdrop-blur-[4px] ${
        active ? 'scale-[1.02]' : 'opacity-72'
      }`}
    >
      <div className="space-y-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Pill className="h-4 w-16" />
            <div className="h-9 w-40 rounded-[1rem] bg-white/78" />
          </div>
          <div className="h-10 w-20 rounded-full bg-[#183014]/16" />
        </div>
        <div className="space-y-2 pb-1">
          <div className="h-3 w-full rounded-full bg-white/60" />
          <div className="h-3 w-3/4 rounded-full bg-white/50" />
        </div>
      </div>

      <div className="relative h-[18rem] overflow-hidden bg-gradient-to-b from-[#eef8ef] via-[#f4f2dc] to-[#f1d15b]">
        <Pill className="absolute left-[10%] top-[14%] h-7 w-14" />
        <Pill className="absolute right-[12%] top-[22%] h-8 w-16" />
        <div className="absolute inset-x-0 bottom-0 h-[22%] bg-[#e0be39]" />
        <div className="absolute bottom-[13%] left-1/2 h-[9.75rem] w-[9.75rem] -translate-x-1/2 animate-pulse rounded-full bg-[#c98d49]/84 shadow-[0_18px_45px_rgba(109,65,20,0.24)]" />
      </div>
    </article>
  )
}

export default function Loading() {
  return (
    <section className="routeLoadingSurface min-h-screen bg-gradient-to-b from-[#eef8ef] via-[#f4f2dc] to-[#f1dc78]">
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-[70rem] space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Pill className="h-10 w-10" />
            <div className="space-y-3 text-center">
              <Pill className="mx-auto h-3 w-24" />
              <div className="mx-auto h-12 w-[min(24rem,72vw)] rounded-[1.3rem] bg-white/78" />
            </div>
            <Pill className="h-10 w-10" />
          </div>

          <div className="grid gap-4 md:grid-cols-[0.82fr_1.18fr_0.82fr] lg:gap-6">
            <div className="hidden md:block">
              <PosterSkeleton />
            </div>
            <div>
              <PosterSkeleton active />
            </div>
            <div className="hidden md:block">
              <PosterSkeleton />
            </div>
          </div>

          <div className="mx-auto flex max-w-[26rem] items-center justify-center gap-2 pt-2">
            <Pill className="h-2.5 w-10" />
            <Pill className="h-2.5 w-16" />
            <Pill className="h-2.5 w-10" />
          </div>
        </div>
      </div>
    </section>
  )
}
