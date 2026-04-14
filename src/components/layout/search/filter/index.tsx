import type { SortFilterItem } from '@/lib/constants'

import React, { Suspense } from 'react'

import { FilterItemDropdown } from './FilterItemDropdown'
import { FilterItem } from './FilterItem'
export type ListItem = PathFilterItem | SortFilterItem
export type PathFilterItem = { path: string; title: string }

function FilterItemList({ list }: { list: ListItem[] }) {
  return (
    <React.Fragment>
      {list.map((item: ListItem, i) => (
        <FilterItem item={item} key={i} />
      ))}
    </React.Fragment>
  )
}

export function FilterList({ list, title }: { list: ListItem[]; title?: string }) {
  return (
    <React.Fragment>
      <nav aria-label={title ?? 'Filters'} className="space-y-4">
        {title ? (
          <div className="flex items-center gap-3">
            <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.32em] text-[#9a795a]">
              {title}
            </h3>
            <span className="h-px flex-1 bg-gradient-to-r from-[#c9a57b]/80 to-transparent" />
          </div>
        ) : null}
        <ul className="relative hidden space-y-3 md:block before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-gradient-to-b before:from-[#d9bd99] before:via-[#c59b71] before:to-transparent">
          <Suspense fallback={null}>
            <FilterItemList list={list} />
          </Suspense>
        </ul>
        <ul className="md:hidden">
          <Suspense fallback={null}>
            <FilterItemDropdown list={list} />
          </Suspense>
        </ul>
      </nav>
    </React.Fragment>
  )
}
