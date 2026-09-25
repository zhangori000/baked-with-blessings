import { APIError } from 'payload'
import type { Payload } from 'payload'

import type { BakeryUpdate, Customer, Media, Product } from '@/payload-types'
import { getCustomerContactEmails } from '@/utilities/email/contactChannels'
import { decorateEmailEnvelope } from '@/utilities/email/decorateEmailEnvelope'
import { createEmailUnsubscribeToken } from '@/utilities/email/emailUnsubscribeToken'
import { getServerSideURL } from '@/utilities/getURL'
import { getTwilioMessagingConfig, sendTwilioSms } from '@/utilities/sms/twilioMessages'

import {
  type BakeryUpdateChannel,
  type BakeryUpdateDraft,
  type BakeryUpdateMarket,
  type BakeryUpdateTemplate,
  bakeryUpdateSmsDetails,
  buildBakeryUpdateSms,
  emptyBakeryUpdateMarket,
  formatMailingAddress,
  missingMailingAddressMessage,
  validateBakeryUpdateDraft,
} from './content'
import {
  BAKERY_EMAIL_LOGO_PATH,
  type BakeryUpdateEmailFeature,
  type BakeryUpdateEmailFlavor,
  buildBakeryUpdateEmail,
} from './email'
import {
  type BakeryUpdateTally,
  type ClaimedDelivery,
  type ChannelTally,
  claimQueuedDeliveries,
  emptyChannelTally,
  failInterruptedDeliveries,
  type QueuedRecipient,
  queueDeliveries,
  tallyDeliveries,
} from './store'

export type SendOutcome = { error: string; ok: false } | { ok: true; providerMessageId?: string }

export type BakeryUpdateEmail = {
  headers: Record<string, string>
  html: string
  subject: string
  text: string
  to: string
}

export type BakeryUpdateSenders = {
  email: (email: BakeryUpdateEmail) => Promise<SendOutcome>
  sms: (text: { body: string; to: string }) => Promise<SendOutcome>
}

export type BakeryUpdateProgress = {
  createdAt: string
  done: boolean
  email: ChannelTally
  id: number
  sendEmail: boolean
  sendText: boolean
  sms: ChannelTally
  status: BakeryUpdate['status']
  subject: string
}

export const getBakeryCompanyName = () =>
  process.env.COMPANY_NAME?.trim() || process.env.SITE_NAME?.trim() || 'Baked with Blessings'

export const areBakeryTextsReady = () => Boolean(getTwilioMessagingConfig())

// Gmail and other inboxes fetch email images from their own servers, which
// cannot get past the Vercel login on preview deployments. The logo is a
// public file, so it always loads from the production site.
export const getBakeryEmailLinks = () => {
  const siteURL = getServerSideURL()
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const assetsURL = productionHost ? `https://${productionHost}` : siteURL

  return { logoURL: `${assetsURL}${BAKERY_EMAIL_LOGO_PATH}`, siteURL }
}

// The blob adapter stores uploads under their filename at this public host.
// Inboxes can load that URL directly, while /api/media on a preview deployment
// sits behind the Vercel login. Without a blob token (local dev) files are
// served by this app.
const getPublicMediaBaseURL = () => {
  const override = process.env.STORAGE_VERCEL_BLOB_BASE_URL?.trim()

  if (override) {
    return override.replace(/\/$/, '')
  }

  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.match(
    /^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i,
  )?.[1]?.toLowerCase()

  return storeId ? `https://${storeId}.public.blob.vercel-storage.com` : null
}

export const getPublicMediaURL = (media: Media | null | number | undefined): null | string => {
  if (!media || typeof media !== 'object') {
    return null
  }

  // About 500px wide in the email, so the 768px size stays sharp on phones.
  const file = [media.sizes?.poster, media.sizes?.tablet, media.sizes?.card, media].find(
    (candidate) => candidate?.filename && candidate.url,
  )

  if (!file?.filename || !file.url) {
    return null
  }

  const blobBaseURL = getPublicMediaBaseURL()

  if (blobBaseURL) {
    return `${blobBaseURL}/${encodeURIComponent(file.filename)}`
  }

  return /^https?:\/\//.test(file.url) ? file.url : `${getServerSideURL()}${file.url}`
}

const formatPriceLabel = (product: Pick<Product, 'priceInUSD' | 'priceInUSDEnabled'>) =>
  product.priceInUSDEnabled && typeof product.priceInUSD === 'number' && product.priceInUSD > 0
    ? new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(
        product.priceInUSD / 100,
      )
    : null

export type BakeryUpdateProduct = Omit<BakeryUpdateEmailFlavor, 'kind'> & { id: number }

const toBakeryUpdateProduct = (
  product: Pick<Product, 'gallery' | 'id' | 'priceInUSD' | 'priceInUSDEnabled' | 'title'>,
): BakeryUpdateProduct => ({
  id: product.id,
  imageURL: getPublicMediaURL(product.gallery?.[0]?.image),
  name: product.title,
  priceLabel: formatPriceLabel(product),
})

const productSelect = {
  gallery: true,
  priceInUSD: true,
  priceInUSDEnabled: true,
  title: true,
} as const

export const listBakeryUpdateProducts = async (payload: Payload) => {
  const result = await payload.find({
    collection: 'products',
    depth: 1,
    overrideAccess: true,
    pagination: false,
    select: productSelect,
    sort: 'title',
    where: { _status: { equals: 'published' } },
  })

  return result.docs.map(toBakeryUpdateProduct)
}

export const findBakeryUpdateProduct = async (
  payload: Payload,
  id: null | number | Product | undefined,
): Promise<BakeryUpdateProduct | null> => {
  const productID = typeof id === 'object' ? id?.id : id

  if (!productID) {
    return null
  }

  const product = await payload.findByID({
    collection: 'products',
    depth: 1,
    disableErrors: true,
    id: productID,
    overrideAccess: true,
    select: productSelect,
  })

  return product ? toBakeryUpdateProduct(product) : null
}

type TemplateFields = {
  market: BakeryUpdateMarket
  productID: null | number
  template: BakeryUpdateTemplate
}

// Keeps only the fields the chosen template uses, trimmed, so a leftover
// cookie on a market update is not stored.
const templateFieldsFromDraft = (draft: BakeryUpdateDraft): TemplateFields => {
  const template = draft.template ?? 'note'
  const market = draft.market ?? emptyBakeryUpdateMarket()

  return {
    market:
      template === 'market'
        ? {
            address: market.address.trim(),
            date: market.date.trim(),
            hours: market.hours.trim(),
            place: market.place.trim(),
          }
        : emptyBakeryUpdateMarket(),
    productID: template === 'flavor' ? (draft.productID ?? null) : null,
    template,
  }
}

export const templateFieldsFromUpdate = (
  update: Pick<BakeryUpdate, 'market' | 'product' | 'template'>,
): TemplateFields => ({
  market: {
    address: update.market?.address ?? '',
    date: update.market?.date ?? '',
    hours: update.market?.hours ?? '',
    place: update.market?.place ?? '',
  },
  productID:
    typeof update.product === 'object' ? (update.product?.id ?? null) : (update.product ?? null),
  template: update.template ?? 'note',
})

/** The block above the message. A flavor whose cookie was deleted falls back to a plain note. */
export const loadBakeryUpdateEmailFeature = async (
  payload: Payload,
  { market, productID, template }: TemplateFields,
): Promise<BakeryUpdateEmailFeature | null> => {
  if (template === 'market') {
    return { ...market, kind: 'market' }
  }

  if (template === 'flavor') {
    const product = await findBakeryUpdateProduct(payload, productID)
    return product ? { ...product, kind: 'flavor' } : null
  }

  return null
}

export const getBakeryMailingAddress = async (payload: Payload): Promise<null | string> => {
  const settings = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: 'store-settings',
  })

  return formatMailingAddress(settings.mailingAddress)
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const errorMessage = (error: unknown) =>
  (error instanceof Error ? error.message : String(error || 'Unknown error')).slice(0, 300)

const isRateLimited = (error: unknown) =>
  (error as { status?: unknown })?.status === 429 && /rate_limit/i.test(errorMessage(error))

export const createBakeryUpdateSenders = (payload: Payload): BakeryUpdateSenders => ({
  email: async ({ headers, html, subject, text, to }) => {
    const send = () =>
      payload.sendEmail(
        decorateEmailEnvelope({
          headers,
          html,
          replyTo: getCustomerContactEmails(),
          subject,
          text,
          to,
        }),
      )

    let result: unknown

    try {
      result = await send()
    } catch (error) {
      if (!isRateLimited(error)) {
        throw error
      }

      await wait(1100)
      result = await send()
    }

    const providerMessageId =
      result && typeof result === 'object' && 'id' in result ? String(result.id) : undefined

    return { ok: true, providerMessageId }
  },
  sms: async ({ body, to }) => {
    const result = await sendTwilioSms({ body, to })

    if (!result.sent) {
      return { error: 'Texts are not set up yet.', ok: false }
    }

    return { ok: true, providerMessageId: result.sid }
  },
})

type AudienceCustomer = Pick<Customer, 'email' | 'emailOk' | 'id' | 'phone' | 'smsOk'>

/** The address a customer should get this channel at right now, or null if they said no. */
export const currentAddressFor = (
  customer: AudienceCustomer | undefined,
  channel: BakeryUpdateChannel,
): null | string => {
  if (!customer) {
    return null
  }

  const address =
    channel === 'sms' ? customer.smsOk && customer.phone : customer.emailOk && customer.email

  return typeof address === 'string' && address.trim() ? address.trim() : null
}

export const findBakeryUpdateAudience = async (
  payload: Payload,
  channel: BakeryUpdateChannel,
): Promise<QueuedRecipient[]> => {
  const result = await payload.find({
    collection: 'customers',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { email: true, emailOk: true, phone: true, smsOk: true },
    sort: 'id',
    where:
      channel === 'sms'
        ? { and: [{ smsOk: { equals: true } }, { phone: { exists: true } }] }
        : { and: [{ emailOk: { equals: true } }, { email: { exists: true } }] },
  })

  return result.docs.flatMap((customer) => {
    const address = currentAddressFor(customer as AudienceCustomer, channel)
    return address ? [{ address, customerID: customer.id }] : []
  })
}

export const countBakeryUpdateAudience = async (payload: Payload) => {
  const [sms, email] = await Promise.all([
    findBakeryUpdateAudience(payload, 'sms'),
    findBakeryUpdateAudience(payload, 'email'),
  ])

  return { email: email.length, sms: sms.length }
}

const toProgress = (
  update: Pick<BakeryUpdate, 'createdAt' | 'id' | 'sendEmail' | 'sendText' | 'status' | 'subject'>,
  tally: BakeryUpdateTally | undefined,
): BakeryUpdateProgress => ({
  createdAt: update.createdAt,
  done: update.status === 'sent',
  email: tally?.email ?? emptyChannelTally(),
  id: update.id,
  sendEmail: Boolean(update.sendEmail),
  sendText: Boolean(update.sendText),
  sms: tally?.sms ?? emptyChannelTally(),
  status: update.status,
  subject: update.subject,
})

const getProgress = async (payload: Payload, update: BakeryUpdate) => {
  const tallies = await tallyDeliveries({ payload, updateIDs: [update.id] })
  return toProgress(update, tallies.get(update.id))
}

const findByRequestKey = async (payload: Payload, requestKey: string) => {
  const result = await payload.find({
    collection: 'bakery-updates',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { requestKey: { equals: requestKey } },
  })

  return result.docs[0] ?? null
}

const setUpdateStatus = (
  payload: Payload,
  id: number,
  data: Pick<BakeryUpdate, 'status'> & { finishedAt?: string },
) =>
  payload.update({
    collection: 'bakery-updates',
    data,
    depth: 0,
    id,
    overrideAccess: true,
  })

// Queues whoever says yes right now. Safe to repeat: rows already queued stay put.
const queueAudience = async (
  payload: Payload,
  update: BakeryUpdate,
  known?: Partial<Record<BakeryUpdateChannel, QueuedRecipient[]>>,
) => {
  const channels: BakeryUpdateChannel[] = [
    ...(update.sendText ? (['sms'] as const) : []),
    ...(update.sendEmail ? (['email'] as const) : []),
  ]

  for (const channel of channels) {
    await queueDeliveries({
      channel,
      payload,
      recipients: known?.[channel] ?? (await findBakeryUpdateAudience(payload, channel)),
      updateID: update.id,
    })
  }

  return setUpdateStatus(payload, update.id, { status: 'sending' })
}

export const startBakeryUpdate = async ({
  draft,
  payload,
  requestKey,
  sentBy,
}: {
  draft: BakeryUpdateDraft
  payload: Payload
  requestKey: string
  sentBy?: number
}): Promise<BakeryUpdateProgress> => {
  if (!requestKey || requestKey.length > 100) {
    throw new APIError('Refresh the page and try again.', 400)
  }

  const existing = await findByRequestKey(payload, requestKey)

  if (existing) {
    return getProgress(
      payload,
      existing.status === 'preparing' ? await queueAudience(payload, existing) : existing,
    )
  }

  const problem = validateBakeryUpdateDraft(draft, {
    emailsReady: Boolean(await getBakeryMailingAddress(payload)),
    textsReady: areBakeryTextsReady(),
  })

  if (problem) {
    throw new APIError(problem, 400)
  }

  const templateFields = templateFieldsFromDraft(draft)

  if (
    templateFields.template === 'flavor' &&
    !(await findBakeryUpdateProduct(payload, templateFields.productID))
  ) {
    throw new APIError('That cookie is no longer on the site. Pick another one.', 400)
  }

  const audience = {
    email: draft.sendEmail ? await findBakeryUpdateAudience(payload, 'email') : [],
    sms: draft.sendText ? await findBakeryUpdateAudience(payload, 'sms') : [],
  }

  if (!audience.email.length && !audience.sms.length) {
    throw new APIError('Nobody has said yes to these yet, so there is no one to send this to.', 400)
  }

  let update: BakeryUpdate

  try {
    update = await payload.create({
      collection: 'bakery-updates',
      data: {
        market: templateFields.market,
        message: draft.message.trim(),
        product: templateFields.productID,
        requestKey,
        sendEmail: draft.sendEmail,
        sendText: draft.sendText,
        sentBy,
        status: 'preparing',
        subject: draft.subject.trim() || draft.message.trim().slice(0, 60),
        template: templateFields.template,
      },
      depth: 0,
      overrideAccess: true,
    })
  } catch (error) {
    // Lost a race with the same request key: the other request owns this send.
    const raced = await findByRequestKey(payload, requestKey)

    if (!raced) {
      throw error
    }

    return getProgress(payload, raced)
  }

  return getProgress(payload, await queueAudience(payload, update, audience))
}

type SendContext = {
  accountURL: string
  companyName: string
  feature: BakeryUpdateEmailFeature | null
  logoURL: string
  mailingAddress: string
  message: string
  serverURL: string
  siteURL: string
  smsBody: string
  subject: string
}

const buildSendContext = async (
  payload: Payload,
  update: BakeryUpdate,
  mailingAddress: string,
): Promise<SendContext> => {
  const companyName = getBakeryCompanyName()
  const { logoURL, siteURL } = getBakeryEmailLinks()
  const templateFields = templateFieldsFromUpdate(update)

  return {
    accountURL: `${siteURL}/account`,
    companyName,
    feature: update.sendEmail ? await loadBakeryUpdateEmailFeature(payload, templateFields) : null,
    logoURL,
    mailingAddress,
    message: update.message,
    serverURL: siteURL,
    siteURL,
    smsBody: buildBakeryUpdateSms({
      companyName,
      details: bakeryUpdateSmsDetails(templateFields),
      message: update.message,
    }),
    subject: update.subject,
  }
}

export const buildBakeryUpdateEmailFor = ({
  context,
  to,
  unsubscribeURL,
}: {
  context: Pick<
    SendContext,
    | 'accountURL'
    | 'companyName'
    | 'feature'
    | 'logoURL'
    | 'mailingAddress'
    | 'message'
    | 'siteURL'
    | 'subject'
  >
  to: string
  unsubscribeURL: string
}): BakeryUpdateEmail => ({
  ...buildBakeryUpdateEmail({
    accountURL: context.accountURL,
    companyName: context.companyName,
    feature: context.feature,
    logoURL: context.logoURL,
    mailingAddress: context.mailingAddress,
    message: context.message,
    siteURL: context.siteURL,
    subject: context.subject,
    unsubscribeURL,
  }),
  headers: {
    'List-Unsubscribe': `<${unsubscribeURL}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  },
  to,
})

const markDelivery = (
  payload: Payload,
  id: number,
  data: {
    address?: string
    error?: string
    providerMessageId?: string
    status: 'failed' | 'sent' | 'skipped'
  },
) =>
  payload.update({
    collection: 'bakery-update-deliveries',
    data,
    depth: 0,
    id,
    overrideAccess: true,
  })

const deliverOne = async ({
  context,
  customer,
  delivery,
  payload,
  senders,
}: {
  context: SendContext
  customer: AudienceCustomer | undefined
  delivery: ClaimedDelivery
  payload: Payload
  senders: BakeryUpdateSenders
}) => {
  // Consent is checked again at send time: a STOP or unsubscribe after the
  // owner pressed Send still wins.
  const address = currentAddressFor(customer, delivery.channel)

  if (!address || !customer) {
    await markDelivery(payload, delivery.id, {
      error: 'Turned off before this was sent.',
      status: 'skipped',
    })
    return
  }

  let outcome: SendOutcome

  try {
    outcome =
      delivery.channel === 'sms'
        ? await senders.sms({ body: context.smsBody, to: address })
        : await senders.email(
            buildBakeryUpdateEmailFor({
              context,
              to: address,
              unsubscribeURL: `${context.serverURL}/api/customer-auth/email-unsubscribe?token=${createEmailUnsubscribeToken(customer.id)}`,
            }),
          )
  } catch (error) {
    outcome = { error: errorMessage(error), ok: false }
  }

  await markDelivery(
    payload,
    delivery.id,
    outcome.ok
      ? { address, providerMessageId: outcome.providerMessageId, status: 'sent' }
      : { address, error: outcome.error.slice(0, 300), status: 'failed' },
  )
}

const loadCustomers = async (payload: Payload, ids: number[]) => {
  const result = await payload.find({
    collection: 'customers',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { email: true, emailOk: true, phone: true, smsOk: true },
    where: { id: { in: ids } },
  })

  return new Map(result.docs.map((customer) => [customer.id, customer as AudienceCustomer]))
}

/**
 * Sends the next few waiting messages and reports progress. The admin page
 * calls this in a loop so no single request runs long, and closing the tab
 * only pauses the send: the page offers to finish it later.
 */
export const continueBakeryUpdate = async ({
  batchSize = 10,
  payload,
  senders = createBakeryUpdateSenders(payload),
  timeBudgetMs = 20_000,
  updateID,
}: {
  batchSize?: number
  payload: Payload
  senders?: BakeryUpdateSenders
  timeBudgetMs?: number
  updateID: number
}): Promise<BakeryUpdateProgress> => {
  let update = await payload.findByID({
    collection: 'bakery-updates',
    depth: 0,
    id: updateID,
    overrideAccess: true,
  })

  if (update.status === 'preparing') {
    update = await queueAudience(payload, update)
  }

  if (update.status !== 'sending') {
    return getProgress(payload, update)
  }

  // Checked again here in case the address was cleared mid-send. Throwing
  // leaves the queue untouched, so "Finish sending" works once it is back.
  const mailingAddress = update.sendEmail ? await getBakeryMailingAddress(payload) : ''

  if (update.sendEmail && !mailingAddress) {
    throw new APIError(missingMailingAddressMessage, 400)
  }

  const context = await buildSendContext(payload, update, mailingAddress ?? '')
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeBudgetMs) {
    const claimed = await claimQueuedDeliveries({ limit: batchSize, payload, updateID: update.id })

    if (!claimed.length) {
      break
    }

    const customers = await loadCustomers(
      payload,
      claimed.map((delivery) => delivery.customerID),
    )

    for (const delivery of claimed) {
      await deliverOne({
        context,
        customer: customers.get(delivery.customerID),
        delivery,
        payload,
        senders,
      })
    }
  }

  await failInterruptedDeliveries({ payload, updateID: update.id })

  const tally = (await tallyDeliveries({ payload, updateIDs: [update.id] })).get(update.id)
  const unfinished = tally
    ? tally.sms.queued + tally.sms.sending + tally.email.queued + tally.email.sending
    : 0

  if (unfinished === 0) {
    update = await setUpdateStatus(payload, update.id, {
      finishedAt: new Date().toISOString(),
      status: 'sent',
    })
  }

  return toProgress(update, tally)
}

export const sendBakeryUpdateTestEmail = async ({
  draft,
  payload,
  senders = createBakeryUpdateSenders(payload),
  to,
}: {
  draft: Pick<BakeryUpdateDraft, 'market' | 'message' | 'productID' | 'subject' | 'template'>
  payload: Payload
  senders?: BakeryUpdateSenders
  to: string
}) => {
  const mailingAddress = await getBakeryMailingAddress(payload)
  const problem = validateBakeryUpdateDraft(
    { ...draft, sendEmail: true, sendText: false },
    { emailsReady: Boolean(mailingAddress), textsReady: false },
  )

  if (problem) {
    throw new APIError(problem, 400)
  }

  if (!to.trim()) {
    throw new APIError('Your admin account has no email address to send a test to.', 400)
  }

  const templateFields = templateFieldsFromDraft({ ...draft, sendEmail: true, sendText: false })
  const feature = await loadBakeryUpdateEmailFeature(payload, templateFields)

  if (templateFields.template === 'flavor' && !feature) {
    throw new APIError('That cookie is no longer on the site. Pick another one.', 400)
  }

  const { logoURL, siteURL } = getBakeryEmailLinks()
  const context = {
    accountURL: `${siteURL}/account`,
    companyName: getBakeryCompanyName(),
    feature,
    logoURL,
    mailingAddress: mailingAddress ?? '',
    siteURL,
    message: draft.message.trim(),
    subject: `[Test] ${draft.subject.trim()}`,
  }

  // The test goes to the owner, not a customer, so its unsubscribe link points
  // at the account page instead of switching anyone's emails off.
  const outcome = await senders.email(
    buildBakeryUpdateEmailFor({ context, to: to.trim(), unsubscribeURL: context.accountURL }),
  )

  if (!outcome.ok) {
    throw new APIError(`The test email did not send: ${outcome.error}`, 400)
  }
}

export const loadBakeryUpdatesOverview = async (payload: Payload, { limit = 8 } = {}) => {
  const [audience, mailingAddress, products, recent] = await Promise.all([
    countBakeryUpdateAudience(payload),
    getBakeryMailingAddress(payload),
    listBakeryUpdateProducts(payload),
    payload.find({
      collection: 'bakery-updates',
      depth: 0,
      limit,
      overrideAccess: true,
      sort: '-createdAt',
    }),
  ])

  const tallies = await tallyDeliveries({
    payload,
    updateIDs: recent.docs.map((update) => update.id),
  })

  return {
    audience,
    emailLinks: getBakeryEmailLinks(),
    mailingAddress,
    products,
    textsReady: areBakeryTextsReady(),
    updates: recent.docs.map((update) => toProgress(update, tallies.get(update.id))),
  }
}

export type BakeryUpdatesOverview = Awaited<ReturnType<typeof loadBakeryUpdatesOverview>>

const templateTitles: Record<BakeryUpdateTemplate, string> = {
  flavor: 'New flavor',
  market: 'Market date',
  note: 'Just a note',
}

/** Everything the past-update page shows, rebuilt from what was stored when it was sent. */
export const loadBakeryUpdateDetail = async (payload: Payload, id: number) => {
  const update = await payload.findByID({
    collection: 'bakery-updates',
    depth: 1,
    disableErrors: true,
    id,
    overrideAccess: true,
  })

  if (!update) {
    return null
  }

  const templateFields = templateFieldsFromUpdate(update)
  const [tallies, mailingAddress, feature] = await Promise.all([
    tallyDeliveries({ payload, updateIDs: [update.id] }),
    getBakeryMailingAddress(payload),
    loadBakeryUpdateEmailFeature(payload, templateFields),
  ])
  const companyName = getBakeryCompanyName()
  const sender = typeof update.sentBy === 'object' ? update.sentBy : null

  return {
    // Links point nowhere in the preview, so a click cannot leave the admin.
    emailHTML: update.sendEmail
      ? buildBakeryUpdateEmail({
          accountURL: '#',
          companyName,
          feature,
          logoURL: getBakeryEmailLinks().logoURL,
          mailingAddress: mailingAddress ?? '',
          message: update.message,
          siteURL: '#',
          subject: update.subject,
          unsubscribeURL: '#',
        }).html
      : null,
    finishedAt: update.finishedAt ?? null,
    kind:
      feature?.kind === 'flavor'
        ? `${templateTitles.flavor}: ${feature.name}`
        : templateTitles[templateFields.template],
    progress: toProgress(update, tallies.get(update.id)),
    reuse: {
      market: templateFields.market,
      message: update.message,
      productID: templateFields.productID,
      sendEmail: Boolean(update.sendEmail),
      sendText: Boolean(update.sendText),
      subject: update.subject,
      template: templateFields.template,
    } satisfies BakeryUpdateDraft,
    sentBy: sender?.name?.trim() || sender?.email || null,
    smsBody: update.sendText
      ? buildBakeryUpdateSms({
          companyName,
          details: bakeryUpdateSmsDetails(templateFields),
          message: update.message,
        })
      : null,
  }
}

export type BakeryUpdateDetail = NonNullable<Awaited<ReturnType<typeof loadBakeryUpdateDetail>>>
