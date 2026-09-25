import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { isAdminUser } from '@/access/utilities'
import {
  type BakeryUpdateDraft,
  type BakeryUpdateMarket,
  isBakeryUpdateTemplate,
} from '@/features/bakery-updates/content'
import {
  continueBakeryUpdate,
  sendBakeryUpdateTestEmail,
  startBakeryUpdate,
} from '@/features/bakery-updates/service'

// Each call sends for about 20 seconds, then the admin page calls again.
export const maxDuration = 60

type BakeryUpdateRequest = {
  action?: unknown
  market?: unknown
  message?: unknown
  productID?: unknown
  requestKey?: unknown
  sendEmail?: unknown
  sendText?: unknown
  subject?: unknown
  template?: unknown
  updateID?: unknown
}

const readString = (value: unknown) => (typeof value === 'string' ? value : '')

const readMarket = (value: unknown): BakeryUpdateMarket => {
  const market = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    address: readString(market.address),
    date: readString(market.date),
    hours: readString(market.hours),
    place: readString(market.place),
  }
}

const readDraft = (body: BakeryUpdateRequest): BakeryUpdateDraft => {
  const productID = Number(body.productID)

  return {
    market: readMarket(body.market),
    message: readString(body.message),
    productID: Number.isInteger(productID) && productID > 0 ? productID : null,
    sendEmail: body.sendEmail === true,
    sendText: body.sendText === true,
    subject: readString(body.subject),
    template: isBakeryUpdateTemplate(body.template) ? body.template : 'note',
  }
}

const jsonError = (error: string, status: number) =>
  Response.json({ error, success: false }, { status })

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || !isAdminUser(user)) {
    return jsonError('Only bakery admins can send updates.', 403)
  }

  let body: BakeryUpdateRequest

  try {
    body = (await request.json()) as BakeryUpdateRequest
  } catch {
    return jsonError('Send a JSON body.', 400)
  }

  try {
    if (body.action === 'start') {
      const progress = await startBakeryUpdate({
        draft: readDraft(body),
        payload,
        requestKey: typeof body.requestKey === 'string' ? body.requestKey : '',
        sentBy: typeof user.id === 'number' ? user.id : undefined,
      })

      return Response.json({ progress, success: true })
    }

    if (body.action === 'continue') {
      const updateID = Number(body.updateID)

      if (!Number.isInteger(updateID) || updateID <= 0) {
        return jsonError('Missing update.', 400)
      }

      const progress = await continueBakeryUpdate({ payload, updateID })

      return Response.json({ progress, success: true })
    }

    if (body.action === 'test') {
      const to = typeof user.email === 'string' ? user.email : ''

      await sendBakeryUpdateTestEmail({ draft: readDraft(body), payload, to })

      return Response.json({ sentTo: to, success: true })
    }

    return jsonError('Unknown action.', 400)
  } catch (error) {
    const status =
      typeof (error as { status?: unknown })?.status === 'number'
        ? (error as { status: number }).status
        : 500
    const message =
      status < 500 && error instanceof Error
        ? error.message
        : 'Something went wrong while sending. Nothing was sent twice. Try again in a minute.'

    payload.logger.error({ err: error }, 'Bakery update request failed')

    return jsonError(message, status)
  }
}
