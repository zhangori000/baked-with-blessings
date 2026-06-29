import type { CollectionAfterChangeHook, Payload } from 'payload'

import type { Order, Product, Variant } from '@/payload-types'
import { BAKERY_INBOX, getCustomerContactEmails } from '@/utilities/email/contactChannels'
import { decorateEmailEnvelope } from '@/utilities/email/decorateEmailEnvelope'
import { getVariantDisplayLabel } from '@/utilities/email/orderItemLabels'
import { getServerSideURL } from '@/utilities/getURL'
import { classifyOrderPayment } from '@/utilities/orderPayment'

export const SKIP_CUSTOMER_ORDER_CONFIRMATION = 'skipCustomerOrderConfirmation'

type OrderWithConfirmation = Order & {
  customerNotificationSentAt?: null | string
  manualPaymentMethod?: null | string
  stripePaymentIntentID?: null | string
}

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

const getOrderItemLines = (order: Order): string[] => {
  const lines: string[] = []

  for (const item of order.items || []) {
    const product =
      item.product && typeof item.product === 'object' ? (item.product as Product) : null
    const variant =
      item.variant && typeof item.variant === 'object' ? (item.variant as Variant) : null
    const title = product?.title || 'Bakery item'
    const variantLabel = getVariantDisplayLabel(product?.title, variant)
    const quantity = typeof item.quantity === 'number' ? item.quantity : 1

    lines.push(`${variantLabel ? `${title} (${variantLabel})` : title} × ${quantity}`)

    for (const selection of item.batchSelections || []) {
      const selectionProduct =
        selection.product && typeof selection.product === 'object'
          ? (selection.product as Product)
          : null

      if (selectionProduct?.title) {
        lines.push(`  • ${selectionProduct.title} × ${selection.quantity}`)
      }
    }
  }

  return lines.length ? lines : ['Order items were not recorded.']
}

const getCustomerEmail = (order: Order): null | string => {
  const customer = typeof order.customer === 'object' && order.customer ? order.customer : null

  if (customer?.email && typeof customer.email === 'string') {
    return customer.email
  }

  if (order.customerEmail && typeof order.customerEmail === 'string') {
    return order.customerEmail
  }

  return null
}

type BuildCustomerOrderConfirmationArgs = {
  companyName: string
  contactEmails: string[]
  order: Order
  orderURL: string
}

/**
 * Pure builder for the customer receipt. Returns the rendered envelope body so
 * it can be unit-tested and previewed without sending; the send wrapper adds the
 * recipient, the bakery BCC, the Reply-To, and the non-production banner.
 */
export const buildCustomerOrderConfirmation = ({
  companyName,
  contactEmails,
  order,
  orderURL,
}: BuildCustomerOrderConfirmationArgs) => {
  const total = formatMoney(order.amount, order.currency || 'USD')
  const itemLines = getOrderItemLines(order)
  const paymentKind = classifyOrderPayment(order)

  const paymentParagraph =
    paymentKind === 'pickup'
      ? 'Nothing has been charged. You pay when you pick up your order: card, Venmo, or cash at the handoff. The baker will personally message you through the contact info on your account to arrange the pickup.'
      : paymentKind === 'venmo'
        ? 'You reported a Venmo payment for this order. The baker will verify it and personally message you through the contact info on your account.'
        : 'Your payment went through, and the baker can start preparing your order.'

  const contactList = contactEmails.join(', ')
  const contactNote =
    "We're a brand-new family bakery (just Kayla and Orien for now), so you'll always hear back from us personally. Thanks so much for supporting a small business as we get started."

  const subject = `Your ${companyName} order #${order.id} · ${total}`

  const text = [
    'Thank you for your order!',
    '',
    `Order #${order.id}`,
    `Total: ${total}`,
    '',
    paymentParagraph,
    '',
    'What you ordered:',
    ...itemLines,
    '',
    `View your order (log in with your account): ${orderURL}`,
    '',
    `Questions about your order? Reply to this email, or reach us anytime at ${contactList}.`,
    contactNote,
    '',
    'Thanks again,',
    companyName,
  ].join('\n')

  const contactLinks = contactEmails
    .map((email) => `<a href="mailto:${escapeHTML(email)}">${escapeHTML(email)}</a>`)
    .join(', ')

  const html = `
    <h1>Thank you for your order!</h1>
    <p><strong>Order #${escapeHTML(order.id)}</strong> · ${escapeHTML(total)}</p>
    <p>${escapeHTML(paymentParagraph)}</p>
    <h2>What you ordered</h2>
    <ul>${itemLines.map((line) => `<li>${escapeHTML(line.trim())}</li>`).join('')}</ul>
    <p><a href="${escapeHTML(orderURL)}">View your order</a> (log in with your account).</p>
    <p style="font-size:14px;color:#5b5347;">Questions about your order? Reply to this email, or reach us anytime at ${contactLinks}. ${escapeHTML(contactNote)}</p>
    <p>Thanks again,<br/>${escapeHTML(companyName)}</p>
  `

  return { html, subject, text }
}

export const sendCustomerOrderConfirmation = async ({
  order,
  payload,
}: {
  order: Order
  payload: Payload
}) => {
  const to = getCustomerEmail(order)

  if (!to) {
    // Phone-only signups have no email address. The order page in their
    // account remains the receipt; nothing to send.
    payload.logger.info({
      msg: 'customer_confirmation.skipped_no_email',
      orderID: order.id,
    })

    return false
  }

  const companyName =
    process.env.COMPANY_NAME?.trim() || process.env.SITE_NAME?.trim() || 'Baked with Blessings'
  const serverURL = getServerSideURL()
  const orderURL = `${serverURL}/orders/${order.id}`
  const contactEmails = getCustomerContactEmails()
  const { html, subject, text } = buildCustomerOrderConfirmation({
    companyName,
    contactEmails,
    order,
    orderURL,
  })

  await payload.sendEmail(
    decorateEmailEnvelope({
      bcc: BAKERY_INBOX,
      html,
      replyTo: contactEmails,
      subject,
      text,
      to,
    }),
  )

  return true
}

export const sendCustomerOrderConfirmationAfterChange: CollectionAfterChangeHook = async ({
  context,
  doc,
  operation,
  req,
}) => {
  if (context?.[SKIP_CUSTOMER_ORDER_CONFIRMATION] || operation !== 'create') {
    return doc
  }

  const order = doc as OrderWithConfirmation

  if (
    order.customerNotificationSentAt ||
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

    const sent = await sendCustomerOrderConfirmation({
      order: expandedOrder,
      payload: req.payload,
    })

    if (sent) {
      await req.payload.update({
        collection: 'orders',
        context: {
          [SKIP_CUSTOMER_ORDER_CONFIRMATION]: true,
        },
        data: {
          customerNotificationSentAt: new Date().toISOString(),
        },
        id: order.id,
        overrideAccess: true,
        req,
      })
    }
  } catch (error) {
    req.payload.logger.error(
      { err: error, orderID: order.id },
      'Customer order confirmation failed',
    )
  }

  return doc
}
