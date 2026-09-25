import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_bakery_updates_status" AS ENUM('preparing', 'sending', 'sent');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_bakery_update_deliveries_channel" AS ENUM('sms', 'email');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_bakery_update_deliveries_status" AS ENUM('queued', 'sending', 'sent', 'failed', 'skipped');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "bakery_updates" (
      "id" serial PRIMARY KEY NOT NULL,
      "subject" varchar NOT NULL,
      "message" varchar NOT NULL,
      "send_text" boolean DEFAULT false,
      "send_email" boolean DEFAULT false,
      "status" "enum_bakery_updates_status" DEFAULT 'preparing' NOT NULL,
      "request_key" varchar NOT NULL,
      "sent_by_id" integer,
      "finished_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "bakery_update_deliveries" (
      "id" serial PRIMARY KEY NOT NULL,
      "bakery_update_id" integer NOT NULL,
      "customer_id" integer NOT NULL,
      "channel" "enum_bakery_update_deliveries_channel" NOT NULL,
      "address" varchar NOT NULL,
      "status" "enum_bakery_update_deliveries_status" DEFAULT 'queued' NOT NULL,
      "provider_message_id" varchar,
      "error" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "bakery_updates"
        ADD CONSTRAINT "bakery_updates_sent_by_id_admins_id_fk"
        FOREIGN KEY ("sent_by_id") REFERENCES "public"."admins"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- Both columns are NOT NULL, so cascade (not set null) keeps customer and
    -- update deletes working.
    DO $$ BEGIN
      ALTER TABLE "bakery_update_deliveries"
        ADD CONSTRAINT "bakery_update_deliveries_bakery_update_id_bakery_updates_id_fk"
        FOREIGN KEY ("bakery_update_id") REFERENCES "public"."bakery_updates"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "bakery_update_deliveries"
        ADD CONSTRAINT "bakery_update_deliveries_customer_id_customers_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "bakery_updates_status_idx" ON "bakery_updates" USING btree ("status");
    CREATE UNIQUE INDEX IF NOT EXISTS "bakery_updates_request_key_idx" ON "bakery_updates" USING btree ("request_key");
    CREATE INDEX IF NOT EXISTS "bakery_updates_sent_by_idx" ON "bakery_updates" USING btree ("sent_by_id");
    CREATE INDEX IF NOT EXISTS "bakery_updates_updated_at_idx" ON "bakery_updates" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "bakery_updates_created_at_idx" ON "bakery_updates" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "bakery_update_deliveries_bakery_update_idx" ON "bakery_update_deliveries" USING btree ("bakery_update_id");
    CREATE INDEX IF NOT EXISTS "bakery_update_deliveries_customer_idx" ON "bakery_update_deliveries" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "bakery_update_deliveries_status_idx" ON "bakery_update_deliveries" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "bakery_update_deliveries_updated_at_idx" ON "bakery_update_deliveries" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "bakery_update_deliveries_created_at_idx" ON "bakery_update_deliveries" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "bakeryUpdate_customer_channel_idx" ON "bakery_update_deliveries" USING btree ("bakery_update_id", "customer_id", "channel");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "bakery_updates_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "bakery_update_deliveries_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_bakery_updates_fk"
        FOREIGN KEY ("bakery_updates_id") REFERENCES "public"."bakery_updates"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_bakery_update_deliveries_fk"
        FOREIGN KEY ("bakery_update_deliveries_id") REFERENCES "public"."bakery_update_deliveries"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bakery_updates_id_idx"
      ON "payload_locked_documents_rels" USING btree ("bakery_updates_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bakery_update_deliveries_i_idx"
      ON "payload_locked_documents_rels" USING btree ("bakery_update_deliveries_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_bakery_update_deliveries_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_bakery_updates_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_bakery_update_deliveries_i_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_bakery_updates_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "bakery_update_deliveries_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "bakery_updates_id";

    DROP TABLE IF EXISTS "bakery_update_deliveries" CASCADE;
    DROP TABLE IF EXISTS "bakery_updates" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_bakery_update_deliveries_status";
    DROP TYPE IF EXISTS "public"."enum_bakery_update_deliveries_channel";
    DROP TYPE IF EXISTS "public"."enum_bakery_updates_status";
  `)
}
