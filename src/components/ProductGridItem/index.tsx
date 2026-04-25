'use client'

import type { Product } from '@/payload-types'

import React from 'react'
import clsx from 'clsx'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Props = {
  product: Partial<Product>
  quickView?: boolean
  variant?: 'default' | 'square'
}

const NON_SQUARE_CATEGORY_SLUGS = ['cakes', 'entrees']

const normalizeImage = (product: Partial<Product>) => {
  if (!product.gallery?.[0] || typeof product.gallery[0] === 'string') {
    return false
  }

  return product.gallery[0].image && typeof product.gallery[0].image !== 'string'
    ? product.gallery[0].image
    : false
}

const normalizeSlug = (value: unknown): string =>
  typeof value === 'string' ? value.toLowerCase() : ''

const resolveCategoryTitle = (product: Partial<Product>) => {
  const firstCategory = product.categories?.find((category) => typeof category === 'object')

  if (!firstCategory) return 'Menu item'

  return firstCategory.title
}

const resolvePrice = (product: Partial<Product>) => {
  const variants = product.variants?.docs
  let price = product.priceInUSD

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant.priceInUSD &&
      typeof variant.priceInUSD === 'number'
    ) {
      price = variant.priceInUSD
    }
  }

  return price
}

const resolveDescription = (product: Partial<Product>) => {
  if (typeof product.meta === 'object') {
    return product.meta?.description?.replace(/\s+/g, ' ').trim() || ''
  }

  return ''
}

const hasNonSquareCategory = (product: Partial<Product>) => {
  return (
    product.categories?.some((category) => {
      if (!category || typeof category !== 'object') return false
      return NON_SQUARE_CATEGORY_SLUGS.includes(normalizeSlug(category.slug))
    }) ?? false
  )
}

const ProductCardFrame = ({
  description,
  isSquare,
  price,
  title,
  image,
}: {
  description: string
  isSquare: boolean
  image: ReturnType<typeof normalizeImage>
  price?: number | null
  title: string
}) => {
  const media = image ? (
    <Media
      className={clsx(
        'relative flex items-center justify-center bg-[#f7f2ea]',
        isSquare ? 'aspect-square' : 'aspect-[4/5]',
      )}
      height={isSquare ? 320 : 360}
      imgClassName="h-full w-full object-contain p-5"
      resource={image}
      width={isSquare ? 320 : 288}
    />
  ) : (
    <div className={clsx('bg-[#f7f2ea]', isSquare ? 'aspect-square' : 'aspect-[4/5]')} />
  )

  return (
    <article className="group flex h-full flex-col rounded-[12px] border border-transparent bg-transparent p-2 transition-colors duration-300 hover:bg-[#f1e9dd]">
      <div className="relative overflow-hidden rounded-[10px] bg-[#f7f2ea]">{media}</div>

      <div className="flex flex-1 flex-col gap-1.5 px-2 pb-2 pt-4">
        <h3
          className={clsx(
            'leading-tight text-[#2f2419]',
            isSquare ? 'text-base md:text-lg' : 'text-lg md:text-xl',
          )}
        >
          {title}
        </h3>
        {typeof price === 'number' ? (
          <p className="text-sm font-medium text-[#3a2b1d]">
            <Price amount={price} />
          </p>
        ) : null}
        {description ? (
          <p className="line-clamp-2 text-sm leading-5 text-[#6b5947]">{description}</p>
        ) : null}
      </div>
    </article>
  )
}

export const ProductGridItem: React.FC<Props> = ({
  product,
  quickView = false,
  variant = 'default',
}) => {
  const image = normalizeImage(product)
  const categoryTitle = resolveCategoryTitle(product)
  const description = resolveDescription(product)
  const price = resolvePrice(product)
  const title = product.title || 'Menu item'
  const isSquare = variant === 'square'
  const usesQuickView = quickView || isSquare || !hasNonSquareCategory(product)

  if (typeof product.slug !== 'string') return null

  const card = (
    <ProductCardFrame
      description={description}
      image={image}
      isSquare={isSquare}
      price={price}
      title={title}
    />
  )

  if (usesQuickView) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button
            aria-label={`Open details for ${title}`}
            className="flex h-full w-full cursor-pointer text-left"
            type="button"
          >
            {card}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{categoryTitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {image ? (
              <div className="overflow-hidden rounded-[18px] bg-[#f3ede3]">
                <Media
                  className="relative aspect-square"
                  height={360}
                  imgClassName="h-full w-full object-contain p-6"
                  resource={image}
                  width={360}
                />
              </div>
            ) : null}
            {description ? <p className="text-sm text-[#6b5947]">{description}</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return <div className="block h-full">{card}</div>
}
