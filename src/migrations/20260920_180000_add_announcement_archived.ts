import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "announcements_items" ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false;
    UPDATE "announcements_items" SET "archived" = false WHERE "archived" IS NULL;
    ALTER TABLE "announcements_items" ALTER COLUMN "archived" SET DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "announcements_items" DROP COLUMN IF EXISTS "archived";
  `)
}
