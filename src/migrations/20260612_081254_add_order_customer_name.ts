import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ADD COLUMN "customer_name" varchar;

  -- Hand-added backfill: copy names onto orders that already exist.
  UPDATE "orders"
  SET "customer_name" = "customers"."name"
  FROM "customers"
  WHERE "orders"."customer_id" = "customers"."id"
    AND "customers"."name" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "customer_name";`)
}
