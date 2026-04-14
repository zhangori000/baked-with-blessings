'use client'

import type { SortFilterItem as SortFilterItemType } from '@/lib/constants'

import { createUrl } from '@/utilities/createUrl'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

import type { ListItem } from '.'
import type { PathFilterItem as PathFilterItemType } from '.'

function NavItemShell({
  active,
  href,
  title,
}: {
  active: boolean
  href: string
  title: string
}) {
  const content = (
    <React.Fragment>
      <span
        aria-hidden="true"
        className={clsx(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-[#f6eddf] shadow-[0_0_0_4px_rgba(255,248,240,0.7)] transition duration-300',
          active ? 'border-[#b98957]/90' : 'border-[#d8bb96]/75 group-hover:border-[#bf9362]',
        )}
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
      </span>

      <span
        className={clsx(
          'min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm font-medium leading-none shadow-[0_10px_30px_rgba(84,53,28,0.06)] transition-all duration-300',
          active
            ? 'border-[#9f754c] bg-[#6a4b31] text-[#fff8ef]'
            : 'border-[#dcc4a8] bg-[#fffaf3]/90 text-[#654a31] group-hover:border-[#ba9062] group-hover:bg-[#fbf1e5] group-hover:text-[#4c3421]',
        )}
      >
        <span className="block truncate">{title}</span>
      </span>
    </React.Fragment>
  )

  if (active) {
    return (
      <span
        aria-current="true"
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

function PathFilterItem({ item }: { item: PathFilterItemType }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = pathname === item.path
  const newParams = new URLSearchParams(searchParams.toString())

  newParams.delete('q')

  return (
    <li className="relative z-10" key={item.title}>
      <NavItemShell active={active} href={createUrl(item.path, newParams)} title={item.title} />
    </li>
  )
}

function SortFilterItem({ item }: { item: SortFilterItemType }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('sort') === item.slug
  const q = searchParams.get('q')
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug && item.slug.length && { sort: item.slug }),
    }),
  )

  return (
    <li className="relative z-10" key={item.title}>
      <NavItemShell active={active} href={href} title={item.title} />
    </li>
  )
}

export function FilterItem({ item }: { item: ListItem }) {
  return 'path' in item ? <PathFilterItem item={item} /> : <SortFilterItem item={item} />
}
