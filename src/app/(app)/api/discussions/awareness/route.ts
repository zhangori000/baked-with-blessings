import { raiseNodeAwareness } from '@/features/discussion-graph/services/discussionMutations'
import config from '@/payload.config'
import { getPayload } from 'payload'

export const POST = async (request: Request) => {
  const payload = await getPayload({ config })

  try {
    const input = (await request.json()) as { nodeId?: unknown; reactionType?: unknown }
    const nodeId = typeof input.nodeId === 'string' ? input.nodeId : ''
    const reactionType =
      input.reactionType === 'cry'
        ? 'cry'
        : input.reactionType === 'wiltedRose'
          ? 'wiltedRose'
          : 'awareness'
    const mark = await raiseNodeAwareness({
      headers: request.headers,
      nodeId,
      payload,
      reactionType,
    })

    return Response.json({ mark, success: true })
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500
    const message = error instanceof Error ? error.message : 'Unable to mark this node.'

    return Response.json({ error: message, success: false }, { status })
  }
}
