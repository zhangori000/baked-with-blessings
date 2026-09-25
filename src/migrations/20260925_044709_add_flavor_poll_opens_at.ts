import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "flavor_polls" ADD COLUMN IF NOT EXISTS "opens_at" timestamp(3) with time zone;
  CREATE INDEX IF NOT EXISTS "flavor_polls_opens_at_idx" ON "flavor_polls" USING btree ("opens_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "flavor_polls_opens_at_idx";
  ALTER TABLE "flavor_polls" DROP COLUMN IF EXISTS "opens_at";`)
}
