import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_blessings_network_owner_posts_public_status" AS ENUM('under_review', 'published', 'declined');
  CREATE TABLE "blessings_network_owner_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" varchar DEFAULT 'baked-with-blessings' NOT NULL,
  	"owner_id" integer NOT NULL,
  	"public_status" "enum_blessings_network_owner_posts_public_status" DEFAULT 'under_review' NOT NULL,
  	"title" varchar NOT NULL,
  	"topic" varchar,
  	"body" varchar NOT NULL,
  	"practical_takeaway" varchar,
  	"display_order" numeric DEFAULT 100,
  	"submitted_by_email" varchar,
  	"submission_key" varchar,
  	"published_at" timestamp(3) with time zone,
  	"moderation_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "blessings_network_owner_posts" ADD CONSTRAINT "blessings_network_owner_posts_owner_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."blessings_network_owners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "blessings_network_owner_posts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blessings_network_owner_posts_fk" FOREIGN KEY ("blessings_network_owner_posts_id") REFERENCES "public"."blessings_network_owner_posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "blessings_network_owner_posts_tenant_id_idx" ON "blessings_network_owner_posts" USING btree ("tenant_id");
  CREATE INDEX "blessings_network_owner_posts_owner_idx" ON "blessings_network_owner_posts" USING btree ("owner_id");
  CREATE INDEX "blessings_network_owner_posts_public_status_idx" ON "blessings_network_owner_posts" USING btree ("public_status");
  CREATE UNIQUE INDEX "blessings_network_owner_posts_submission_key_idx" ON "blessings_network_owner_posts" USING btree ("submission_key");
  CREATE INDEX "blessings_network_owner_posts_updated_at_idx" ON "blessings_network_owner_posts" USING btree ("updated_at");
  CREATE INDEX "blessings_network_owner_posts_created_at_idx" ON "blessings_network_owner_posts" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_blessings_network_owner_posts_idx" ON "payload_locked_documents_rels" USING btree ("blessings_network_owner_posts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "blessings_network_owner_posts_id";
  DROP TABLE "blessings_network_owner_posts" CASCADE;
  DROP TYPE "public"."enum_blessings_network_owner_posts_public_status";
  `)
}
