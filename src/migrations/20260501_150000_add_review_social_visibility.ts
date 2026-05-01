import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "instagram_handle_public" boolean DEFAULT false;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "linkedin_url_public" boolean DEFAULT false;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "other_contact_public" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "other_contact_public";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "linkedin_url_public";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "instagram_handle_public";
  `)
}
