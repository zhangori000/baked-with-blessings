import { Product } from '@/payload-types'
import type React from 'react'

type Props = {
  product: Product
}

export const StockIndicator: React.FC<Props> = ({ product }) => {
  return (
    <div className="uppercase font-mono text-sm font-medium text-gray-500">
      <p>Made to order</p>
    </div>
  )
}
