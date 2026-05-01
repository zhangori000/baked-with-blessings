import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { BakeryCard } from '@/design-system/bakery'
import { Product, Variant } from '@/payload-types'
type Props = {
  product: Product
  style?: 'compact' | 'default'
  variant?: Variant
  quantity?: number
  /**
   * Force all formatting to a particular currency.
   */
  currencyCode?: string
}

export const ProductItem: React.FC<Props> = ({
  product,
  style: _style = 'default',
  quantity,
  variant,
  currencyCode,
}) => {
  const { title } = product

  const metaImage =
    product.meta?.image && typeof product.meta?.image !== 'string' ? product.meta.image : undefined

  const firstGalleryImage =
    typeof product.gallery?.[0]?.image !== 'string' ? product.gallery?.[0]?.image : undefined

  let image = firstGalleryImage || metaImage

  const isVariant = Boolean(variant) && typeof variant === 'object'

  if (isVariant) {
    const imageVariant = product.gallery?.find((item) => {
      if (!item.variantOption) return false
      const variantOptionID =
        typeof item.variantOption === 'object' ? item.variantOption.id : item.variantOption

      const hasMatch = variant?.options?.some((option) => {
        if (typeof option === 'object') return option.id === variantOptionID
        else return option === variantOptionID
      })

      return hasMatch
    })

    if (imageVariant && typeof imageVariant.image !== 'string') {
      image = imageVariant.image
    }
  }

  const itemPrice = variant?.priceInUSD || product.priceInUSD

  return (
    <div className="flex items-center gap-4">
      <BakeryCard
        className="flex h-20 w-20 items-stretch justify-stretch p-2"
        radius="sm"
        spacing="none"
        tone="outline"
      >
        <div className="relative h-full w-full">
          {image && typeof image !== 'string' && (
            <Media
              className="relative h-full w-full"
              fill
              imgClassName="rounded-lg object-cover"
              resource={image}
            />
          )}
        </div>
      </BakeryCard>
      <div className="flex grow items-center justify-between gap-4 text-[#4b421d]">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold leading-6 text-[#4b421d]">{title}</p>
          {variant && (
            <p className="font-mono text-sm font-bold tracking-widest text-[#6f7a38]">
              {variant.options
                ?.map((option) => {
                  if (typeof option === 'object') return option.label
                  return null
                })
                .join(', ')}
            </p>
          )}
          <div>
            {'x'}
            {quantity}
          </div>
        </div>

        {itemPrice && quantity && (
          <div className="text-right">
            <p className="text-lg font-semibold text-[#4b421d]">Subtotal</p>
            <Price
              className="font-mono text-sm font-bold text-[#6f7a38]"
              amount={itemPrice * quantity}
              currencyCode={currencyCode}
            />
          </div>
        )}
      </div>
    </div>
  )
}
