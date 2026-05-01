import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_poster_receipt_warnings_tone" AS ENUM('info', 'caution', 'danger');
  CREATE TYPE "public"."enum__products_v_version_poster_receipt_warnings_tone" AS ENUM('info', 'caution', 'danger');
  CREATE TABLE "products_poster_receipt_warnings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tone" "enum_products_poster_receipt_warnings_tone" DEFAULT 'caution',
  	"label" varchar DEFAULT 'Allergy note',
  	"message" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_poster_receipt_warnings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tone" "enum__products_v_version_poster_receipt_warnings_tone" DEFAULT 'caution',
  	"label" varchar DEFAULT 'Allergy note',
  	"message" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "products" ADD COLUMN "poster_receipt_body" jsonb;
  ALTER TABLE "products" ADD COLUMN "poster_receipt_title" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_poster_receipt_body" jsonb;
  ALTER TABLE "_products_v" ADD COLUMN "version_poster_receipt_title" varchar;
  ALTER TABLE "products_poster_receipt_warnings" ADD CONSTRAINT "products_poster_receipt_warnings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_poster_receipt_warnings" ADD CONSTRAINT "_products_v_version_poster_receipt_warnings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_poster_receipt_warnings_order_idx" ON "products_poster_receipt_warnings" USING btree ("_order");
  CREATE INDEX "products_poster_receipt_warnings_parent_id_idx" ON "products_poster_receipt_warnings" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_poster_receipt_warnings_order_idx" ON "_products_v_version_poster_receipt_warnings" USING btree ("_order");
  CREATE INDEX "_products_v_version_poster_receipt_warnings_parent_id_idx" ON "_products_v_version_poster_receipt_warnings" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "_products_v_version_poster_receipt_warnings" CASCADE;
  DROP TABLE "products_poster_receipt_warnings" CASCADE;
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_poster_receipt_title";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_poster_receipt_body";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "poster_receipt_title";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "poster_receipt_body";
  DROP TYPE "public"."enum__products_v_version_poster_receipt_warnings_tone";
  DROP TYPE "public"."enum_products_poster_receipt_warnings_tone";
  `)
}
