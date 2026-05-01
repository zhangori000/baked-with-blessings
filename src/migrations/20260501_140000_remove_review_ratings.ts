import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "rating";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "rating" numeric DEFAULT 5 NOT NULL;
  `)
}
