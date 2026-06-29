import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_pages" ADD COLUMN IF NOT EXISTS "about_enabled" boolean DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_pages" DROP COLUMN IF EXISTS "about_enabled";
  `)
}
