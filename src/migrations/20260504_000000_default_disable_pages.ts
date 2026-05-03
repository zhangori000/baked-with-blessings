import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Default-disable pages that aren't ready for the public yet.
 *
 * Before this migration the site_pages columns all defaulted to true, so any
 * env that ran `pnpm sync-db` ended up with every page visible (blog,
 * discussion board, community advice). This migration:
 *
 *   1. Lowers the column DEFAULTs for the three "not ready" pages so any
 *      future fresh installs come up with those pages off.
 *   2. Explicitly UPDATEs the existing site_pages row so already-deployed
 *      envs (preview, prod) match the new opinionated defaults the next
 *      time pnpm sync-db is run there.
 *
 * The other three pages (community, reviews, feature-requests) keep
 * default = true and are not touched by the UPDATE. The bakery owner can
 * re-enable any of the three via /admin/globals/site-pages whenever those
 * pages are ready.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_pages" ALTER COLUMN "blog_enabled" SET DEFAULT false;
    ALTER TABLE "site_pages" ALTER COLUMN "discussion_board_enabled" SET DEFAULT false;
    ALTER TABLE "site_pages" ALTER COLUMN "blessings_network_enabled" SET DEFAULT false;

    INSERT INTO "site_pages" (
      "id",
      "blog_enabled",
      "discussion_board_enabled",
      "blessings_network_enabled",
      "community_enabled",
      "reviews_enabled",
      "feature_requests_enabled",
      "updated_at",
      "created_at"
    )
    VALUES (1, false, false, false, true, true, true, NOW(), NOW())
    ON CONFLICT ("id") DO UPDATE SET
      "blog_enabled" = false,
      "discussion_board_enabled" = false,
      "blessings_network_enabled" = false,
      "updated_at" = NOW();
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_pages" ALTER COLUMN "blog_enabled" SET DEFAULT true;
    ALTER TABLE "site_pages" ALTER COLUMN "discussion_board_enabled" SET DEFAULT true;
    ALTER TABLE "site_pages" ALTER COLUMN "blessings_network_enabled" SET DEFAULT true;

    UPDATE "site_pages" SET
      "blog_enabled" = true,
      "discussion_board_enabled" = true,
      "blessings_network_enabled" = true,
      "updated_at" = NOW()
    WHERE "id" = 1;
  `)
}
