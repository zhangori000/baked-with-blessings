import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "instagram_handle" varchar;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "linkedin_url" varchar;
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "other_contact" varchar;
    ALTER TABLE "reviews" ALTER COLUMN "public_status" SET DEFAULT 'published';
    UPDATE "reviews" SET "public_status" = 'published' WHERE "public_status" = 'under_review';

    ALTER TABLE "flavor_rotations" ALTER COLUMN "locked_description" SET DEFAULT 'Outside the monthly rotation, this flavor is available through larger catering batches only. Making a separate dough batch for one small order creates too much waste, and the bakery is not set up with the equipment or production space to do that efficiently yet.';
    UPDATE "flavor_rotations"
    SET "locked_description" = 'Outside the monthly rotation, this flavor is available through larger catering batches only. Making a separate dough batch for one small order creates too much waste, and the bakery is not set up with the equipment or production space to do that efficiently yet.'
    WHERE "locked_description" IN (
      'This flavor is outside the current rotation, but you can still order it in batches of 10, mini or regular size, from the menu.',
      'This flavor is outside the current rotation, but you can still order it in batches of 10 from the menu.',
      'Available in batches of 10, mini or regular size, on the menu.'
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "other_contact";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "linkedin_url";
    ALTER TABLE "reviews" DROP COLUMN IF EXISTS "instagram_handle";
    ALTER TABLE "reviews" ALTER COLUMN "public_status" SET DEFAULT 'under_review';

    ALTER TABLE "flavor_rotations" ALTER COLUMN "locked_description" SET DEFAULT 'This flavor is outside the current rotation, but you can still order it in batches of 10, mini or regular size, from the menu.';
    UPDATE "flavor_rotations"
    SET "locked_description" = 'This flavor is outside the current rotation, but you can still order it in batches of 10, mini or regular size, from the menu.'
    WHERE "locked_description" = 'Outside the monthly rotation, this flavor is available through larger catering batches only. Making a separate dough batch for one small order creates too much waste, and the bakery is not set up with the equipment or production space to do that efficiently yet.';
  `)
}
