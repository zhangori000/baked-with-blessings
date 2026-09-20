# Baked with Blessings verification map

This directory is the maintained source for verifying bakery-lead and public storefront behavior on a **Ready Vercel preview**. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- The Vercel deploy for the PR under test is Ready. The host is a `*.vercel.app` preview, never `bakedwithblessings.com`.
- One browser tab is open on that preview. Reuse it. Do not open a second tab for the same run.
- After Vercel SSO, logged-out `/admin` is the cream page titled `Sign in to the bakery admin` (`[data-admin-shell="login"]`, document background `#fffaf0`). It is never a blank black shell.
- Sign in with a preview admin account for this environment only. Production login still lives at `bakedwithblessings.com/admin` and is out of scope.
- Preview DB ≠ prod DB. Zoe Haase and other live orders exist only on live admin / prod DB. Their absence on preview is correct.
- Run the Doctor section in `../SKILL.md` before the first drive.
- Never drive production. Never merge. Never run hosted seed or migrate commands.

## Driving conventions

- Start every recipe from the signed-in dashboard (`What would you like to take care of?`) unless the feature file is the cream-login or public-storefront recipe.
- Prefer ARIA roles, accessible names, and the handles in `../SKILL.md` over CSS position or screenshots-as-selectors.
- Treat quoted labels as literal: `Newest first`, `This week's specials`, `Cookie lineups`, `Cookies and menu`, `On the menu`, `What they ordered`, `Paid online`.
- Navigate with in-app links or by changing the path on the same tab.
- Restore any preview document you accidentally edited. Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes a screenshot with the preview host or bakery heading visible, saved under `artifacts/verify-baked-with-blessings/<feature-id>/`.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted URL and the unmet precondition (`vercel-sso`, `no-preview-admin`, `no-live-lineup`, `empty-preview-orders`).
- Do not report a skipped entry point as verified through a different path.
- Do not treat "Zoe is missing on preview" as a product bug.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with the browser` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact handle and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, and observable proof.

## Features

- [Cream admin login](./admin-cream-login.md) covers logged-out `/admin`, the cream Sign in page, preview vs production copy, and the blank-black-shell failure.
- [Baker orders queue](./baker-orders-queue.md) covers Newest first, items and payment language, and the open-orders list.
- [Cookie lineups](./cookie-lineups.md) covers This week's specials and the Cookie lineups collection.
- [Cookies and menu](./cookies-and-menu.md) covers the standing catalog and the On the menu first tab.
- [Public specials and menu](./public-specials-and-menu.md) covers `/rotations` and `/menu` still loading on the same preview.
