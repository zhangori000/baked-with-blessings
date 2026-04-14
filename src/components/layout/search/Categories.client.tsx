'use client'
import React, { useCallback, useMemo } from 'react'

import { Category } from '@/payload-types'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import clsx from 'clsx'

type Props = {
  category: Category
}

export const CategoryItem: React.FC<Props> = ({ category }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = useMemo(() => {
    return searchParams.get('category') === String(category.id)
  }, [category.id, searchParams])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (isActive) {
      params.delete('category')
    } else {
      params.set('category', String(category.id))
    }

    const newParams = params.toString()

    router.push(newParams ? `${pathname}?${newParams}` : pathname)
  }, [category.id, isActive, pathname, router, searchParams])

  return (
    <button
      className="group flex w-full items-center gap-3 text-left transition duration-300 hover:translate-x-1 hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c79e6f]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcf8f1]"
      onClick={() => setQuery()}
      type="button"
    >
      <span
        aria-hidden="true"
        className={clsx(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-[#f6eddf] shadow-[0_0_0_4px_rgba(255,248,240,0.7)] transition duration-300',
          isActive ? 'border-[#b98957]/90' : 'border-[#d8bb96]/75 group-hover:border-[#bf9362]',
        )}
      >
        <span className="absolute inset-[-4px] rounded-full border border-[#cca273]/60 motion-safe:animate-[spin_18s_linear_infinite]" />
        <span
          className={clsx(
            'absolute inset-[4px] rounded-full border border-dashed transition duration-300 motion-safe:animate-[spin_14s_linear_infinite_reverse]',
            isActive
              ? 'border-[#9f754c]/70 opacity-100'
              : 'border-[#b7926b]/45 opacity-70 group-hover:opacity-100',
          )}
        />
        <span
          className={clsx(
            'absolute inset-[13px] rounded-full transition duration-300',
            isActive ? 'bg-[#7d5a3c]' : 'bg-[#b89570] group-hover:bg-[#8f6846]',
          )}
        />
      </span>

      <span
        className={clsx(
          'min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm font-medium leading-none shadow-[0_10px_30px_rgba(84,53,28,0.06)] transition-all duration-300',
          isActive
            ? 'border-[#9f754c] bg-[#6a4b31] text-[#fff8ef]'
            : 'border-[#dcc4a8] bg-[#fffaf3]/90 text-[#654a31] group-hover:border-[#ba9062] group-hover:bg-[#fbf1e5] group-hover:text-[#4c3421]',
        )}
      >
        <span className="block truncate">{category.title}</span>
      </span>
    </button>
  )
}
