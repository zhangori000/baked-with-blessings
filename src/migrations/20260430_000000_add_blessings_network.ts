import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_blessings_network_owners_public_status" AS ENUM('under_review', 'published', 'declined');
  CREATE TYPE "public"."enum_blessings_network_questions_public_status" AS ENUM('under_review', 'published', 'declined');
  CREATE TYPE "public"."enum_blessings_network_questions_question_status" AS ENUM('seeking_advice', 'answered', 'archived');
  CREATE TYPE "public"."enum_blessings_network_answers_public_status" AS ENUM('under_review', 'published', 'declined');
  CREATE TABLE "blessings_network_owners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" varchar DEFAULT 'baked-with-blessings' NOT NULL,
  	"public_status" "enum_blessings_network_owners_public_status" DEFAULT 'under_review' NOT NULL,
  	"owner_name" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"business_name" varchar NOT NULL,
  	"business_type" varchar,
  	"location" varchar NOT NULL,
  	"website_url" varchar,
  	"linkedin_url" varchar,
  	"description" varchar NOT NULL,
  	"bio" varchar,
  	"contact_email" varchar,
  	"display_order" numeric DEFAULT 100,
  	"moderation_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blessings_network_questions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" varchar DEFAULT 'baked-with-blessings' NOT NULL,
  	"public_status" "enum_blessings_network_questions_public_status" DEFAULT 'published' NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"category" varchar DEFAULT 'Starting out' NOT NULL,
  	"question_status" "enum_blessings_network_questions_question_status" DEFAULT 'seeking_advice' NOT NULL,
  	"asked_by_name" varchar DEFAULT 'Orianna Paxton' NOT NULL,
  	"display_order" numeric DEFAULT 100,
  	"moderation_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blessings_network_answers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" varchar DEFAULT 'baked-with-blessings' NOT NULL,
  	"question_id" integer NOT NULL,
  	"owner_id" integer NOT NULL,
  	"public_status" "enum_blessings_network_answers_public_status" DEFAULT 'under_review' NOT NULL,
  	"answer" varchar NOT NULL,
  	"practical_takeaway" varchar,
  	"display_order" numeric DEFAULT 100,
  	"submitted_by_email" varchar,
  	"submission_key" varchar,
  	"published_at" timestamp(3) with time zone,
  	"moderation_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "blessings_network_answers" ADD CONSTRAINT "blessings_network_answers_question_fk" FOREIGN KEY ("question_id") REFERENCES "public"."blessings_network_questions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blessings_network_answers" ADD CONSTRAINT "blessings_network_answers_owner_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."blessings_network_owners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "blessings_network_owners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "blessings_network_questions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "blessings_network_answers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blessings_network_owners_fk" FOREIGN KEY ("blessings_network_owners_id") REFERENCES "public"."blessings_network_owners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blessings_network_questions_fk" FOREIGN KEY ("blessings_network_questions_id") REFERENCES "public"."blessings_network_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blessings_network_answers_fk" FOREIGN KEY ("blessings_network_answers_id") REFERENCES "public"."blessings_network_answers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "blessings_network_owners_tenant_id_idx" ON "blessings_network_owners" USING btree ("tenant_id");
  CREATE INDEX "blessings_network_owners_public_status_idx" ON "blessings_network_owners" USING btree ("public_status");
  CREATE INDEX "blessings_network_owners_updated_at_idx" ON "blessings_network_owners" USING btree ("updated_at");
  CREATE INDEX "blessings_network_owners_created_at_idx" ON "blessings_network_owners" USING btree ("created_at");
  CREATE INDEX "blessings_network_questions_tenant_id_idx" ON "blessings_network_questions" USING btree ("tenant_id");
  CREATE INDEX "blessings_network_questions_public_status_idx" ON "blessings_network_questions" USING btree ("public_status");
  CREATE INDEX "blessings_network_questions_question_status_idx" ON "blessings_network_questions" USING btree ("question_status");
  CREATE INDEX "blessings_network_questions_updated_at_idx" ON "blessings_network_questions" USING btree ("updated_at");
  CREATE INDEX "blessings_network_questions_created_at_idx" ON "blessings_network_questions" USING btree ("created_at");
  CREATE INDEX "blessings_network_answers_tenant_id_idx" ON "blessings_network_answers" USING btree ("tenant_id");
  CREATE INDEX "blessings_network_answers_question_idx" ON "blessings_network_answers" USING btree ("question_id");
  CREATE INDEX "blessings_network_answers_owner_idx" ON "blessings_network_answers" USING btree ("owner_id");
  CREATE INDEX "blessings_network_answers_public_status_idx" ON "blessings_network_answers" USING btree ("public_status");
  CREATE UNIQUE INDEX "blessings_network_answers_submission_key_idx" ON "blessings_network_answers" USING btree ("submission_key");
  CREATE INDEX "blessings_network_answers_updated_at_idx" ON "blessings_network_answers" USING btree ("updated_at");
  CREATE INDEX "blessings_network_answers_created_at_idx" ON "blessings_network_answers" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_blessings_network_owners_idx" ON "payload_locked_documents_rels" USING btree ("blessings_network_owners_id");
  CREATE INDEX "payload_locked_documents_rels_blessings_network_questions_idx" ON "payload_locked_documents_rels" USING btree ("blessings_network_questions_id");
  CREATE INDEX "payload_locked_documents_rels_blessings_network_answers_idx" ON "payload_locked_documents_rels" USING btree ("blessings_network_answers_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "blessings_network_answers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "blessings_network_questions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "blessings_network_owners_id";
  DROP TABLE "blessings_network_answers" CASCADE;
  DROP TABLE "blessings_network_questions" CASCADE;
  DROP TABLE "blessings_network_owners" CASCADE;
  DROP TYPE "public"."enum_blessings_network_answers_public_status";
  DROP TYPE "public"."enum_blessings_network_questions_question_status";
  DROP TYPE "public"."enum_blessings_network_questions_public_status";
  DROP TYPE "public"."enum_blessings_network_owners_public_status";
  `)
}
