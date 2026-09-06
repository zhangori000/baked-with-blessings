import type { Payload } from 'payload'

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

const collectProductIDs = (items: Order['items']) => {
  const ids = new Set<number>()

  for (const item of items ?? []) {
    if (typeof item.product === 'number') {
      ids.add(item.product)
    }

    for (const selection of item.batchSelections ?? []) {
      if (typeof selection.product === 'number') {
        ids.add(selection.product)
      }
    }
  }

  return [...ids]
}

const attachProductTitles = (
  items: NonNullable<Order['items']>,
  titles: Map<number, string>,
): NonNullable<Order['items']> =>
  items.map((item) => ({
    ...item,
    batchSelections: Array.isArray(item.batchSelections)
      ? item.batchSelections.map((selection) => ({
          ...selection,
          product:
            typeof selection.product === 'number'
              ? { title: titles.get(selection.product) || null }
              : selection.product,
        }))
      : item.batchSelections,
    product:
      typeof item.product === 'number'
        ? { title: titles.get(item.product) || null }
        : item.product,
  })) as NonNullable<Order['items']>

export const summarizeOrderItemsForAdmin = async ({
  items,
  payload,
}: {
  items: Order['items']
  payload: Pick<Payload, 'find'>
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    return summarizeOrderItems(items)
  }

  const productIDs = collectProductIDs(items)

  if (productIDs.length === 0) {
    return summarizeOrderItems(items)
  }

  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: productIDs.length,
    overrideAccess: true,
    pagination: false,
    select: {
      title: true,
    },
    where: {
      id: {
        in: productIDs,
      },
    },
  })

  const titles = new Map(products.docs.map((product) => [product.id, product.title]))

  return summarizeOrderItems(attachProductTitles(items, titles))
}
