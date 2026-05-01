import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "discord_username" varchar;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "discord_username_public" boolean DEFAULT false;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "league_username" varchar;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "league_username_public" boolean DEFAULT false;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "nintendo_id" varchar;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "nintendo_id_public" boolean DEFAULT false;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "ptcg_id" varchar;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "ptcg_id_public" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "ptcg_id_public";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "ptcg_id";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "nintendo_id_public";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "nintendo_id";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "league_username_public";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "league_username";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "discord_username_public";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "discord_username";
  `)
}
