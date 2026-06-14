import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_flavor_selection" AS ENUM('single', 'mixAndMatch');
  CREATE TYPE "public"."enum__products_v_version_flavor_selection" AS ENUM('single', 'mixAndMatch');
  ALTER TABLE "products" ADD COLUMN "flavor_selection" "enum_products_flavor_selection" DEFAULT 'single';
  ALTER TABLE "_products_v" ADD COLUMN "version_flavor_selection" "enum__products_v_version_flavor_selection" DEFAULT 'single';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "flavor_selection";
  ALTER TABLE "_products_v" DROP COLUMN "version_flavor_selection";
  DROP TYPE "public"."enum_products_flavor_selection";
  DROP TYPE "public"."enum__products_v_version_flavor_selection";`)
}
