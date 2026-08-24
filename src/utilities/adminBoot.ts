import { getPayload } from 'payload'
import type { SanitizedConfig } from 'payload'

const AUTH_COLLECTION_SLUG = 'admins'

type AdminEnv = {
  DATABASE_URL?: string
  NEON_DATABASE_URL?: string
  NEON_POSTGRES_URL?: string
  PAYLOAD_SECRET?: string
}

const currentAdminEnv = (): AdminEnv => ({
  DATABASE_URL: process.env.DATABASE_URL,
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
  NEON_POSTGRES_URL: process.env.NEON_POSTGRES_URL,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
})

export const diagnoseAdminEnv = (env: AdminEnv = currentAdminEnv()): Error | null => {
  if (!env.PAYLOAD_SECRET?.trim()) {
    return new Error('missing secret key. A secret key is needed to secure Payload.')
  }

  const databaseURL = env.DATABASE_URL || env.NEON_POSTGRES_URL || env.NEON_DATABASE_URL

  if (!databaseURL?.trim()) {
    return new Error('DATABASE_URL is not set')
  }

  return null
}

export const assertAdminConfigReady = (config: {
  admin?: { user?: string }
  collections?: Array<{ admin?: unknown; slug?: string }>
  globals?: Array<{ admin?: unknown; slug?: string }>
}) => {
  const userSlug = config.admin?.user || AUTH_COLLECTION_SLUG
  const collections = config.collections ?? []
  const adminCollection = collections.find((collection) => collection.slug === userSlug)

  if (!adminCollection) {
    throw new Error(`Admin user collection "${userSlug}" is missing from the client config.`)
  }

  const adminHidden =
    adminCollection.admin &&
    typeof adminCollection.admin === 'object' &&
    'hidden' in adminCollection.admin
      ? adminCollection.admin.hidden
      : undefined

  if (adminHidden === true) {
    throw new Error(`Admin user collection "${userSlug}" is hidden, so login cannot mount.`)
  }

  for (const entity of [...collections, ...(config.globals ?? [])]) {
    if (entity.admin == null) {
      throw new Error(
        `Collection or global "${entity.slug ?? 'unknown'}" is missing admin config.`,
      )
    }

    // Payload RootPage calls getVisibleEntities, which does `admin: { hidden }`.
    const { hidden: _hidden } = entity.admin as { hidden?: unknown }
    void _hidden
  }
}

export const checkAdminBoot = async (
  config: Promise<SanitizedConfig> | SanitizedConfig,
): Promise<Error | null> => {
  const envError = diagnoseAdminEnv()

  if (envError) {
    return envError
  }

  try {
    const payload = await getPayload({ config })
    assertAdminConfigReady(payload.config)
    return null
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error))
  }
}
