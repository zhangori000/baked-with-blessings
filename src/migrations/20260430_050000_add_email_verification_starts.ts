import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_email_verification_starts_flow" AS ENUM('signup');
  CREATE TABLE "email_verification_starts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"flow" "enum_email_verification_starts_flow" NOT NULL,
  	"email" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"consumed_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_verification_starts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_verification_starts_fk" FOREIGN KEY ("email_verification_starts_id") REFERENCES "public"."email_verification_starts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "email_verification_starts_key_idx" ON "email_verification_starts" USING btree ("key");
  CREATE INDEX "email_verification_starts_flow_idx" ON "email_verification_starts" USING btree ("flow");
  CREATE INDEX "email_verification_starts_email_idx" ON "email_verification_starts" USING btree ("email");
  CREATE INDEX "email_verification_starts_attempts_idx" ON "email_verification_starts" USING btree ("attempts");
  CREATE INDEX "email_verification_starts_consumed_at_idx" ON "email_verification_starts" USING btree ("consumed_at");
  CREATE INDEX "email_verification_starts_expires_at_idx" ON "email_verification_starts" USING btree ("expires_at");
  CREATE INDEX "email_verification_starts_updated_at_idx" ON "email_verification_starts" USING btree ("updated_at");
  CREATE INDEX "email_verification_starts_created_at_idx" ON "email_verification_starts" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_email_verification_starts_id_idx" ON "payload_locked_documents_rels" USING btree ("email_verification_starts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "email_verification_starts_id";
  DROP TABLE "email_verification_starts" CASCADE;
  DROP TYPE "public"."enum_email_verification_starts_flow";
  `)
}
