import { getDefaultResultOrder, setDefaultResultOrder } from 'node:dns'
import { getDefaultAutoSelectFamily, setDefaultAutoSelectFamily } from 'node:net'
import { describe, expect, it } from 'vitest'

import { isDatabaseConnectionError } from '@/utilities/databaseConnectionError'
import {
  PRODUCTION_BUILD_PHASE,
  preferIPv4DuringProductionBuild,
  productionBuildPoolOptions,
} from '@/utilities/preferIPv4DuringProductionBuild'

describe('database connection errors', () => {
  it('recognizes the Postgres failure from a production build', () => {
    const error = Object.assign(new Error('Error: cannot connect to Postgres: '), {
      payloadInitError: true,
      cause: {
        code: 'ETIMEDOUT',
        errors: [{ code: 'ENETUNREACH', message: 'connect ENETUNREACH 2600:1f18::5432' }],
      },
    })

    expect(isDatabaseConnectionError(error)).toBe(true)
  })

  it('does not treat other failures as a connection problem', () => {
    expect(isDatabaseConnectionError(new Error('column "slug" does not exist'))).toBe(false)
    expect(isDatabaseConnectionError(null)).toBe(false)
  })
})

describe('production build database connect', () => {
  it('leaves runtime connections alone', () => {
    expect(preferIPv4DuringProductionBuild({ NEXT_PHASE: 'phase-production-server' })).toBe(false)
    expect(productionBuildPoolOptions({ NODE_ENV: 'production' })).toEqual({})
  })

  it('waits longer for Postgres only while next build is prerendering', () => {
    expect(productionBuildPoolOptions({ NEXT_PHASE: PRODUCTION_BUILD_PHASE })).toEqual({
      connectionTimeoutMillis: 20_000,
    })
  })

  it('prefers IPv4 while next build is prerendering', () => {
    const previousOrder = getDefaultResultOrder()
    const previousAutoSelectFamily = getDefaultAutoSelectFamily()

    try {
      expect(preferIPv4DuringProductionBuild({ NEXT_PHASE: PRODUCTION_BUILD_PHASE })).toBe(true)
      expect(getDefaultResultOrder()).toBe('ipv4first')
      expect(getDefaultAutoSelectFamily()).toBe(false)
    } finally {
      setDefaultResultOrder(previousOrder)
      setDefaultAutoSelectFamily(previousAutoSelectFamily)
    }
  })
})
