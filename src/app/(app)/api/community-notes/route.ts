import {
  CommunityNoteServiceError,
  createCommunityNote,
  fetchCommunityNotesPage,
  toPublicNote,
} from '@/features/community/services'
import { COMMUNITY_NOTES_PAGE_SIZE } from '@/features/community/types'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import config from '@/payload.config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export const GET = async (request: Request) => {
  try {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limitParam = Number(url.searchParams.get('limit') ?? COMMUNITY_NOTES_PAGE_SIZE)
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 60
        ? Math.floor(limitParam)
        : COMMUNITY_NOTES_PAGE_SIZE

    const payload = await getPayload({ config })
    const viewer = await getAuthenticatedCustomer(payload, request.headers)

    const page = await fetchCommunityNotesPage({
      cursor: cursor || null,
      limit,
      payload,
      viewer: viewer ? { id: viewer.id as number } : null,
    })

    return Response.json({ ...page, success: true })
  } catch (error) {
    console.error('[community-notes] GET failed', error)
    return Response.json(
      { error: 'Unable to load notes.', success: false },
      { status: 500 },
    )
  }
}

export const POST = async (request: Request) => {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, request.headers)
    if (!customer) {
      return Response.json(
        { error: 'You must be logged in to post a note.', success: false },
        { status: 401 },
      )
    }

    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>

    const note = await createCommunityNote({
      customer: customer as never,
      input: {
        body: typeof raw.body === 'string' ? raw.body : '',
        isAnonymous: Boolean(raw.isAnonymous),
        orderId:
          typeof raw.orderId === 'string' || typeof raw.orderId === 'number'
            ? (raw.orderId as string | number)
            : '',
        pseudonym: typeof raw.pseudonym === 'string' ? raw.pseudonym : null,
      },
      payload,
    })

    const populated = await payload.findByID({
      collection: 'community-notes',
      depth: 1,
      id: note.id,
    })

    return Response.json({
      note: toPublicNote(populated as never, { id: customer.id as number }),
      success: true,
    })
  } catch (error) {
    if (error instanceof CommunityNoteServiceError) {
      return Response.json(
        { error: error.message, success: false },
        { status: error.status },
      )
    }
    console.error('[community-notes] POST failed', error)
    return Response.json(
      { error: 'Unable to post note.', success: false },
      { status: 500 },
    )
  }
}
