import { createBlessingsNetworkAnswerSubmission } from '@/features/blessings-network/services/networkMutations'
import config from '@/payload.config'
import { getPayload } from 'payload'

export const POST = async (request: Request) => {
  const payload = await getPayload({ config })

  try {
    const input = (await request.json()) as Record<string, unknown>
    const answer = await createBlessingsNetworkAnswerSubmission({
      headers: request.headers,
      input,
      payload,
    })

    return Response.json({ answer, success: true })
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500
    const message = error instanceof Error ? error.message : 'Unable to submit reply.'

    return Response.json({ error: message, success: false }, { status })
  }
}
