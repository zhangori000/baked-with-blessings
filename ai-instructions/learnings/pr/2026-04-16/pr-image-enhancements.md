## PR Description

## What This PR Does

This PR moves the cookie image pipeline out of hardcoded storefront assets and into Payload-managed media backed by Vercel Blob. The business-owned cookie PNGs are now imported into the `media` collection, persisted as Payload documents in Postgres, and stored as binary files in Blob. On top of that storage shift, the cookie catalog seed flow was rewritten so the branch can seed a clean 14-cookie product catalog instead of the previous demo products.

The frontend work then refactors the sheep-card experience so the cookie body image comes from live Payload product media rather than a hardcoded poster asset list. The decorative sheep art still stays in `/public`, which is intentional. The result is a clearer split between business-managed assets and developer-managed presentation assets.

## Review Order

Start with the media/storage layer in `package.json`, `src/payload.config.ts`, and `src/collections/Media.ts`. That is the infrastructure change that makes the rest of the PR possible. After that, move to the import/seed flow in `scripts/import-cookie-media.ts`, `scripts/seed.ts`, `src/endpoints/seed/cookie-catalog.ts`, `src/endpoints/seed/cookie-media.ts`, `src/endpoints/seed/cookie-products.ts`, and `src/endpoints/seed/index.ts`.

Once the storage and data flow are clear, review the storefront refactor in `src/app/(app)/menu/_components/cookiePosterData.ts`, `src/app/(app)/menu/page.tsx`, `src/app/(app)/menu/_components/cookie-poster-grid.tsx`, `src/app/(app)/menu/_components/cookie-sheep-rig.tsx`, and the cookie detail route if present. Finish with the support docs and backlog notes under `ai-instructions/learnings/2026-04-16/` and `backlog/`.

## Media and Storage Changes

This PR upgrades the repo to Payload `3.83.0`, adds `@payloadcms/storage-vercel-blob`, and registers the Vercel Blob adapter in `src/payload.config.ts` for the `media` collection. The `Media` collection now also defines named upload variants (`thumbnail`, `card`, `poster`, `tablet`) so the app has a clear upload-time image pipeline in addition to `next/image` delivery-time optimization.

The architecture after this change is:

- Payload `media` documents live in Postgres.
- The actual PNG bytes live in Vercel Blob.
- Payload coordinates upload/write behavior.
- The frontend renders product media through the shared `Media` component, which uses `next/image`.
- Decorative assets like `singular-sheep-head.svg`, `sheep-tail.svg`, and other scene art remain in `/public`.

That last point is deliberate. Product photos and cookie PNGs are business-managed content. Decorative sheep art and scene chrome are developer-owned assets and still belong in `/public`.

## Import and Seed Flow

This PR adds a dedicated `import:cookie-media` script for the 14 cookie PNGs. The script imports the files through Payload, deduplicates by filename, and can refresh existing media when upload variants are missing. This means the branch now has an idempotent way to populate the `media` library without making the business owner click through 14 manual uploads.

The seed flow was also rewritten around a new cookie catalog source of truth. `pnpm run seed` now clears the demo product catalog, keeps the imported media, creates the cookie category, and seeds the 14 cookie `products` with their linked gallery images and metadata. The catalog now represents the actual cookie line instead of the old template/demo inventory.

## Frontend Refactor

Before this PR, the sheep-card poster flow depended on hardcoded cookie poster image assets. After this PR, `cookiePosterData.ts` keeps only the static poster chrome and styling metadata that are still developer-owned, such as chips, subtitles, label tones, and SVG fallbacks. The live cookie body image now comes from the seeded Payload product and its linked `media` document.

In practice, that means:

- `shop/page.tsx` builds cookie poster data from live Payload products.
- `cookie-poster-grid.tsx` consumes poster assets passed in from the server instead of importing a hardcoded cookie list.
- `cookie-sheep-rig.tsx` renders the cookie body with live Payload media and only falls back to the static SVG body if no media exists.
- `cookies/[slug]/page.tsx` now loads the cookie from Payload instead of relying on a fully static poster dataset.

Historical note: at the time of this PR, chips, subtitle, and related poster chrome were still hardcoded. That follow-up has since been implemented in the `Products.poster` admin fields, so this note should not be used as current backlog.

## Verification and Local Workflow

The local workflow introduced by this branch is:

1. `pnpm run db:up`
2. `pnpm run import:cookie-media`
3. `pnpm run seed`
4. `pnpm run generate:importmap` when Payload admin/plugin wiring changes
5. `pnpm dev`

During development, the 14 cookie media items were verified in Payload admin and the corresponding PNG files were verified in the Vercel Blob dashboard. The seeded cookie products were also created successfully through the new seed path.

## Included Docs and Backlog

This PR also includes a set of focused learning notes about the image pipeline, Next.js image behavior, Payload import map regeneration, and ESM/env loading gotchas. It also adds backlog notes for future work around cookie-poster admin fields and DDoS/billing protection.

Those notes are not the main product change, but they are useful because this branch introduced a real media pipeline rather than a one-off visual tweak.

## Follow-Up Work

The most important follow-up is making sheep-card presentation fields admin-manageable so the business owner can edit poster chips, subtitles, and related card copy inside Payload. Another useful next step is validating how aggressively the new Payload image variants should be used across mobile card grids, iPad layouts, and detail views so the storefront consistently prefers the right size for each slot.
