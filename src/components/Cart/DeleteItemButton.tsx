'use client'

import type { CartItem } from '@/components/Cart'
import { BakeryPressable, useBakeryAnnouncer } from '@/design-system/bakery'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { XIcon } from 'lucide-react'
import React from 'react'

import { getCartItemTitle } from './cartItemLabels'

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { announce } = useBakeryAnnouncer()
  const { isLoading, removeItem } = useCart()
  const itemId = item.id
  const itemTitle = getCartItemTitle(item)

  const handleRemoveItem = async () => {
    if (!itemId) {
      return
    }

    try {
      await removeItem(itemId)
      announce(`${itemTitle} removed from cart.`)
    } catch {
      announce(`Unable to remove ${itemTitle} from cart.`, 'assertive')
    }
  }

  return (
    <form>
      <BakeryPressable
        aria-label={`Remove ${itemTitle} from cart`}
        className={clsx(
          'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-black/60 transition duration-200 hover:border-black/20 hover:bg-black hover:text-white',
          {
            'cursor-not-allowed px-0 opacity-50': !itemId || isLoading,
          },
        )}
        disabled={!itemId || isLoading}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()
          void handleRemoveItem()
        }}
        type="button"
      >
        <XIcon className="mx-px h-4 w-4" />
      </BakeryPressable>
    </form>
  )
}
