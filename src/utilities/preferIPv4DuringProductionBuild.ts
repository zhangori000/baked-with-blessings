import { setDefaultResultOrder } from 'node:dns'
import { setDefaultAutoSelectFamily } from 'node:net'

/**
 * `next build` prerenders the sitemap, which opens Postgres. Vercel build
 * machines cannot route to this database's IPv6 addresses (ENETUNREACH). Node's
 * default Happy Eyeballs then also reports the IPv4 attempt as ETIMEDOUT, so
 * the production deploy fails even though the running site can still connect.
 * Production builds prefer IPv4 and wait long enough for a suspended Neon
 * compute to wake up.
 */
export const PRODUCTION_BUILD_PHASE = 'phase-production-build'

const PRODUCTION_BUILD_CONNECT_TIMEOUT_MS = 20_000

export const preferIPv4DuringProductionBuild = (env: NodeJS.ProcessEnv = process.env) => {
  if (env.NEXT_PHASE !== PRODUCTION_BUILD_PHASE) return false

  setDefaultResultOrder('ipv4first')
  setDefaultAutoSelectFamily(false)
  return true
}

export const productionBuildPoolOptions = (env: NodeJS.ProcessEnv = process.env) =>
  env.NEXT_PHASE === PRODUCTION_BUILD_PHASE
    ? { connectionTimeoutMillis: PRODUCTION_BUILD_CONNECT_TIMEOUT_MS }
    : {}
