import * as nextEnv from '@next/env'

import { preferHostedDatabaseURLForVercelEnvRun } from '../../src/utilities/resolveDatabaseURL'

type NextEnvModule = typeof nextEnv & {
  default?: typeof nextEnv
}

const { loadEnvConfig } =
  'loadEnvConfig' in nextEnv ? nextEnv : ((nextEnv as NextEnvModule).default as typeof nextEnv)

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
