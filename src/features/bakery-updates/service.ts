import { APIError } from 'payload'
import type { Payload } from 'payload'

import type { BakeryUpdate, Customer } from '@/payload-types'
import { getCustomerContactEmails } from '@/utilities/email/contactChannels'
import { decorateEmailEnvelope } from '@/utilities/email/decorateEmailEnvelope'
import { createEmailUnsubscribeToken } from '@/utilities/email/emailUnsubscribeToken'
import { getServerSideURL } from '@/utilities/getURL'
import { getTwilioMessagingConfig, sendTwilioSms } from '@/utilities/sms/twilioMessages'

import {
  type BakeryUpdateChannel,
  type BakeryUpdateDraft,
  buildBakeryUpdateEmail,
  buildBakeryUpdateSms,
  validateBakeryUpdateDraft,
} from './content'
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

  const problem = validateBakeryUpdateDraft(draft, { textsReady: areBakeryTextsReady() })

  if (problem) {
    throw new APIError(problem, 400)
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
        message: draft.message.trim(),
        requestKey,
        sendEmail: draft.sendEmail,
        sendText: draft.sendText,
        sentBy,
        status: 'preparing',
        subject: draft.subject.trim() || draft.message.trim().slice(0, 60),
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
  message: string
  serverURL: string
  smsBody: string
  subject: string
}

const buildSendContext = (update: BakeryUpdate): SendContext => {
  const companyName = getBakeryCompanyName()
  const serverURL = getServerSideURL()

  return {
    accountURL: `${serverURL}/account`,
    companyName,
    message: update.message,
    serverURL,
    smsBody: buildBakeryUpdateSms({ companyName, message: update.message }),
    subject: update.subject,
  }
}

export const buildBakeryUpdateEmailFor = ({
  context,
  to,
  unsubscribeURL,
}: {
  context: Pick<SendContext, 'accountURL' | 'companyName' | 'message' | 'subject'>
  to: string
  unsubscribeURL: string
}): BakeryUpdateEmail => ({
  ...buildBakeryUpdateEmail({
    accountURL: context.accountURL,
    companyName: context.companyName,
    message: context.message,
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

  const context = buildSendContext(update)
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
  draft: Pick<BakeryUpdateDraft, 'message' | 'subject'>
  payload: Payload
  senders?: BakeryUpdateSenders
  to: string
}) => {
  const problem = validateBakeryUpdateDraft(
    { ...draft, sendEmail: true, sendText: false },
    { textsReady: false },
  )

  if (problem) {
    throw new APIError(problem, 400)
  }

  if (!to.trim()) {
    throw new APIError('Your admin account has no email address to send a test to.', 400)
  }

  const serverURL = getServerSideURL()
  const context = {
    accountURL: `${serverURL}/account`,
    companyName: getBakeryCompanyName(),
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
  const [audience, recent] = await Promise.all([
    countBakeryUpdateAudience(payload),
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
    textsReady: areBakeryTextsReady(),
    updates: recent.docs.map((update) => toProgress(update, tallies.get(update.id))),
  }
}

export type BakeryUpdatesOverview = Awaited<ReturnType<typeof loadBakeryUpdatesOverview>>
