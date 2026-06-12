import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_orders_manual_payment_method" ADD VALUE 'in_person';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ALTER COLUMN "manual_payment_method" SET DATA TYPE text;
  DROP TYPE "public"."enum_orders_manual_payment_method";
  CREATE TYPE "public"."enum_orders_manual_payment_method" AS ENUM('venmo');
  ALTER TABLE "orders" ALTER COLUMN "manual_payment_method" SET DATA TYPE "public"."enum_orders_manual_payment_method" USING "manual_payment_method"::"public"."enum_orders_manual_payment_method";`)
}
