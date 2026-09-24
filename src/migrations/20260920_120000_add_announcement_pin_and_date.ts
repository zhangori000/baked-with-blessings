import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "announcements_items" ADD COLUMN IF NOT EXISTS "posted_on" timestamp(3) with time zone;
    ALTER TABLE "announcements_items" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false;

    UPDATE "announcements_items" AS items
    SET "posted_on" = COALESCE(parent."updated_at", parent."created_at", NOW())
    FROM "announcements" AS parent
    WHERE items."_parent_id" = parent."id"
      AND items."posted_on" IS NULL;

    UPDATE "announcements_items"
    SET "pinned" = false
    WHERE "pinned" IS NULL;

    ALTER TABLE "announcements_items" ALTER COLUMN "posted_on" SET NOT NULL;
    ALTER TABLE "announcements_items" ALTER COLUMN "pinned" SET DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "announcements_items" DROP COLUMN IF EXISTS "pinned";
    ALTER TABLE "announcements_items" DROP COLUMN IF EXISTS "posted_on";
  `)
}
