'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { GridTileImage } from '@/components/Grid/tile'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  gallery: NonNullable<Product['gallery']>
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const searchParams = useSearchParams()
  const searchKey = useMemo(() => searchParams.toString(), [searchParams])
  const [manualSelection, setManualSelection] = React.useState<{
    index: number
    searchKey: string
  } | null>(null)
  const [api, setApi] = React.useState<CarouselApi>()

  const requestedIndex = useMemo(() => {
    const values = Array.from(searchParams.values())

    return gallery.findIndex((item) => {
      if (!item.variantOption) return false

      let variantID: DefaultDocumentIDType

      if (typeof item.variantOption === 'object') {
        variantID = item.variantOption.id
      } else variantID = item.variantOption

      return Boolean(values.find((value) => value === String(variantID)))
    })
  }, [searchParams, gallery])

  useEffect(() => {
    if (requestedIndex !== -1 && api) {
      api.scrollTo(requestedIndex, true)
    }
  }, [api, requestedIndex])

  const manualIndex = manualSelection?.searchKey === searchKey ? manualSelection.index : null
  const activeIndex = Math.min(
    gallery.length - 1,
    Math.max(0, manualIndex ?? (requestedIndex === -1 ? 0 : requestedIndex)),
  )

  return (
    <div>
      <div className="relative w-full overflow-hidden mb-8">
        <Media
          resource={gallery[activeIndex].image}
          className="w-full"
          imgClassName="w-full rounded-lg"
        />
      </div>

      <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent>
          {gallery.map((item, i) => {
            if (typeof item.image !== 'object') return null

            return (
              <CarouselItem
                className="basis-1/5"
                key={`${item.image.id}-${i}`}
                onClick={() => setManualSelection({ index: i, searchKey })}
              >
                <GridTileImage active={i === activeIndex} media={item.image} />
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
