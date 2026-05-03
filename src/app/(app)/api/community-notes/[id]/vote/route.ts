import {
  CommunityNoteServiceError,
  applyVote,
  toPublicNote,
} from '@/features/community/services'
import { getAuthenticatedCustomer } from '@/utilities/getAuthenticatedCustomer'
import config from '@/payload.config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params
    if (!id) {
      return Response.json(
        { error: 'Missing note id.', success: false },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, request.headers)
    if (!customer) {
      return Response.json(
        { error: 'You must be logged in to react to a note.', success: false },
        { status: 401 },
      )
    }

    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const value = raw.value
    if (value !== 'like' && value !== 'dislike') {
      return Response.json(
        { error: 'Invalid reaction.', success: false },
        { status: 400 },
      )
    }

    const updated = await applyVote({
      customer: customer as never,
      noteId: id,
      payload,
      value,
    })

    const populated = await payload.findByID({
      collection: 'community-notes',
      depth: 1,
      id: updated.id,
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
    console.error('[community-notes] vote failed', error)
    return Response.json(
      { error: 'Unable to record reaction.', success: false },
      { status: 500 },
    )
  }
}
