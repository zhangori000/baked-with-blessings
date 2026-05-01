import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN "owner_notification_sent_at" timestamp(3) with time zone;
    CREATE INDEX "orders_owner_notification_sent_at_idx" ON "orders" USING btree ("owner_notification_sent_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "orders_owner_notification_sent_at_idx";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "owner_notification_sent_at";
  `)
}
