import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_feature_requests_visibility" AS ENUM('public', 'private');
    CREATE TYPE "public"."enum_feature_requests_display_mode" AS ENUM('self', 'anonymous');
    CREATE TYPE "public"."enum_feature_request_comments_display_mode" AS ENUM('self', 'anonymous');

    CREATE TABLE "feature_requests_ratings" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "customer_id" integer NOT NULL,
      "value" numeric NOT NULL
    );

    CREATE TABLE "feature_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "customer_id" integer NOT NULL,
      "visibility" "enum_feature_requests_visibility" DEFAULT 'public' NOT NULL,
      "title" varchar NOT NULL,
      "body" varchar NOT NULL,
      "display_mode" "enum_feature_requests_display_mode" DEFAULT 'self',
      "pseudonym" varchar,
      "is_hidden" boolean DEFAULT false,
      "rating_count" numeric DEFAULT 0,
      "rating_sum" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "feature_request_comments" (
      "id" serial PRIMARY KEY NOT NULL,
      "request_id" integer NOT NULL,
      "customer_id" integer NOT NULL,
      "body" varchar NOT NULL,
      "display_mode" "enum_feature_request_comments_display_mode" DEFAULT 'self',
      "pseudonym" varchar,
      "is_hidden" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "feature_requests_content" (
      "id" serial PRIMARY KEY NOT NULL,
      "eyebrow" varchar DEFAULT 'TELL US WHAT TO BUILD',
      "title" varchar DEFAULT 'Request Features',
      "summary" varchar DEFAULT 'Anything you want to see — pages, food, packaging, the way orders work, copy on the site, the way we treat your time. Public requests are encouraged so other people can rate them five stars and we can prioritize what the community actually wants. Want to keep it between us? Send it privately and only the bakery owner sees it.',
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    ALTER TABLE "site_pages" ADD COLUMN "feature_requests_enabled" boolean DEFAULT true;

    ALTER TABLE "feature_requests_ratings"
      ADD CONSTRAINT "feature_requests_ratings_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."feature_requests"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "feature_requests_ratings"
      ADD CONSTRAINT "feature_requests_ratings_customer_id_customers_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "feature_requests"
      ADD CONSTRAINT "feature_requests_customer_id_customers_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "feature_request_comments"
      ADD CONSTRAINT "feature_request_comments_request_id_feature_requests_id_fk"
      FOREIGN KEY ("request_id") REFERENCES "public"."feature_requests"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "feature_request_comments"
      ADD CONSTRAINT "feature_request_comments_customer_id_customers_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "feature_requests_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "feature_request_comments_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_feature_requests_fk"
      FOREIGN KEY ("feature_requests_id") REFERENCES "public"."feature_requests"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_feature_request_comments_fk"
      FOREIGN KEY ("feature_request_comments_id") REFERENCES "public"."feature_request_comments"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "feature_requests_ratings_order_idx"
      ON "feature_requests_ratings" USING btree ("_order");
    CREATE INDEX "feature_requests_ratings_parent_id_idx"
      ON "feature_requests_ratings" USING btree ("_parent_id");
    CREATE INDEX "feature_requests_ratings_customer_idx"
      ON "feature_requests_ratings" USING btree ("customer_id");

    CREATE INDEX "feature_requests_customer_idx"
      ON "feature_requests" USING btree ("customer_id");
    CREATE INDEX "feature_requests_visibility_idx"
      ON "feature_requests" USING btree ("visibility");
    CREATE INDEX "feature_requests_is_hidden_idx"
      ON "feature_requests" USING btree ("is_hidden");
    CREATE INDEX "feature_requests_updated_at_idx"
      ON "feature_requests" USING btree ("updated_at");
    CREATE INDEX "feature_requests_created_at_idx"
      ON "feature_requests" USING btree ("created_at");

    CREATE INDEX "feature_request_comments_request_idx"
      ON "feature_request_comments" USING btree ("request_id");
    CREATE INDEX "feature_request_comments_customer_idx"
      ON "feature_request_comments" USING btree ("customer_id");
    CREATE INDEX "feature_request_comments_is_hidden_idx"
      ON "feature_request_comments" USING btree ("is_hidden");
    CREATE INDEX "feature_request_comments_created_at_idx"
      ON "feature_request_comments" USING btree ("created_at");

    CREATE INDEX "payload_locked_documents_rels_feature_requests_idx"
      ON "payload_locked_documents_rels" USING btree ("feature_requests_id");
    CREATE INDEX "payload_locked_documents_rels_feature_request_comments_idx"
      ON "payload_locked_documents_rels" USING btree ("feature_request_comments_id");

    ALTER TABLE "feature_requests" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "feature_requests_ratings" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "feature_request_comments" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "feature_requests_content" DISABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "feature_requests_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "feature_request_comments_id";
    ALTER TABLE "site_pages" DROP COLUMN IF EXISTS "feature_requests_enabled";
    DROP TABLE "feature_request_comments" CASCADE;
    DROP TABLE "feature_requests_ratings" CASCADE;
    DROP TABLE "feature_requests" CASCADE;
    DROP TABLE "feature_requests_content" CASCADE;
    DROP TYPE "public"."enum_feature_request_comments_display_mode";
    DROP TYPE "public"."enum_feature_requests_display_mode";
    DROP TYPE "public"."enum_feature_requests_visibility";
  `)
}
