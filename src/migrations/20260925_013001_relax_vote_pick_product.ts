import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "flavor_poll_votes_picks" ALTER COLUMN "product_id" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "flavor_poll_votes_picks" WHERE "product_id" IS NULL;
   ALTER TABLE "flavor_poll_votes_picks" ALTER COLUMN "product_id" SET NOT NULL;`)
}
