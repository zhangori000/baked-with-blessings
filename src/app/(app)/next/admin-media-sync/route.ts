import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { isAdminUser } from '@/access/utilities'
import { syncMediaFromPayload } from '@/utilities/syncMediaFromPayload'

export const maxDuration = 300

type MediaSyncRequest = {
  keepLocalMissing?: unknown
}

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !isAdminUser(user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  let body: MediaSyncRequest = {}

  try {
    body = (await request.json()) as MediaSyncRequest
  } catch {
    // The dashboard button sends JSON, but an empty body can still use defaults.
  }

  try {
    const result = await syncMediaFromPayload({
      keepLocalMissing: body.keepLocalMissing === true,
      payload,
    })

    return Response.json({
      ...result,
      success: true,
    })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown media sync error'

    payload.logger.error({ err: e, message: `Error syncing media from production: ${errorMessage}` })

    return Response.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 },
    )
  }
}
