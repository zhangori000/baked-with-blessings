import type { CartItem } from '@/components/Cart'

export const getCartItemTitle = (item: CartItem) => {
  if (item.product && typeof item.product === 'object' && item.product.title) {
    return item.product.title
  }

  return 'item'
}

export const formatCartItemQuantity = (quantity: number) =>
  `${quantity} ${quantity === 1 ? 'item' : 'items'}`
