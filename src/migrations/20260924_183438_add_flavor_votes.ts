import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_flavor_polls_status" AS ENUM('draft', 'live');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "flavor_polls" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar DEFAULT 'Vote for next week’s flavors' NOT NULL,
      "status" "enum_flavor_polls_status" DEFAULT 'draft' NOT NULL,
      "closes_at" timestamp(3) with time zone NOT NULL,
      "votes_per_person" numeric DEFAULT 3 NOT NULL,
      "show_standings_after_voting" boolean DEFAULT true,
      "allow_flavor_ideas" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "flavor_polls_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer
    );

    CREATE TABLE IF NOT EXISTS "flavor_poll_votes" (
      "id" serial PRIMARY KEY NOT NULL,
      "poll_id" integer NOT NULL,
      "voter_key" varchar NOT NULL,
      "flavor_idea" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "flavor_poll_votes_picks" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "count" numeric NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "flavor_polls_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "flavor_poll_votes_id" integer;
    ALTER TABLE "site_pages" ADD COLUMN IF NOT EXISTS "flavor_vote_enabled" boolean DEFAULT true;

    DO $$ BEGIN
      ALTER TABLE "flavor_polls_rels" ADD CONSTRAINT "flavor_polls_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."flavor_polls"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "flavor_polls_rels" ADD CONSTRAINT "flavor_polls_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "flavor_poll_votes" ADD CONSTRAINT "flavor_poll_votes_poll_id_flavor_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."flavor_polls"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "flavor_poll_votes_picks" ADD CONSTRAINT "flavor_poll_votes_picks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "flavor_poll_votes_picks" ADD CONSTRAINT "flavor_poll_votes_picks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."flavor_poll_votes"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flavor_polls_fk" FOREIGN KEY ("flavor_polls_id") REFERENCES "public"."flavor_polls"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flavor_poll_votes_fk" FOREIGN KEY ("flavor_poll_votes_id") REFERENCES "public"."flavor_poll_votes"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "flavor_polls_status_idx" ON "flavor_polls" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "flavor_polls_closes_at_idx" ON "flavor_polls" USING btree ("closes_at");
    CREATE INDEX IF NOT EXISTS "flavor_polls_updated_at_idx" ON "flavor_polls" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "flavor_polls_created_at_idx" ON "flavor_polls" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "flavor_polls_rels_order_idx" ON "flavor_polls_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "flavor_polls_rels_parent_idx" ON "flavor_polls_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "flavor_polls_rels_path_idx" ON "flavor_polls_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "flavor_polls_rels_products_id_idx" ON "flavor_polls_rels" USING btree ("products_id");
    CREATE INDEX IF NOT EXISTS "flavor_poll_votes_picks_order_idx" ON "flavor_poll_votes_picks" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "flavor_poll_votes_picks_parent_id_idx" ON "flavor_poll_votes_picks" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "flavor_poll_votes_picks_product_idx" ON "flavor_poll_votes_picks" USING btree ("product_id");
    CREATE INDEX IF NOT EXISTS "flavor_poll_votes_poll_idx" ON "flavor_poll_votes" USING btree ("poll_id");
    CREATE INDEX IF NOT EXISTS "flavor_poll_votes_updated_at_idx" ON "flavor_poll_votes" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "flavor_poll_votes_created_at_idx" ON "flavor_poll_votes" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "poll_voterKey_idx" ON "flavor_poll_votes" USING btree ("poll_id","voter_key");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_flavor_polls_id_idx" ON "payload_locked_documents_rels" USING btree ("flavor_polls_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_flavor_poll_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("flavor_poll_votes_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_flavor_polls_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_flavor_poll_votes_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_flavor_polls_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_flavor_poll_votes_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "flavor_polls_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "flavor_poll_votes_id";
    DROP TABLE IF EXISTS "flavor_poll_votes_picks" CASCADE;
    DROP TABLE IF EXISTS "flavor_poll_votes" CASCADE;
    DROP TABLE IF EXISTS "flavor_polls_rels" CASCADE;
    DROP TABLE IF EXISTS "flavor_polls" CASCADE;
    ALTER TABLE "site_pages" DROP COLUMN IF EXISTS "flavor_vote_enabled";
    DROP TYPE IF EXISTS "public"."enum_flavor_polls_status";
  `)
}
