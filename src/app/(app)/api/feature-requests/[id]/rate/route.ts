import {
  FeatureRequestServiceError,
  rateRequest,
  toPublicRequest,
} from '@/features/feature-requests/services'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import { getSitePages } from '@/utilities/getSitePages'
import config from '@/payload.config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export const POST = async (request: Request, { params }: RouteContext) => {
  try {
    const sitePages = await getSitePages()
    if (!sitePages.featureRequestsEnabled) {
      return Response.json({ error: 'Feature requests disabled.', success: false }, { status: 404 })
    }

    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, request.headers)
    if (!customer) {
      return Response.json(
        { error: 'You must be logged in to rate a request.', success: false },
        { status: 401 },
      )
    }

    const { id } = await params
    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const value = Number(raw.value)

    const updated = await rateRequest({
      customer: customer as never,
      payload,
      requestId: id,
      value,
    })

    const populated = await payload.findByID({
      collection: 'feature-requests',
      depth: 1,
      id: updated.id,
    })

    return Response.json({
      request: toPublicRequest(populated as never, { id: customer.id as number }, 0),
      success: true,
    })
  } catch (error) {
    if (error instanceof FeatureRequestServiceError) {
      return Response.json(
        { error: error.message, success: false },
        { status: error.status },
      )
    }
    console.error('[feature-requests/rate] POST failed', error)
    return Response.json(
      { error: 'Unable to record rating.', success: false },
      { status: 500 },
    )
  }
}
