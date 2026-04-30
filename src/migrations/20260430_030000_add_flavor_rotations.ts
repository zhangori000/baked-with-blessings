import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_flavor_rotations_status" AS ENUM('draft', 'active', 'archived');
  CREATE TYPE "public"."enum_flavor_rotations_rotation_type" AS ENUM('monthly', 'seasonal', 'special');
  CREATE TABLE "flavor_rotations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_flavor_rotations_status" DEFAULT 'draft' NOT NULL,
  	"rotation_type" "enum_flavor_rotations_rotation_type" DEFAULT 'monthly' NOT NULL,
  	"display_label" varchar,
  	"individual_flavor_slots" numeric DEFAULT 3 NOT NULL,
  	"monthly_flavor_label" varchar DEFAULT 'This month''s flavor',
  	"locked_label" varchar DEFAULT 'Catering only this month',
  	"locked_description" varchar DEFAULT 'This flavor is outside the current rotation, but you can still order it in batches of 10, mini or regular size, from the menu.',
  	"menu_link_label" varchar DEFAULT 'View menu',
  	"owner_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "flavor_rotations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  ALTER TABLE "flavor_rotations_rels" ADD CONSTRAINT "flavor_rotations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."flavor_rotations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "flavor_rotations_rels" ADD CONSTRAINT "flavor_rotations_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "flavor_rotations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flavor_rotations_fk" FOREIGN KEY ("flavor_rotations_id") REFERENCES "public"."flavor_rotations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "flavor_rotations_status_idx" ON "flavor_rotations" USING btree ("status");
  CREATE INDEX "flavor_rotations_updated_at_idx" ON "flavor_rotations" USING btree ("updated_at");
  CREATE INDEX "flavor_rotations_created_at_idx" ON "flavor_rotations" USING btree ("created_at");
  CREATE INDEX "flavor_rotations_rels_order_idx" ON "flavor_rotations_rels" USING btree ("order");
  CREATE INDEX "flavor_rotations_rels_parent_idx" ON "flavor_rotations_rels" USING btree ("parent_id");
  CREATE INDEX "flavor_rotations_rels_path_idx" ON "flavor_rotations_rels" USING btree ("path");
  CREATE INDEX "flavor_rotations_rels_products_id_idx" ON "flavor_rotations_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_flavor_rotations_id_idx" ON "payload_locked_documents_rels" USING btree ("flavor_rotations_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "flavor_rotations_id";
  DROP TABLE "flavor_rotations_rels" CASCADE;
  DROP TABLE "flavor_rotations" CASCADE;
  DROP TYPE "public"."enum_flavor_rotations_rotation_type";
  DROP TYPE "public"."enum_flavor_rotations_status";
  `)
}
