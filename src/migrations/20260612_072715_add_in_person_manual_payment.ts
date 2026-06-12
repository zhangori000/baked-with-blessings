import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Written idempotently (heal-where-missing) because the preview database
  // carried damage from the old dev-push era: payload_migrations claimed
  // 20260501_130000_add_manual_order_payments was applied, but a later push
  // run with older code had silently dropped the manual-payment enum and
  // columns. This migration restores the full manual-payment block wherever
  // it is missing and adds the 'in_person' value, while no-oping in
  // environments that already have everything (local Docker, production).
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_manual_payment_method') THEN
        ALTER TYPE "public"."enum_orders_manual_payment_method" ADD VALUE IF NOT EXISTS 'in_person';
      ELSE
        CREATE TYPE "public"."enum_orders_manual_payment_method" AS ENUM('venmo', 'in_person');
      END IF;
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
  // Best-effort: removes only the 'in_person' value this migration is named
  // for, via the standard enum rebuild. The manual-payment columns belong to
  // 20260501_130000 and are left alone.
  await db.execute(sql`
    ALTER TABLE "orders" ALTER COLUMN "manual_payment_method" SET DATA TYPE text;
    DROP TYPE IF EXISTS "public"."enum_orders_manual_payment_method";
    CREATE TYPE "public"."enum_orders_manual_payment_method" AS ENUM('venmo');
    ALTER TABLE "orders" ALTER COLUMN "manual_payment_method" SET DATA TYPE "public"."enum_orders_manual_payment_method" USING "manual_payment_method"::"public"."enum_orders_manual_payment_method";
  `)
}
