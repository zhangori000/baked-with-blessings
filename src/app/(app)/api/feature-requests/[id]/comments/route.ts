import {
  FeatureRequestServiceError,
  createComment,
  fetchComments,
  toPublicComment,
} from '@/features/feature-requests/services'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import { getSitePages } from '@/utilities/getSitePages'
import config from '@/payload.config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export const GET = async (request: Request, { params }: RouteContext) => {
  try {
    const sitePages = await getSitePages()
    if (!sitePages.featureRequestsEnabled) {
      return Response.json({ error: 'Feature requests disabled.', success: false }, { status: 404 })
    }

    const { id } = await params
    const payload = await getPayload({ config })
    const comments = await fetchComments({ payload, requestId: id })

    return Response.json({ comments, success: true })
  } catch (error) {
    console.error('[feature-requests/comments] GET failed', error)
    return Response.json(
      { error: 'Unable to load comments.', success: false },
      { status: 500 },
    )
  }
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
        { error: 'You must be logged in to comment.', success: false },
        { status: 401 },
      )
    }

    const { id } = await params
    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const displayMode = raw.displayMode === 'anonymous' ? 'anonymous' : 'self'

    const created = await createComment({
      customer: customer as never,
      input: {
        body: typeof raw.body === 'string' ? raw.body : '',
        customerName: typeof raw.customerName === 'string' ? raw.customerName : null,
        displayMode,
        pseudonym: typeof raw.pseudonym === 'string' ? raw.pseudonym : null,
      },
      payload,
      requestId: id,
    })

    const populated = await payload.findByID({
      collection: 'feature-request-comments',
      depth: 1,
      id: created.id,
    })

    return Response.json({
      comment: toPublicComment(populated as never),
      success: true,
    })
  } catch (error) {
    if (error instanceof FeatureRequestServiceError) {
      return Response.json(
        { error: error.message, success: false },
        { status: error.status },
      )
    }
    console.error('[feature-requests/comments] POST failed', error)
    return Response.json(
      { error: 'Unable to post comment.', success: false },
      { status: 500 },
    )
  }
}
