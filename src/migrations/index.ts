import * as migration_20260427_214127_initial_schema from './20260427_214127_initial_schema'

export const migrations = [
  {
    up: migration_20260427_214127_initial_schema.up,
    down: migration_20260427_214127_initial_schema.down,
    name: '20260427_214127_initial_schema',
  },
]
