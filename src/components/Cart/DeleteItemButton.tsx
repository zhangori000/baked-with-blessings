'use client'

import type { CartItem } from '@/components/Cart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { XIcon } from 'lucide-react'
import React from 'react'

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { isLoading, removeItem } = useCart()
  const itemId = item.id

  return (
    <form>
      <button
        aria-label="Remove cart item"
        className={clsx(
          'inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 transition duration-200 hover:cursor-pointer hover:border-black/20 hover:bg-black hover:text-white',
          {
            'cursor-not-allowed px-0 opacity-50': !itemId || isLoading,
          },
        )}
        disabled={!itemId || isLoading}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (itemId) removeItem(itemId)
        }}
        type="button"
      >
        <XIcon className="mx-px h-4 w-4" />
      </button>
    </form>
  )
}
