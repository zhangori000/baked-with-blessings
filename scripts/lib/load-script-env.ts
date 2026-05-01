import * as nextEnv from '@next/env'

type NextEnvModule = typeof nextEnv & {
  default?: typeof nextEnv
}

const { loadEnvConfig } =
  'loadEnvConfig' in nextEnv ? nextEnv : ((nextEnv as NextEnvModule).default as typeof nextEnv)

const localDatabaseHosts = new Set(['127.0.0.1', 'localhost', '::1'])

const isLocalDatabaseURL = (value: string | undefined) => {
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

const preferHostedDatabaseURLForVercelEnvRun = () => {
  if (process.env.VERCEL !== '1') {
    return
  }

  if (process.env.DATABASE_URL && !isLocalDatabaseURL(process.env.DATABASE_URL)) {
    return
  }

  const hostedDatabaseURL = process.env.NEON_POSTGRES_URL || process.env.NEON_DATABASE_URL

  if (!hostedDatabaseURL) {
    return
  }

  process.env.DATABASE_URL = hostedDatabaseURL
}

export const loadScriptEnv = () => {
  const injectedEnv = { ...process.env }

  loadEnvConfig(process.cwd())

  for (const [key, value] of Object.entries(injectedEnv)) {
    if (typeof value === 'string') {
      process.env[key] = value
    }
  }

  preferHostedDatabaseURLForVercelEnvRun()
}
