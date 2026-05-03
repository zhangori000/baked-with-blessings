import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_community_notes_votes_value" AS ENUM('like', 'dislike');

    CREATE TABLE "community_notes_order_item_snapshot" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_title" varchar NOT NULL,
      "quantity" numeric DEFAULT 1 NOT NULL
    );

    CREATE TABLE "community_notes_votes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "customer_id" integer NOT NULL,
      "value" "enum_community_notes_votes_value" NOT NULL
    );

    CREATE TABLE "community_notes" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_id" integer NOT NULL,
      "customer_id" integer NOT NULL,
      "body" varchar NOT NULL,
      "is_anonymous" boolean DEFAULT false,
      "pseudonym" varchar,
      "is_hidden" boolean DEFAULT false,
      "like_count" numeric DEFAULT 0,
      "dislike_count" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "community_page_content" (
      "id" serial PRIMARY KEY NOT NULL,
      "eyebrow" varchar DEFAULT 'POST-IT WALL',
      "title" varchar DEFAULT 'Community',
      "summary" varchar DEFAULT 'Tiny letters from people who just ordered with us. After every order, we ask the customer if they want to leave a note for the world — what they got, what they were thinking. Hover, react, scroll. We are limit testing this page; future versions will have more rooms.',
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    ALTER TABLE "community_notes_order_item_snapshot"
      ADD CONSTRAINT "community_notes_order_item_snapshot_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."community_notes"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "community_notes_votes"
      ADD CONSTRAINT "community_notes_votes_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."community_notes"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "community_notes_votes"
      ADD CONSTRAINT "community_notes_votes_customer_id_customers_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "community_notes"
      ADD CONSTRAINT "community_notes_order_id_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "community_notes"
      ADD CONSTRAINT "community_notes_customer_id_customers_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "community_notes_id" integer;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_community_notes_fk"
      FOREIGN KEY ("community_notes_id") REFERENCES "public"."community_notes"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "community_notes_order_item_snapshot_order_idx"
      ON "community_notes_order_item_snapshot" USING btree ("_order");
    CREATE INDEX "community_notes_order_item_snapshot_parent_id_idx"
      ON "community_notes_order_item_snapshot" USING btree ("_parent_id");

    CREATE INDEX "community_notes_votes_order_idx"
      ON "community_notes_votes" USING btree ("_order");
    CREATE INDEX "community_notes_votes_parent_id_idx"
      ON "community_notes_votes" USING btree ("_parent_id");
    CREATE INDEX "community_notes_votes_customer_idx"
      ON "community_notes_votes" USING btree ("customer_id");

    CREATE UNIQUE INDEX "community_notes_order_idx"
      ON "community_notes" USING btree ("order_id");
    CREATE INDEX "community_notes_customer_idx"
      ON "community_notes" USING btree ("customer_id");
    CREATE INDEX "community_notes_is_hidden_idx"
      ON "community_notes" USING btree ("is_hidden");
    CREATE INDEX "community_notes_updated_at_idx"
      ON "community_notes" USING btree ("updated_at");
    CREATE INDEX "community_notes_created_at_idx"
      ON "community_notes" USING btree ("created_at");

    CREATE INDEX "payload_locked_documents_rels_community_notes_idx"
      ON "payload_locked_documents_rels" USING btree ("community_notes_id");

    ALTER TABLE "community_notes" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "community_notes_order_item_snapshot" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "community_notes_votes" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "community_page_content" DISABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "community_notes_id";
    DROP TABLE "community_notes_votes" CASCADE;
    DROP TABLE "community_notes_order_item_snapshot" CASCADE;
    DROP TABLE "community_notes" CASCADE;
    DROP TABLE "community_page_content" CASCADE;
    DROP TYPE "public"."enum_community_notes_votes_value";
  `)
}
