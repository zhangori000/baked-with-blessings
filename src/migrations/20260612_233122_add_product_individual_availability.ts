import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_individual_availability" AS ENUM('rotation', 'always');
  CREATE TYPE "public"."enum__products_v_version_individual_availability" AS ENUM('rotation', 'always');
  ALTER TABLE "products" ADD COLUMN "individual_availability" "enum_products_individual_availability" DEFAULT 'rotation';
  ALTER TABLE "_products_v" ADD COLUMN "version_individual_availability" "enum__products_v_version_individual_availability" DEFAULT 'rotation';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "individual_availability";
  ALTER TABLE "_products_v" DROP COLUMN "version_individual_availability";
  DROP TYPE "public"."enum_products_individual_availability";
  DROP TYPE "public"."enum__products_v_version_individual_availability";`)
}
