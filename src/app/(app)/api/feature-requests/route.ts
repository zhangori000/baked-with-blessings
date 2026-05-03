import {
  FeatureRequestServiceError,
  createRequest,
  fetchRequestsPage,
  toPublicRequest,
} from '@/features/feature-requests/services'
import {
  FEATURE_REQUESTS_PAGE_SIZE,
  type FeatureRequestSortMode,
} from '@/features/feature-requests/types'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import { getSitePages } from '@/utilities/getSitePages'
import config from '@/payload.config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const parseSort = (raw: string | null): FeatureRequestSortMode => {
  return raw === 'top-rated' ? 'top-rated' : 'newest'
}

export const GET = async (request: Request) => {
  try {
    const sitePages = await getSitePages()
    if (!sitePages.featureRequestsEnabled) {
      return Response.json({ error: 'Feature requests disabled.', success: false }, { status: 404 })
    }

    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const sort = parseSort(url.searchParams.get('sort'))
    const limitParam = Number(
      url.searchParams.get('limit') ?? FEATURE_REQUESTS_PAGE_SIZE,
    )
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 60
        ? Math.floor(limitParam)
        : FEATURE_REQUESTS_PAGE_SIZE

    const payload = await getPayload({ config })
    const viewer = await getAuthenticatedCustomer(payload, request.headers)

    const page = await fetchRequestsPage({
      cursor: cursor || null,
      limit,
      payload,
      sort,
      viewer: viewer ? { id: viewer.id as number } : null,
    })

    return Response.json({ ...page, success: true })
  } catch (error) {
    console.error('[feature-requests] GET failed', error)
    return Response.json(
      { error: 'Unable to load feature requests.', success: false },
      { status: 500 },
    )
  }
}

export const POST = async (request: Request) => {
  try {
    const sitePages = await getSitePages()
    if (!sitePages.featureRequestsEnabled) {
      return Response.json({ error: 'Feature requests disabled.', success: false }, { status: 404 })
    }

    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, request.headers)
    if (!customer) {
      return Response.json(
        { error: 'You must be logged in to submit a feature request.', success: false },
        { status: 401 },
      )
    }

    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const visibility = raw.visibility === 'private' ? 'private' : 'public'
    const displayMode = raw.displayMode === 'anonymous' ? 'anonymous' : 'self'

    const created = await createRequest({
      customer: customer as never,
      input: {
        body: typeof raw.body === 'string' ? raw.body : '',
        displayMode,
        pseudonym: typeof raw.pseudonym === 'string' ? raw.pseudonym : null,
        title: typeof raw.title === 'string' ? raw.title : '',
        visibility,
      },
      payload,
    })

    const populated = await payload.findByID({
      collection: 'feature-requests',
      depth: 1,
      id: created.id,
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
    console.error('[feature-requests] POST failed', error)
    return Response.json(
      { error: 'Unable to submit feature request.', success: false },
      { status: 500 },
    )
  }
}
