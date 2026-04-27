import { createReviewSubmission } from '@/features/reviews/services/reviewMutations'
import config from '@/payload.config'
import { getPayload } from 'payload'

export const POST = async (request: Request) => {
  const payload = await getPayload({ config })

  try {
    const formData = await request.formData()
    const review = await createReviewSubmission({ formData, payload })

    return Response.json({ review, success: true })
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500
    const message = error instanceof Error ? error.message : 'Unable to submit review.'

    return Response.json({ error: message, success: false }, { status })
  }
}
