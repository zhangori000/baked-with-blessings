import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "sms_ok" boolean DEFAULT false;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "sms_ok_at" timestamp(3) with time zone;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "sms_ok_source" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_ok" boolean DEFAULT false;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_ok_at" timestamp(3) with time zone;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_ok_source" varchar;

    UPDATE "customers" SET "sms_ok" = false WHERE "sms_ok" IS NULL;
    UPDATE "customers" SET "email_ok" = false WHERE "email_ok" IS NULL;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_message_consent_events_channel" AS ENUM('sms', 'email');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "message_consent_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "customer_id" integer NOT NULL,
      "channel" "enum_message_consent_events_channel" NOT NULL,
      "ok" boolean NOT NULL,
      "source" varchar NOT NULL,
      "raw_body" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "message_consent_events"
        ADD CONSTRAINT "message_consent_events_customer_id_customers_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "message_consent_events_customer_idx" ON "message_consent_events" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "message_consent_events_channel_idx" ON "message_consent_events" USING btree ("channel");
    CREATE INDEX IF NOT EXISTS "message_consent_events_updated_at_idx" ON "message_consent_events" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "message_consent_events_created_at_idx" ON "message_consent_events" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "message_consent_events_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_message_consent_events_fk"
        FOREIGN KEY ("message_consent_events_id") REFERENCES "public"."message_consent_events"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_message_consent_events_id_idx"
      ON "payload_locked_documents_rels" USING btree ("message_consent_events_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_message_consent_events_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_message_consent_events_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "message_consent_events_id";

    DROP TABLE IF EXISTS "message_consent_events" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_message_consent_events_channel";

    ALTER TABLE "customers" DROP COLUMN IF EXISTS "email_ok_source";
    ALTER TABLE "customers" DROP COLUMN IF EXISTS "email_ok_at";
    ALTER TABLE "customers" DROP COLUMN IF EXISTS "email_ok";
    ALTER TABLE "customers" DROP COLUMN IF EXISTS "sms_ok_source";
    ALTER TABLE "customers" DROP COLUMN IF EXISTS "sms_ok_at";
    ALTER TABLE "customers" DROP COLUMN IF EXISTS "sms_ok";
  `)
}
