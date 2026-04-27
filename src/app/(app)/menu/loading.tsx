import React from 'react'

function LoadingPill({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-white/70 ${className}`} />
}

function LoadingCard() {
  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-[rgba(91,70,37,0.12)] bg-[#fff8f2] shadow-[0_10px_24px_rgba(23,21,16,0.05)]">
      <div className="space-y-3 px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <LoadingPill className="h-5 w-28" />
          <div className="flex items-center gap-1.5">
            <LoadingPill className="h-6 w-6" />
            <LoadingPill className="h-4 w-5" />
            <LoadingPill className="h-6 w-6" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-black/8" />
          <div className="h-3 w-3/4 rounded-full bg-black/6" />
        </div>
      </div>

      <div className="mt-3 h-[16rem] animate-pulse bg-gradient-to-b from-[#8dc0f1] via-[#9bc8f0] to-[#f0cb49]" />
    </article>
  )
}

export default function Loading() {
  return (
    <div className="routeLoadingSurface min-h-screen bg-[#f7efe6]">
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-b from-[#7fb2e3] via-[#9cc3e7] to-[#ead9a7]">
        <div className="container flex min-h-[24rem] items-end py-12 md:min-h-[28rem]">
          <div className="w-full max-w-[42rem] space-y-5">
            <LoadingPill className="h-4 w-32" />
            <div className="space-y-3">
              <div className="h-12 w-[min(30rem,80vw)] rounded-[1.4rem] bg-[#fff8f2]/80 md:h-16" />
              <div className="h-4 w-[min(34rem,86vw)] rounded-full bg-white/65" />
              <div className="h-4 w-[min(28rem,74vw)] rounded-full bg-white/55" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <LoadingPill className="h-11 w-32" />
              <LoadingPill className="h-11 w-32" />
              <LoadingPill className="h-11 w-36" />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-6 md:py-10">
        <div className="rounded-[2rem] border border-[rgba(91,70,37,0.1)] bg-[#fffaf4] p-4 shadow-[0_18px_40px_rgba(23,21,16,0.06)] md:p-6">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="space-y-3">
                <LoadingPill className="h-4 w-28" />
                <div className="h-11 w-64 rounded-[1.2rem] bg-black/7" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-black/7" />
                  <div className="h-3 w-4/5 rounded-full bg-black/6" />
                </div>
              </div>
              <div className="space-y-2 md:justify-self-end">
                <LoadingPill className="h-4 w-20" />
                <div className="h-8 w-24 rounded-full bg-black/7" />
              </div>
            </div>

            <div className="space-y-4 rounded-[1.4rem] border border-[rgba(91,70,37,0.08)] bg-[rgba(255,248,242,0.88)] p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <LoadingPill className="h-3 w-24" />
                  <div className="h-6 w-32 rounded-full bg-black/8" />
                </div>
                <div className="space-y-2 md:text-right">
                  <LoadingPill className="ml-auto h-3 w-20" />
                  <div className="ml-auto h-6 w-24 rounded-full bg-black/8" />
                </div>
              </div>

              <div className="h-3 rounded-full bg-[#dce7bf]">
                <div className="h-full w-[36%] rounded-full bg-[#91b945]" />
              </div>
            </div>

            <div className="space-y-3 rounded-[1.2rem] border border-[rgba(91,70,37,0.08)] bg-white/70 p-4">
              <LoadingPill className="h-3 w-32" />
              <div className="h-4 w-[min(28rem,88vw)] rounded-full bg-black/7" />
              <div className="flex min-h-[4.9rem] flex-wrap gap-2">
                <LoadingPill className="h-8 w-24" />
                <LoadingPill className="h-8 w-28" />
                <LoadingPill className="h-8 w-24" />
                <LoadingPill className="h-8 w-20" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <LoadingPill className="h-3 w-28" />
                <div className="h-4 w-[min(30rem,90vw)] rounded-full bg-black/7" />
              </div>

              <div className="flex gap-4 overflow-hidden pb-2">
                <div className="w-[min(86vw,20.75rem)] shrink-0">
                  <LoadingCard />
                </div>
                <div className="hidden w-[20.75rem] shrink-0 md:block">
                  <LoadingCard />
                </div>
                <div className="hidden w-[20.75rem] shrink-0 lg:block">
                  <LoadingCard />
                </div>
              </div>
            </div>

            <div className="h-12 rounded-full bg-black/10" />
          </div>
        </div>
      </section>
    </div>
  )
}
