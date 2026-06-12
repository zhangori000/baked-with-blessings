import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_store_settings_payment_collection_mode" AS ENUM('payNow', 'payAtPickup');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "store_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "payment_collection_mode" "enum_store_settings_payment_collection_mode" DEFAULT 'payNow' NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    ALTER TABLE "store_settings" DISABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "store_settings" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_store_settings_payment_collection_mode";
  `)
}
