'use client'

import { CartItem } from '@/components/Cart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { MinusIcon, PlusIcon } from 'lucide-react'
import React, { useMemo } from 'react'

export function EditItemQuantityButton({ type, item }: { item: CartItem; type: 'minus' | 'plus' }) {
  const { addItem, decrementItem, incrementItem, isLoading } = useCart()
  const productID =
    item.product && typeof item.product === 'object' ? item.product.id : item.product
  const variantID =
    item.variant && typeof item.variant === 'object' ? item.variant.id : item.variant
  const canAddSameItem = type === 'plus' && Boolean(productID)

  const disabled = useMemo(() => {
    if (!item.id && !canAddSameItem) return true

    const target =
      item.variant && typeof item.variant === 'object'
        ? item.variant
        : item.product && typeof item.product === 'object'
          ? item.product
          : null

    if (
      target &&
      typeof target === 'object' &&
      target.inventory !== undefined &&
      target.inventory !== null
    ) {
      if (type === 'plus' && item.quantity !== undefined && item.quantity !== null) {
        return item.quantity >= target.inventory
      }
    }

    return false
  }, [canAddSameItem, item, type])

  return (
    <form>
      <button
        disabled={disabled || isLoading}
        aria-label={type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'}
        className={clsx(
          'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-black/70 transition duration-200 hover:bg-black hover:text-white',
          {
            'cursor-not-allowed opacity-40': disabled || isLoading,
          },
        )}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()

          if (type === 'plus') {
            if (item.id) {
              void incrementItem(item.id)
            } else if (productID) {
              void addItem(
                {
                  product: productID,
                  ...(variantID ? { variant: variantID } : {}),
                },
                1,
              )
            }
          } else if (item.id) {
            void decrementItem(item.id)
          }
        }}
        type="button"
      >
        {type === 'plus' ? (
          <PlusIcon className="h-4 w-4" />
        ) : (
          <MinusIcon className="h-4 w-4" />
        )}
      </button>
    </form>
  )
}
