import { setDefaultResultOrder } from 'node:dns'
import { setDefaultAutoSelectFamily } from 'node:net'

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
