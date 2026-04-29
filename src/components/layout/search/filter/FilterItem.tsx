'use client'

import type { SortFilterItem as SortFilterItemType } from '@/lib/constants'

import { createUrl } from '@/utilities/createUrl'
import { usePathname, useSearchParams } from 'next/navigation'

import { FilterOptionLink } from '../FilterOptionShell'

import type { ListItem } from '.'
import type { PathFilterItem as PathFilterItemType } from '.'

function PathFilterItem({ item }: { item: PathFilterItemType }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = pathname === item.path
  const newParams = new URLSearchParams(searchParams.toString())

  newParams.delete('q')

  return (
    <li className="relative z-10" key={item.title}>
      <FilterOptionLink active={active} href={createUrl(item.path, newParams)} title={item.title} />
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
      <FilterOptionLink active={active} href={href} title={item.title} />
    </li>
  )
}

export function FilterItem({ item }: { item: ListItem }) {
  return 'path' in item ? <PathFilterItem item={item} /> : <SortFilterItem item={item} />
}
