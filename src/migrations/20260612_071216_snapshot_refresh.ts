import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up(_args: MigrateUpArgs): Promise<void> {
  // Intentionally a no-op. This migration exists only to carry its sibling
  // .json schema snapshot, which re-baselines `payload migrate:create` after
  // weeks of hand-written (snapshot-less) migrations had left the only
  // snapshot at the April initial schema. Every table, type, and column the
  // generator emitted here already exists in all environments via the
  // hand-written migrations 20260429 through 20260611, so the generated SQL
  // was discarded and only the snapshot kept.
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally a no-op; see up().
}
