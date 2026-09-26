import { cache } from 'react'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { isAdminUser } from '@/access/utilities'
import config from '@payload-config'
import { assertAdminAuthCollectionVisible, diagnoseAdminEnv } from '@/utilities/adminBoot'

export type AdminShellState =
  | { error: Error; kind: 'error' }
  | { kind: 'login' }
  | { kind: 'ready' }

/**
 * Deduped per request so the payload layout and the catch-all admin page
 * share one env / auth check.
 */
export const getAdminShellState = cache(async (): Promise<AdminShellState> => {
  const envError = diagnoseAdminEnv()

  if (envError) {
    return { error: envError, kind: 'error' }
  }

  try {
    const payload = await getPayload({ config })
    assertAdminAuthCollectionVisible(payload.config)

    let user = null

    try {
      const auth = await payload.auth({ headers: await headers() })
      user = auth.user
    } catch {
      user = null
    }

    if (!isAdminUser(user)) {
      return { kind: 'login' }
    }

    return { kind: 'ready' }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      kind: 'error',
    }
  }
})
