import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "flavor_nudges" (
      "id" serial PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "voter_key" varchar NOT NULL,
      "email" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "flavor_nudges_id" integer;

    DO $$ BEGIN
      ALTER TABLE "flavor_nudges"
        ADD CONSTRAINT "flavor_nudges_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_flavor_nudges_fk"
        FOREIGN KEY ("flavor_nudges_id") REFERENCES "public"."flavor_nudges"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "flavor_nudges_product_idx" ON "flavor_nudges" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "flavor_nudges_updated_at_idx" ON "flavor_nudges" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "flavor_nudges_created_at_idx" ON "flavor_nudges" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "product_voterKey_idx" ON "flavor_nudges" USING btree ("product_id","voter_key");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_flavor_nudges_id_idx" ON "payload_locked_documents_rels" USING btree ("flavor_nudges_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_flavor_nudges_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_flavor_nudges_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "flavor_nudges_id";
    DROP TABLE IF EXISTS "flavor_nudges" CASCADE;
  `)
}
