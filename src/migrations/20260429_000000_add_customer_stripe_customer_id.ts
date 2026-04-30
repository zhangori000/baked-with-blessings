import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "customers" ADD COLUMN "stripe_customer_i_d" varchar;
  CREATE UNIQUE INDEX "customers_stripe_customer_i_d_idx" ON "customers" USING btree ("stripe_customer_i_d");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "public"."customers_stripe_customer_i_d_idx";
  ALTER TABLE "customers" DROP COLUMN "stripe_customer_i_d";
  `)
}
