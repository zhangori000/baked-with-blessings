import type { CollectionAfterChangeHook, Payload } from 'payload'

import type { Order, Product, Variant } from '@/payload-types'
import { parseEmailRecipients } from '@/utilities/email/recipients'
import { getServerSideURL } from '@/utilities/getURL'

export const SKIP_OWNER_ORDER_NOTIFICATION = 'skipOwnerOrderNotification'

type OrderWithOwnerNotification = Order & {
  manualPaymentMethod?: null | string
  ownerNotificationSentAt?: null | string
  stripePaymentIntentID?: null | string
}

type SendOwnerOrderNotificationArgs = {
  order: Order
  payload: Payload
}

type OrderItem = NonNullable<Order['items']>[number]

const escapeHTML = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatMoney = (amount?: null | number, currency = 'USD') => {
  if (typeof amount !== 'number') {
    return 'Not recorded'
  }

  return new Intl.NumberFormat('en-US', {
    currency,
    style: 'currency',
  }).format(amount / 100)
}

const getCustomerContactLines = (order: Order) => {
  const lines: string[] = []
  const customer = typeof order.customer === 'object' && order.customer ? order.customer : null

  if (customer?.name) {
    lines.push(`Customer: ${customer.name}`)
  }

  if (customer?.email || order.customerEmail) {
    lines.push(`Email: ${customer?.email || order.customerEmail}`)
  }

  if (customer?.phone) {
    lines.push(`Account phone: ${customer.phone}`)
  }

  if (order.guestContactMethod && order.guestContactValue) {
    lines.push(`Guest contact: ${order.guestContactMethod} - ${order.guestContactValue}`)
  }

  if (order.shippingAddress?.phone) {
    lines.push(`Delivery phone: ${order.shippingAddress.phone}`)
  }

  if (!lines.length) {
    lines.push('No customer contact was recorded on the order.')
  }

  return lines
}

const getAddressLines = (order: Order) => {
  const address = order.shippingAddress

  if (!address) {
    return ['No delivery address was recorded.']
  }

  const name = [address.firstName, address.lastName].filter(Boolean).join(' ')
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(', ')

  return [
    name,
    address.company,
    address.addressLine1,
    address.addressLine2,
    cityLine,
    address.country,
  ].filter((line): line is string => Boolean(line))
}

const getProductTitle = (item: OrderItem) => {
  if (!item || typeof item !== 'object' || !('product' in item)) {
    return 'Unknown item'
  }

  const productValue = item.product

  if (!productValue || typeof productValue !== 'object') {
    return 'Unknown item'
  }

  const typedProduct = productValue as Product
  const variantValue = item.variant
  const typedVariant =
    variantValue && typeof variantValue === 'object' ? (variantValue as Variant) : null

  return typedVariant?.title
    ? `${typedProduct.title} (${typedVariant.title})`
    : typedProduct.title || 'Unknown item'
}

const getBatchSelectionLines = (item: OrderItem, indentation = '  ') => {
  if (!Array.isArray(item.batchSelections) || item.batchSelections.length === 0) {
    return []
  }

  return item.batchSelections.map((selection) => {
    const product =
      selection.product && typeof selection.product === 'object'
        ? (selection.product as Product)
        : null

    return `${indentation}- ${selection.quantity} x ${product?.title || 'Selected item'}`
  })
}

const getItemLines = (order: Order) => {
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return ['No line items were recorded.']
  }

  return order.items.flatMap((item) => [
    `${item.quantity} x ${getProductTitle(item)}`,
    ...getBatchSelectionLines(item),
  ])
}

const getHTMLList = (lines: string[]) =>
  `<ul>${lines.map((line) => `<li>${escapeHTML(line)}</li>`).join('')}</ul>`

export const sendOwnerOrderNotification = async ({
  order,
  payload,
}: SendOwnerOrderNotificationArgs) => {
  const to = parseEmailRecipients(process.env.ORDER_NOTIFICATION_TO)

  if (!to.length) {
    payload.logger.warn(
      'ORDER_NOTIFICATION_TO is not configured; skipping owner order notification.',
    )
    return false
  }

  const companyName =
    process.env.COMPANY_NAME?.trim() || process.env.SITE_NAME?.trim() || 'Baked with Blessings'
  const serverURL = getServerSideURL()
  const adminURL = `${serverURL}/admin/collections/orders/${order.id}`
  const total = formatMoney(order.amount, order.currency || 'USD')
  const contactLines = getCustomerContactLines(order)
  const addressLines = getAddressLines(order)
  const itemLines = getItemLines(order)
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US') : 'Unknown'
  const isManualVenmoOrder = order.manualPaymentMethod === 'venmo'
  const paymentLines = isManualVenmoOrder
    ? [
        'Payment method: Venmo',
        `Venmo handle shown to customer: ${order.manualPaymentHandle || '@bakedwithblessings'}`,
        `Manual payment status: ${order.manualPaymentStatus || 'reported_sent'}`,
        `Customer clicked sent at: ${
          order.manualPaymentReportedAt
            ? new Date(order.manualPaymentReportedAt).toLocaleString('en-US')
            : 'Not recorded'
        }`,
        'Important: verify the Venmo payment manually before treating this as paid.',
      ]
    : [`Stripe PaymentIntent: ${order.stripePaymentIntentID || 'Not recorded'}`]
  const subjectPrefix = isManualVenmoOrder ? 'Venmo order reported' : 'New order'
  const subject = `${companyName} ${subjectPrefix.toLowerCase()} #${order.id} - ${total}`

  const text = [
    `${subjectPrefix} #${order.id}`,
    '',
    `Total: ${total}`,
    `Status: ${order.status || 'unknown'}`,
    `Created: ${createdAt}`,
    ...paymentLines,
    '',
    'Customer contact',
    ...contactLines,
    '',
    'Items',
    ...itemLines,
    '',
    'Delivery details',
    ...addressLines,
    '',
    `Open in Payload admin: ${adminURL}`,
  ].join('\n')

  const html = `
    <h1>${escapeHTML(subjectPrefix)} #${escapeHTML(order.id)}</h1>
    <p><strong>Total:</strong> ${escapeHTML(total)}</p>
    <p><strong>Status:</strong> ${escapeHTML(order.status || 'unknown')}</p>
    <p><strong>Created:</strong> ${escapeHTML(createdAt)}</p>
    <h2>Payment</h2>
    ${getHTMLList(paymentLines)}

    <h2>Customer contact</h2>
    ${getHTMLList(contactLines)}

    <h2>Items</h2>
    ${getHTMLList(itemLines)}

    <h2>Delivery details</h2>
    ${getHTMLList(addressLines)}

    <p><a href="${escapeHTML(adminURL)}">Open this order in Payload admin</a></p>
  `

  await payload.sendEmail({
    html,
    subject,
    text,
    to,
  })

  return true
}

export const sendOwnerOrderNotificationAfterChange: CollectionAfterChangeHook = async ({
  context,
  doc,
  operation,
  req,
}) => {
  if (context?.[SKIP_OWNER_ORDER_NOTIFICATION] || operation !== 'create') {
    return doc
  }

  const order = doc as OrderWithOwnerNotification

  if (
    order.ownerNotificationSentAt ||
    (!order.stripePaymentIntentID && !order.manualPaymentMethod)
  ) {
    return doc
  }

  if (order.status !== 'processing' && order.status !== 'completed') {
    return doc
  }

  try {
    const expandedOrder = (await req.payload.findByID({
      collection: 'orders',
      depth: 2,
      id: order.id,
      overrideAccess: true,
      req,
    })) as Order

    const sent = await sendOwnerOrderNotification({
      order: expandedOrder,
      payload: req.payload,
    })

    if (sent) {
      await req.payload.update({
        collection: 'orders',
        context: {
          [SKIP_OWNER_ORDER_NOTIFICATION]: true,
        },
        data: {
          ownerNotificationSentAt: new Date().toISOString(),
        },
        id: order.id,
        overrideAccess: true,
        req,
      })
    }
  } catch (error) {
    req.payload.logger.error({ err: error, orderID: order.id }, 'Owner order notification failed')
  }

  return doc
}
