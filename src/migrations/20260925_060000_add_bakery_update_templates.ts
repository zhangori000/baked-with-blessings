import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_bakery_updates_template" AS ENUM('note', 'flavor', 'market');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "bakery_updates"
      ADD COLUMN IF NOT EXISTS "template" "enum_bakery_updates_template" DEFAULT 'note' NOT NULL;
    ALTER TABLE "bakery_updates" ADD COLUMN IF NOT EXISTS "product_id" integer;
    ALTER TABLE "bakery_updates" ADD COLUMN IF NOT EXISTS "market_place" varchar;
    ALTER TABLE "bakery_updates" ADD COLUMN IF NOT EXISTS "market_date" varchar;
    ALTER TABLE "bakery_updates" ADD COLUMN IF NOT EXISTS "market_hours" varchar;
    ALTER TABLE "bakery_updates" ADD COLUMN IF NOT EXISTS "market_address" varchar;

    DO $$ BEGIN
      ALTER TABLE "bakery_updates"
        ADD CONSTRAINT "bakery_updates_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "bakery_updates_product_idx" ON "bakery_updates" USING btree ("product_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bakery_updates" DROP CONSTRAINT IF EXISTS "bakery_updates_product_id_products_id_fk";
    DROP INDEX IF EXISTS "bakery_updates_product_idx";
    ALTER TABLE "bakery_updates" DROP COLUMN IF EXISTS "market_address";
    ALTER TABLE "bakery_updates" DROP COLUMN IF EXISTS "market_hours";
    ALTER TABLE "bakery_updates" DROP COLUMN IF EXISTS "market_date";
    ALTER TABLE "bakery_updates" DROP COLUMN IF EXISTS "market_place";
    ALTER TABLE "bakery_updates" DROP COLUMN IF EXISTS "product_id";
    ALTER TABLE "bakery_updates" DROP COLUMN IF EXISTS "template";
    DROP TYPE IF EXISTS "public"."enum_bakery_updates_template";
  `)
}
