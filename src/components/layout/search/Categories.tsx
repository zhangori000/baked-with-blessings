import configPromise from '@payload-config'
import { getPayload } from 'payload'
import clsx from 'clsx'
import React, { Suspense } from 'react'

import { CategoryItem } from './Categories.client'

async function CategoryList() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    sort: 'menuOrder',
    select: {
      title: true,
      slug: true,
      menuOrder: true,
    },
  })

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.32em] text-[#9a795a]">
          Categories
        </h3>
        <span className="h-px flex-1 bg-gradient-to-r from-[#c9a57b]/80 to-transparent" />
      </div>

      <ul className="relative space-y-3 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-gradient-to-b before:from-[#d9bd99] before:via-[#c59b71] before:to-transparent">
        {categories.docs.map((category) => {
          return (
            <li className="relative z-10" key={category.id}>
              <CategoryItem category={category} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const skeletonMedallion = 'h-10 w-10 rounded-full border border-[#d4b089]/50 bg-[#efe5d7]/75'
const skeletonPill = 'h-12 flex-1 rounded-full border border-[#dcc4a8]/55 bg-[#f8f2ea]/85'

export function Categories() {
  return (
    <Suspense
      fallback={
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#caa780]/40" />
            <span className="h-px flex-1 bg-gradient-to-r from-[#c9a57b]/60 to-transparent" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="flex animate-pulse items-center gap-3" key={index}>
                <div className={clsx(skeletonMedallion)} />
                <div className={clsx(skeletonPill)} />
              </div>
            ))}
          </div>
        </section>
      }
    >
      <CategoryList />
    </Suspense>
  )
}
