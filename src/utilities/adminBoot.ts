import { resolveDatabaseURL } from '@/utilities/resolveDatabaseURL'

export const AUTH_COLLECTION_SLUG = 'admins'

export type AdminEnv = {
  DATABASE_URL?: string
  NEON_DATABASE_URL?: string
  NEON_POSTGRES_URL?: string
  PAYLOAD_SECRET?: string
  VERCEL?: string
  [key: string]: string | undefined
}

export const diagnoseAdminEnv = (env: AdminEnv = process.env): Error | null => {
  if (!env.PAYLOAD_SECRET?.trim()) {
    return new Error('missing secret key. A secret key is needed to secure Payload.')
  }

  if (!resolveDatabaseURL(env as NodeJS.ProcessEnv)?.trim()) {
    return new Error('DATABASE_URL is not set')
  }

  return null
}

/**
 * Payload 3.84 `getVisibleEntities` does `admin: { hidden }` on every
 * collection. That is safe when `admin` exists. Hiding the auth collection
 * (or related ecommerce collections that products still join) can still
 * prevent `createUnauthenticatedClientConfig` from mounting login.
 */
export const assertAdminAuthCollectionVisible = (payloadConfig: {
  admin?: { user?: string }
  collections?: Array<{ admin?: { hidden?: unknown } | null; slug?: string }>
}) => {
  const userSlug = payloadConfig.admin?.user || AUTH_COLLECTION_SLUG
  const adminCollection = payloadConfig.collections?.find(
    (collection) => collection.slug === userSlug,
  )

  if (!adminCollection) {
    throw new Error(`Admin user collection "${userSlug}" is missing from the client config.`)
  }

  if (adminCollection.admin?.hidden === true) {
    throw new Error(`Admin user collection "${userSlug}" is hidden, so login cannot mount.`)
  }
}
