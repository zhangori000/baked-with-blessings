import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Additive: add a third payment mode ('both'). `ALTER TYPE ... ADD VALUE` must
  // run OUTSIDE a transaction — Payload wraps each migration in one, and on
  // Neon's pooled connection the new value silently fails to persist inside that
  // transaction (works on a local direct connection, not the hosted pooler).
  // payload.db.drizzle is the base autocommit connection, so the ADD VALUE
  // commits on its own. Idempotent: IF NOT EXISTS makes re-runs a no-op.
  const drizzle = (
    payload.db as unknown as { drizzle: { execute: (query: unknown) => Promise<unknown> } }
  ).drizzle
  await drizzle.execute(
    sql`ALTER TYPE "public"."enum_store_settings_payment_collection_mode" ADD VALUE IF NOT EXISTS 'both'`,
  )
}

export async function down(): Promise<void> {
  // No-op by design. Postgres cannot drop a single enum value without recreating
  // the type, which would break any store_settings row already set to 'both'.
  // Reverting the code (which stops offering 'both') is the safe rollback; the
  // unused enum value is harmless.
}
