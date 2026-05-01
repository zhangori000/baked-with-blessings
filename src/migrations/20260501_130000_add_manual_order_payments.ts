import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_orders_manual_payment_method" AS ENUM('venmo');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_orders_manual_payment_status" AS ENUM('reported_sent', 'verified', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "manual_payment_method" "enum_orders_manual_payment_method";
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "manual_payment_status" "enum_orders_manual_payment_status";
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "manual_payment_handle" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "manual_payment_reported_at" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "manual_payment_reference" varchar;

    CREATE UNIQUE INDEX IF NOT EXISTS "orders_manual_payment_reference_idx" ON "orders" USING btree ("manual_payment_reference");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "orders_manual_payment_reference_idx";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "manual_payment_reference";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "manual_payment_reported_at";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "manual_payment_handle";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "manual_payment_status";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "manual_payment_method";
    DROP TYPE IF EXISTS "public"."enum_orders_manual_payment_status";
    DROP TYPE IF EXISTS "public"."enum_orders_manual_payment_method";
  `)
}
