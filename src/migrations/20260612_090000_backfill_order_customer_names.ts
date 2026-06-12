import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Data-only backfill: orders whose customer account has no name now fall
  // back to the account's email or phone, matching the customerName hook.
  await db.execute(sql`
    UPDATE "orders"
    SET "customer_name" = COALESCE(NULLIF("customers"."name", ''), "customers"."email", "customers"."phone")
    FROM "customers"
    WHERE "orders"."customer_id" = "customers"."id"
      AND ("orders"."customer_name" IS NULL OR "orders"."customer_name" = '');
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Data-only backfill; nothing sensible to undo.
}
