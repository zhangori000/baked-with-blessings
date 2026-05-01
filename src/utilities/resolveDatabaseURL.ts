const localDatabaseHosts = new Set(['127.0.0.1', 'localhost', '::1'])

export const isLocalDatabaseURL = (value: string | undefined) => {
  if (!value) {
    return false
  }

  try {
    const url = new URL(value)

    return localDatabaseHosts.has(url.hostname)
  } catch {
    return false
  }
}

const getHostedDatabaseURL = (env: NodeJS.ProcessEnv) =>
  env.NEON_POSTGRES_URL || env.NEON_DATABASE_URL

export const shouldPreferHostedDatabaseURLForVercelEnvRun = (env = process.env) =>
  env.VERCEL === '1' && isLocalDatabaseURL(env.DATABASE_URL) && Boolean(getHostedDatabaseURL(env))

export const resolveDatabaseURL = (env = process.env) => {
  const hostedDatabaseURL = getHostedDatabaseURL(env)

  if (shouldPreferHostedDatabaseURLForVercelEnvRun(env)) {
    return hostedDatabaseURL || ''
  }

  return env.DATABASE_URL || hostedDatabaseURL || ''
}

export const preferHostedDatabaseURLForVercelEnvRun = (env = process.env) => {
  if (!shouldPreferHostedDatabaseURLForVercelEnvRun(env)) {
    return
  }

  const hostedDatabaseURL = getHostedDatabaseURL(env)

  if (hostedDatabaseURL) {
    env.DATABASE_URL = hostedDatabaseURL
  }
}
