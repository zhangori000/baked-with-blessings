import config from '@/payload.config'
import { createDiscussionReply } from '@/features/discussion-graph/services/discussionMutations'
import { getPayload } from 'payload'

export const POST = async (request: Request) => {
  const payload = await getPayload({ config })

  try {
    const input = (await request.json()) as Record<string, unknown>
    const node = await createDiscussionReply({
      headers: request.headers,
      input,
      payload,
    })

    return Response.json({ node, success: true })
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500
    const message = error instanceof Error ? error.message : 'Unable to post reply.'

    return Response.json({ error: message, success: false }, { status })
  }
}
