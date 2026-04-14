import { cn } from '@/utilities/cn'
import { ShoppingBag } from 'lucide-react'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  const safeQuantity = quantity ?? 0

  return (
    <button
      aria-label={quantity ? `Open cart with ${quantity} items` : 'Open cart'}
      className={cn(
        'group relative inline-flex h-12 items-center rounded-full border border-black/10 bg-white px-1 py-1 text-black transition-[border-color,background-color,transform] duration-300 hover:border-black/20 hover:bg-[#f3efe5]',
        className,
      )}
      type="button"
      {...rest}
    >
      <span className="absolute inset-[4px] rounded-full bg-black opacity-0 transition duration-300 ease-out group-hover:opacity-100" />
      <span className="relative z-10 inline-flex items-center gap-3 rounded-full px-4 text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-300 group-hover:text-white">
        <ShoppingBag className="h-4 w-4" />
        <span>Cart</span>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-black/10 bg-black/[0.04] px-2 py-1 text-[10px] leading-none transition-colors duration-300 group-hover:border-white/15 group-hover:bg-white/10">
          [{safeQuantity}]
        </span>
      </span>
    </button>
  )
}
