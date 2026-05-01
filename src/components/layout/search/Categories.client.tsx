'use client'
import React, { useCallback, useMemo } from 'react'

import { BakeryPressable } from '@/design-system/bakery'
import type { Category } from '@/payload-types'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'

import { FilterOptionContent } from './FilterOptionShell'

type CategoryItemData = Pick<Category, 'id' | 'title'>

type Props = {
  category: CategoryItemData
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
    <BakeryPressable
      className="group flex w-full items-center gap-3 bg-transparent p-0 text-left transition duration-300 hover:translate-x-1 hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c79e6f]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcf8f1]"
      onClick={() => setQuery()}
      type="button"
    >
      <FilterOptionContent active={isActive} title={category.title} />
    </BakeryPressable>
  )
}
