import type { CollectionAfterChangeHook, Payload } from 'payload'

import type { Order, Product, Variant } from '@/payload-types'
import { getOwnerNotificationRecipients } from '@/utilities/email/contactChannels'
import { decorateEmailEnvelope } from '@/utilities/email/decorateEmailEnvelope'
import { getVariantDisplayLabel } from '@/utilities/email/orderItemLabels'
import { getServerSideURL } from '@/utilities/getURL'
import { classifyOrderPayment } from '@/utilities/orderPayment'

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
  const variantLabel = getVariantDisplayLabel(typedProduct.title, typedVariant)

  return variantLabel
    ? `${typedProduct.title} (${variantLabel})`
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

type OwnerPaymentSummary = {
  devNotes: string[]
  ownerSummary: string[]
  subjectTag: string
}

/**
 * Splits an order's payment situation for the TWO people who read this email:
 *   - ownerSummary → plain language for the baker: did money arrive, and what
 *     to do now. No Stripe/PaymentIntent jargon.
 *   - devNotes     → the raw fields for the developer, fenced off at the bottom.
 *   - subjectTag   → the headline that lands in the inbox subject line.
 *
 * Mirrors the three checkout paths the customer confirmation email already
 * distinguishes. The afterChange guard only fires when a manual method OR a
 * Stripe PaymentIntent is present, so the branches are exhaustive in practice;
 * the trailing fallback is a defensive "something looks off" case.
 */
export const getOwnerPaymentSummary = (order: Order): OwnerPaymentSummary => {
  // Shared classifier so this email and the customer receipt never disagree
  // about the same order (a Stripe payment wins over a manual method).
  const kind = classifyOrderPayment(order)

  if (kind === 'paid_online') {
    return {
      devNotes: [
        `manualPaymentMethod: ${order.manualPaymentMethod || '(none)'}`,
        `stripePaymentIntentID: ${order.stripePaymentIntentID}`,
      ],
      ownerSummary: [
        'How they paid: card, online through Stripe. The payment already went through.',
        'What to do: nothing for payment. Just start preparing the order.',
      ],
      subjectTag: 'paid online',
    }
  }

  if (kind === 'venmo') {
    const reportedAt = order.manualPaymentReportedAt
      ? new Date(order.manualPaymentReportedAt).toLocaleString('en-US')
      : 'not recorded'

    return {
      devNotes: [
        'manualPaymentMethod: venmo',
        `manualPaymentStatus: ${order.manualPaymentStatus || 'reported_sent'}`,
        `manualPaymentHandle: ${order.manualPaymentHandle || '@bakedwithblessings'}`,
        `manualPaymentReportedAt: ${reportedAt}`,
        'stripePaymentIntentID: (none)',
      ],
      ownerSummary: [
        'How they paid: Venmo. The customer says they already sent it.',
        'What to do: open Venmo and confirm the money actually arrived before you treat this order as paid.',
      ],
      subjectTag: 'Venmo, please verify',
    }
  }

  if (kind === 'pickup') {
    return {
      devNotes: [
        'manualPaymentMethod: in_person',
        `manualPaymentStatus: ${order.manualPaymentStatus || '(unset)'}`,
        'stripePaymentIntentID: (none, not paid online)',
      ],
      ownerSummary: [
        'How they paid: not yet. This is a pay-at-pickup order, so nothing has been charged.',
        'What to do: collect payment (cash, card, or Venmo) when you hand the order over.',
      ],
      subjectTag: 'pay at pickup, not paid yet',
    }
  }

  return {
    devNotes: [
      'manualPaymentMethod: (none)',
      'stripePaymentIntentID: (none)',
      'No payment signal was recorded on this order.',
    ],
    ownerSummary: [
      'How they paid: unknown. No payment information was recorded on this order.',
      'What to do: open the order in the admin and check before fulfilling it.',
    ],
    subjectTag: 'check payment',
  }
}

/** Bold the "Label:" prefix of a "Label: value" line for the HTML body. */
const boldLabel = (line: string) => {
  const idx = line.indexOf(':')
  return idx === -1
    ? escapeHTML(line)
    : `<strong>${escapeHTML(line.slice(0, idx + 1))}</strong>${escapeHTML(line.slice(idx + 1))}`
}

type BuildOwnerOrderEmailArgs = {
  adminURL: string
  companyName: string
  order: Order
}

/**
 * Pure builder for the owner notification. Returns the rendered envelope so it
 * can be unit-tested and previewed without sending; the send wrapper below only
 * adds recipients and the non-production banner.
 */
export const buildOwnerOrderEmail = ({ adminURL, companyName, order }: BuildOwnerOrderEmailArgs) => {
  const total = formatMoney(order.amount, order.currency || 'USD')
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US') : 'Unknown'
  const contactLines = getCustomerContactLines(order)
  const addressLines = getAddressLines(order)
  const itemLines = getItemLines(order)
  const { devNotes, ownerSummary, subjectTag } = getOwnerPaymentSummary(order)
  const devNotesWithMeta = [`order.id: ${order.id}`, `order.status: ${order.status || 'unknown'}`, ...devNotes]

  const subject = `${companyName} order #${order.id} · ${total} · ${subjectTag}`

  const text = [
    `New order #${order.id}`,
    '',
    `Total: ${total}`,
    `Placed: ${createdAt}`,
    '',
    'PAYMENT',
    ...ownerSummary,
    '',
    'Customer',
    ...contactLines,
    '',
    'Items',
    ...itemLines,
    '',
    'Delivery details',
    ...addressLines,
    '',
    'Dev notes (technical):',
    ...devNotesWithMeta,
    `Open in admin: ${adminURL}`,
  ].join('\n')

  const html = `
    <h1 style="margin:0 0 4px;">New order #${escapeHTML(order.id)}</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#5b5347;"><strong>${escapeHTML(total)}</strong> · placed ${escapeHTML(createdAt)}</p>

    <div style="background:#f6f3ee;border:1px solid #e7e0d4;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
      ${ownerSummary.map((line) => `<p style="margin:0 0 6px;font-size:15px;line-height:1.45;">${boldLabel(line)}</p>`).join('')}
    </div>

    <h2 style="font-size:15px;margin:16px 0 4px;">Customer</h2>
    ${getHTMLList(contactLines)}

    <h2 style="font-size:15px;margin:16px 0 4px;">Items</h2>
    ${getHTMLList(itemLines)}

    <h2 style="font-size:15px;margin:16px 0 4px;">Delivery details</h2>
    ${getHTMLList(addressLines)}

    <hr style="border:none;border-top:1px solid #e7e0d4;margin:24px 0 12px;" />
    <p style="margin:0 0 6px;font-size:12px;color:#8a8275;"><strong>🛠 Dev notes (technical)</strong></p>
    <ul style="margin:0;padding-left:18px;font-size:12px;color:#8a8275;">${devNotesWithMeta
      .map((line) => `<li>${escapeHTML(line)}</li>`)
      .join('')}</ul>
    <p style="margin:10px 0 0;font-size:12px;"><a href="${escapeHTML(adminURL)}">Open this order in Payload admin</a></p>
  `

  return { html, subject, text }
}

export const sendOwnerOrderNotification = async ({
  order,
  payload,
}: SendOwnerOrderNotificationArgs) => {
  const to = getOwnerNotificationRecipients()

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
  const { html, subject, text } = buildOwnerOrderEmail({ adminURL, companyName, order })

  await payload.sendEmail(
    decorateEmailEnvelope({
      html,
      subject,
      text,
      to,
    }),
  )

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
