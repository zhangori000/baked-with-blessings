import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "mini_price_in_u_s_d" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_mini_price_in_u_s_d" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "mini_price_in_u_s_d";
  ALTER TABLE "_products_v" DROP COLUMN "version_mini_price_in_u_s_d";`)
}
