# PR Description

## Title

Update Payload, add Vercel env safeguards, and polish menu scenery UX

## Summary

This PR updates the Baked with Blessings app to Payload `3.84.1`, adds a local guard for risky environment variable setup after the Vercel April 2026 security bulletin, and polishes the customer-facing menu scenery/photo experience. The UI work focuses on making gallery loading feel responsive, making photo scroll boundaries obvious, and improving the interactive flower/sheep spawning behavior across mobile and desktop scenery surfaces.

## Major Changes

- Updated Payload package versions to `3.84.1`.
- Added local environment security guidance and checks for Vercel-style secret handling, including build-time enforcement so missing or suspicious env setup is visible before deployment.
- Fixed TypeScript issues in discussion board, cart, flower cluster, and review data code paths so `tsc --noEmit` is clean.
- Fixed mobile header navigation flower rendering and alignment.
- Added skeleton loading states to the menu photo gallery so first-time "See photos" interactions show immediate feedback while images load.
- Added "Beginning of photos" and enlarged "No more photos" markers with the shared flower/grass border treatment to make gallery scroll limits obvious.
- Reworked menu scenery spawn behavior so flowers, sheep, and related decorative accents can randomize both horizontally and vertically inside the intended meadow rectangle instead of being pinned to a bottom row.
- Expanded moonlit and under-tree meadow space so flowers have more room to spawn, including a moonlit meadow fade to remove the hard horizontal sky/ground cut.
- Moved moonlit river/ground artwork upward so the scene has usable foreground space for flowers.
- Extended the same random vertical/horizontal spawn behavior to the rotating cookie flavors carousel and cookie poster card scenery.
- Replaced raw customer-facing decorative `<img>` usage in scenery/header/footer/cart/cookie sheep surfaces with `next/image` while keeping intentional admin/external-logo exceptions scoped.

## Payload / Database Impact

This PR updates Payload dependencies to `3.84.1`.

No new Payload collections or tables are introduced by this follow-up. Existing schema changes from the broader blog/discussion/reviews PR still apply separately.

## Security / Environment Impact

This PR adds a local safety check for environment variable handling after the Vercel April 2026 incident. The practical expectation is:

- Rotate any real secret that was ever stored in Vercel as a non-sensitive environment variable.
- Re-add real secrets in Vercel as sensitive environment variables.
- Keep `.env.example` descriptive, not secret-bearing.
- Let local `prebuild` fail or warn loudly when env setup looks unsafe.

## Files To Review Closely

- `package.json`
- `pnpm-lock.yaml`
- `.env.example`
- `README.md`
- `scripts/check-env-security.ts`
- `src/app/(app)/menu/_components/catering-menu-scenery.tsx`
- `src/app/(app)/menu/_components/catering-menu-section.client.tsx`
- `src/app/(app)/menu/_components/catering-menu-hero.css`
- `src/app/(app)/menu/_components/cookie-poster-grid.tsx`
- `src/app/(app)/HomeCookieCarousel.client.tsx`
- `src/components/scenery/menuHeroScenery.ts`
- `public/sceneries/moonlit-purple-meadow.svg`
- `src/components/Header/MobileMenu.tsx`
- `src/components/Header/index.css`
- `src/components/Header/index.client.tsx`
- `src/components/Footer/FooterClient.tsx`
- `src/components/scenery/CartSceneShell.tsx`
- `src/app/(app)/menu/_components/cookie-sheep-rig.tsx`

## Verification

- Passed: `pnpm.cmd view payload version` returned `3.84.1`.
- Passed: `pnpm.cmd run lint` with warnings only.
- Passed: `pnpm.cmd exec tsc --noEmit --pretty false`.
- Passed: focused Prettier checks for touched menu/scenery files.
- Passed: focused ESLint checks for touched menu/scenery/header/footer/cart files.
- Passed: `git diff --check` for touched menu/scenery files.
- Browser checked: `/menu` gallery "See photos" flow, skeleton behavior, enlarged "No more photos" marker, moonlit scenery, and under-tree scenery.
- Browser checked: `/rotating-cookie-flavors` mobile and desktop scenery spawning.

## Known Issues / Follow-Up

- Full repo lint still reports warnings in older template/form/media utilities, but no lint errors remain.
- End-to-end Playwright suite was not run as a full suite during this pass.
- The Vercel incident work does not rotate secrets by itself. Real Vercel project variables still need to be reviewed and rotated in the Vercel dashboard or CLI.
- Two intentional raw `<img>` exceptions remain outside the customer-facing scenery work: a Payload admin thumbnail picker that renders already-generated admin thumbnails, and the stock Payload logo component that points at an external GitHub-hosted SVG.
