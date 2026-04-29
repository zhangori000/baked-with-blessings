import { BakeryCard } from '@/design-system/bakery'
import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'

type FilterOptionContentProps = {
  active: boolean
  title: string
}

export function FilterOptionContent({ active, title }: FilterOptionContentProps) {
  return (
    <React.Fragment>
      <BakeryCard
        aria-hidden="true"
        as="span"
        className={clsx(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-[#f6eddf] shadow-[0_0_0_4px_rgba(255,248,240,0.7)] transition duration-300',
          active ? 'border-[#b98957]/90' : 'border-[#d8bb96]/75 group-hover:border-[#bf9362]',
        )}
        radius="none"
        spacing="none"
        tone="outline"
      >
        <span className="absolute inset-[-4px] rounded-full border border-[#cca273]/60 motion-safe:animate-[spin_18s_linear_infinite]" />
        <span
          className={clsx(
            'absolute inset-[4px] rounded-full border border-dashed transition duration-300 motion-safe:animate-[spin_14s_linear_infinite_reverse]',
            active
              ? 'border-[#9f754c]/70 opacity-100'
              : 'border-[#b7926b]/45 opacity-70 group-hover:opacity-100',
          )}
        />
        <span
          className={clsx(
            'absolute inset-[13px] rounded-full transition duration-300',
            active ? 'bg-[#7d5a3c]' : 'bg-[#b89570] group-hover:bg-[#8f6846]',
          )}
        />
      </BakeryCard>

      <BakeryCard
        as="span"
        className={clsx(
          'min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm font-medium leading-none shadow-[0_10px_30px_rgba(84,53,28,0.06)] transition-all duration-300',
          active
            ? 'border-[#9f754c] bg-[#6a4b31] text-[#fff8ef]'
            : 'border-[#dcc4a8] bg-[#fffaf3]/90 text-[#654a31] group-hover:border-[#ba9062] group-hover:bg-[#fbf1e5] group-hover:text-[#4c3421]',
        )}
        radius="none"
        spacing="none"
        tone="outline"
      >
        <span className="block truncate">{title}</span>
      </BakeryCard>
    </React.Fragment>
  )
}

export function FilterOptionLink({
  active,
  href,
  title,
}: FilterOptionContentProps & {
  href: string
}) {
  const content = <FilterOptionContent active={active} title={title} />

  if (active) {
    return (
      <span
        aria-current="page"
        className="group flex w-full items-center gap-3 text-left transition duration-300"
      >
        {content}
      </span>
    )
  }

  return (
    <Link
      className="group flex w-full items-center gap-3 text-left transition duration-300 hover:translate-x-1"
      href={href}
      prefetch={false}
    >
      {content}
    </Link>
  )
}
