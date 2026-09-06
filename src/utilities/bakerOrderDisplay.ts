import type { Order, Product, Variant } from '@/payload-types'
import { getVariantDisplayLabel } from '@/utilities/email/orderItemLabels'
import { classifyOrderPayment, type OrderPaymentKind } from '@/utilities/orderPayment'

export const bakerOrdersSort = '-createdAt' as const

export const bakerPaymentLabels: Record<OrderPaymentKind, string> = {
  paid_online: 'Paid online',
  pickup: 'Pay at pickup',
  unknown: 'Check payment',
  venmo: 'Venmo — verify',
}

type OrderItem = NonNullable<Order['items']>[number]

const looksLikeEmail = (value: string) => value.includes('@')

const looksLikePhone = (value: string) => /^\+?\d[\d\s().-]{6,}$/.test(value.trim())

const getProductTitle = (item: OrderItem) => {
  if (!item || typeof item !== 'object' || !('product' in item)) {
    return null
  }

  const productValue = item.product

  if (!productValue || typeof productValue !== 'object') {
    return null
  }

  const typedProduct = productValue as Product
  const variantValue = item.variant
  const typedVariant =
    variantValue && typeof variantValue === 'object' ? (variantValue as Variant) : null
  const variantLabel = getVariantDisplayLabel(typedProduct.title, typedVariant)

  if (!typedProduct.title) {
    return null
  }

  return variantLabel ? `${typedProduct.title} (${variantLabel})` : typedProduct.title
}

const getBatchFlavorSummary = (item: OrderItem) => {
  if (!Array.isArray(item.batchSelections) || item.batchSelections.length === 0) {
    return null
  }

  const flavors = item.batchSelections
    .map((selection) => {
      const product =
        selection.product && typeof selection.product === 'object'
          ? (selection.product as Product)
          : null
      const title = product?.title?.trim()

      if (!title) {
        return null
      }

      return `${selection.quantity}× ${title}`
    })
    .filter((label): label is string => Boolean(label))

  return flavors.length > 0 ? flavors.join(', ') : null
}

export const getBakerPaymentLabel = (
  order: Pick<Order, 'manualPaymentMethod' | 'stripePaymentIntentID'>,
) => bakerPaymentLabels[classifyOrderPayment(order)]

export const getBakerCustomerIdentity = ({
  customerEmail,
  customerName,
  guestContactValue,
  id,
}: {
  customerEmail?: null | string
  customerName?: null | string
  guestContactValue?: null | string
  id?: number
}) => {
  const name = customerName?.trim() || null
  const email = customerEmail?.trim() || null
  const guestContact = guestContactValue?.trim() || null
  const fallback = id != null ? `Order #${id}` : 'Order'

  if (name && !looksLikePhone(name) && !looksLikeEmail(name)) {
    return {
      primary: name,
      secondary: email && email !== name ? email : guestContact !== name ? guestContact : null,
    }
  }

  if (email) {
    const secondary = name && name !== email ? name : guestContact && guestContact !== email ? guestContact : null

    return {
      primary: email,
      secondary,
    }
  }

  if (name) {
    return {
      primary: name,
      secondary: guestContact && guestContact !== name ? guestContact : null,
    }
  }

  if (guestContact) {
    return {
      primary: guestContact,
      secondary: null,
    }
  }

  return {
    primary: fallback,
    secondary: null,
  }
}

export const summarizeOrderItems = (items: Order['items']) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Open to see items'
  }

  const summaries = items.map((item) => {
    const quantity = item.quantity || 1
    const title = getProductTitle(item)
    const flavors = getBatchFlavorSummary(item)

    if (title && flavors) {
      return `${quantity}× ${title} — ${flavors}`
    }

    if (title) {
      return `${quantity}× ${title}`
    }

    if (flavors) {
      return flavors
    }

    return `${quantity} item${quantity === 1 ? '' : 's'}`
  })

  const hasNamedItems = items.some((item) => Boolean(getProductTitle(item) || getBatchFlavorSummary(item)))

  if (!hasNamedItems) {
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    return `${totalQuantity} item${totalQuantity === 1 ? '' : 's'} — open to see flavors`
  }

  return summaries.join('; ')
}
