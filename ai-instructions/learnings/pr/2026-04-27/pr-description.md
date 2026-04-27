# PR Description

## Title

Add blog, public discussion tools, reviews, and route cleanup

## Summary

This PR adds a Payload-backed blog system, a structured discussion board, and a public reviews experience to the Baked with Blessings site. It also cleans up the legacy `/shop` route assumptions by moving shared menu UI into the current `/menu` route structure and adding a guard that fails local dev/build if the old shop route or imports are reintroduced.

## Major Changes

- Added a new `posts` Payload collection with draft/version support, rich text editing, SEO fields, admin preview/live preview, published access control, and route revalidation for `/blog` and `/blog/[slug]`.
- Added `/blog` and `/blog/[slug]` frontend pages with the shared scenery hero, compact document-style rows, Georgia-style article typography, post metadata, sitemap/metadata support, and the seeded Orianna Paxton post.
- Added a structured discussion graph feature with `discussion-nodes`, `discussion-edges`, and `awareness-marks` collections, public read access for visible content, starter data services, reply/awareness API routes, and a fully styled `/discussion-board` page.
- Added a public reviews system with a `reviews` collection, moderation/publication status fields, business responses, fairness notes, action logs, review data/mutation services, an API route, and a styled `/reviews` page.
- Updated the header and mobile navigation so Blog, Discussion Board, and Reviews live under the "Other pages" app-style panel.
- Moved legacy shared menu components from `src/app/(app)/shop` into `src/app/(app)/menu/_components`, removed the `shopHref` alias, and added `scripts/check-no-shop-route.ts` with `predev` / `prebuild` enforcement.
- Added SEO infrastructure updates including root `robots.ts`, app sitemap generation, post-aware meta generation, post preview paths, link field support for posts, and a flower favicon.
- Added seed support for blog content and rich text paragraph helpers.
- Added/reused loading and response skeleton components to keep the new public pages from feeling blank while server data loads.

## Payload / Database Impact

This PR adds these Payload collections/tables:

- `posts`
- `discussion-nodes`
- `discussion-edges`
- `awareness-marks`
- `reviews`

It also updates existing Payload configuration, generated types, SEO plugin setup, link field collection support, and seed behavior. Postgres-backed development will pull/update schema for these collections when Payload initializes.

## Files To Review Closely

- `src/collections/Posts/index.ts`
- `src/features/discussion-graph/collections/*`
- `src/features/discussion-graph/services/*`
- `src/features/reviews/collections/*`
- `src/features/reviews/services/*`
- `src/app/(app)/blog/*`
- `src/app/(app)/discussion-board/*`
- `src/app/(app)/reviews/*`
- `src/components/Header/*`
- `src/app/(app)/menu/_components/*`
- `scripts/check-no-shop-route.ts`

## Verification

- Passed: `pnpm run check:no-shop-route`
- Smoke checked: `/blog`, seeded blog post page, `/menu`, `/rotating-cookie-flavors`
- Smoke checked: `/shop` returns `404`
- Confirmed Playwright is already installed and configured through `@playwright/test`, `playwright.config.ts`, and `pnpm test:e2e`

## Known Issues / Follow-Up

- `pnpm exec tsc --noEmit` is not currently clean. Current failures are in:
  - `src/app/(app)/discussion-board/DiscussionBoardClient.tsx`
  - `src/components/Cart/CartModal.tsx`
  - `src/components/flowers/FlowerCluster.tsx`
  - `src/features/reviews/services/reviewData.ts`
- End-to-end Playwright tests were not run as part of this PR description pass.
- The discussion board and reviews pages are substantial new surfaces and should get browser-level review across desktop and mobile before merge.
