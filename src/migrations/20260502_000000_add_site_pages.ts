import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "site_pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "community_enabled" boolean DEFAULT true,
      "reviews_enabled" boolean DEFAULT true,
      "blog_enabled" boolean DEFAULT true,
      "discussion_board_enabled" boolean DEFAULT true,
      "blessings_network_enabled" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    ALTER TABLE "site_pages" DISABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "site_pages" CASCADE;
  `)
}
