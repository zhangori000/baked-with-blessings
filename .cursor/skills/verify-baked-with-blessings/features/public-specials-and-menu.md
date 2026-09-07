# Public specials and menu

The same Ready preview still serves the public storefront. `/rotations` is Specials of the Week. `/menu` is the Menu. These pages load. This recipe does not require admin sign-in after Vercel SSO.

## Sub-features

- `public-rotations-load` loads `{PREVIEW}/rotations` as Specials of the Week.
- `public-menu-load` loads `{PREVIEW}/menu` as Menu.
- `public-nav` reaches both from the storefront header in the same tab.
- `public-not-prod` stays on the preview host; live specials and Zoe's orders are not the source of truth here.
- `public-still-works` fails the run if either page is a blank body, a 5xx, or a production redirect.

## How to get to it (user POV)

- Open `{PREVIEW}/rotations` directly.
- Open `{PREVIEW}/menu` directly.
- From any public preview page, choose header `Specials of the Week` or `Menu`.
- From the signed-in admin dashboard, choose `View the storefront`, then use header nav. Stay on the preview host.

## Driving it with the browser

Preconditions:

- Doctor has passed. `curl -sI` to `{PREVIEW}/rotations` and `{PREVIEW}/menu` is not a production host.
- Vercel SSO is complete in this tab if Deployment Protection is on. If SSO is impossible, report `blocked: vercel-sso` and do not open `bakedwithblessings.com` instead.
- One tab. After admin recipes, reuse it: same origin, then change the path.

- **Refuse production.** If the address bar is `bakedwithblessings.com`, stop. Public proof on live is out of scope and can show Zoe's world.
- **Rotations direct.** Navigate this tab to `{PREVIEW}/rotations`. The document loads. Title/nav identity is `Specials of the Week`. The page is not an empty black body and not an application error. Cookie posters or the weekly showcase scenery may animate; wait until the main showcase is visible or an intentional empty specials state is visible.
- **Menu direct.** Navigate this tab to `{PREVIEW}/menu`. The document loads. Header or page identity includes `Menu`. Regular-order cookies and/or bundles render, or a deliberate empty catalog state renders. The page is not a 5xx and did not bounce to production.
- **Header entry.** From `/rotations`, choose header `Menu` (or `Open the menu` in the Menu panel). The tab goes to `/menu` on the same preview host. From `/menu`, choose `Specials of the Week` (or `View this week's specials`). The tab goes to `/rotations` on the same host.
- **Admin exit (optional).** If you are still in `/admin`, click `View the storefront`. Confirm the host is still the preview. Then use the header as above.
- **Catalog isolation.** Preview specials and menu items are preview catalog. They will not match live Specials of the Week. Do not fail the load proof because a production cookie is missing.
- **Proof.** Save `artifacts/verify-baked-with-blessings/public-specials-and-menu/rotations.png` and `artifacts/verify-baked-with-blessings/public-specials-and-menu/menu.png` with the preview host visible in the chrome or a clearly preview-only catalog. Note entry points (`direct-url` or `header-nav`).

## Gotchas

- Deployment Protection applies to public routes too. A `302` to `vercel.com/sso-api` is not a storefront bug. Complete SSO in this tab or skip with `blocked: vercel-sso`.
- `/rotations` is the specials showcase. `/menu` is the orderable menu (regular + bundles). Do not treat a successful home `/` as proof of these two routes.
- Scenery and cookie sheep take a moment to paint. Wait for the page content, not a fixed sleep that ends on a loading meadow.
- Catering is `/menu?section=catering`. That is not required to prove `/menu` loads.
- Never run `seed*` or `import:cookie-media` against the preview database to "make the public page look like prod."
- Cleanup must not delete the two screenshots. Closing a half-open header panel is enough.
