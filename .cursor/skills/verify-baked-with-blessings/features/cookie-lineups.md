# Cookie lineups

Cookie lineups is this week's specials. The baker opens the live lineup and chooses the cookies customers see on Specials of the Week. Prices and photos stay on Cookies and menu. Public `/rotations` still loads; this recipe is the admin side.

## Sub-features

- `lineup-dashboard-card` shows `This week's specials` with the live lineup or a no-live-lineup state.
- `lineup-daily-work` opens Cookie lineups from the Daily work card.
- `lineup-collection` uses heading `Cookie lineups` and bakery intro copy, not Flavor Rotations.
- `lineup-status` reads `Not live yet` / `Live now` / `Past lineup`.
- `lineup-specials-field` uses the customer-facing list labeled `This week's specials`.
- `lineup-planning-field` keeps `Cookies you might rotate this month` as the planning pool.
- `lineup-one-live` allows only one Live now lineup.

## How to get to it (user POV)

- From the dashboard, read the attention card `This week's specials`.
- Choose `Change this week's cookies →` on a live lineup, or `Open cookie lineups` when none is live.
- Choose the Daily work card `Cookie lineups`.
- Open `{PREVIEW}/admin/collections/flavor-rotations` (the path is still `flavor-rotations`; the heading is Cookie lineups).
- From Cookies and menu intro, follow the `Cookie lineups` link.

## Driving it with the browser

Preconditions:

- Signed in on the Ready preview dashboard.
- Doctor has passed. Public `/rotations` is not required for this file; see `public-specials-and-menu.md` for that path.
- Do not create a second live lineup unless the owner asked you to edit preview content.

- **Dashboard card.** On `/admin`, find the article headed `This week's specials`. Copy says this is the live Cookie lineup.
- **Live lineup.** If the card shows `Live now`, an admin title, optional cookie names, and `Change this week's cookies →`, click that link in this tab. The URL is `/admin/collections/flavor-rotations/{id}`. Status is `Live now`. The field `This week's specials` lists the cookies customers see, in order.
- **No live lineup.** If the card says `No cookie lineup is active.` or `N lineups are active. Choose just one.`, click `Open cookie lineups`. Do not mark `lineup-specials-field` verified until a live document is open.
- **Daily work entry.** Return to `/admin`. In Daily work, click `Cookie lineups` (`Pick this week's specials. Customers see these on Specials of the Week.`). Land on `/admin/collections/flavor-rotations` with heading `Cookie lineups`.
- **List intro.** The intro says this is this week's specials, and that price or photo changes belong on `Cookies and menu`. Collection description is `This week's specials. The live lineup is what customers see on Specials of the Week.`
- **Open a lineup.** Open the live row when one exists, otherwise any row. Status options are `Not live yet`, `Live now`, `Past lineup`. Admin name is internal. The customer-facing relationship is `This week's specials`. The planning relationship is `Cookies you might rotate this month`.
- **One live.** If you are only observing, do not set a second lineup to Live now. The product error for that attempt is `Only one cookie lineup can be live. Archive the current live lineup first, then set this one to Live now.`
- **Sidebar group.** Payload nav groups Cookie lineups under `Daily work`, next to Orders and Cookies and menu.
- **Proof.** Save `artifacts/verify-baked-with-blessings/cookie-lineups/dashboard-this-weeks-specials.png` and `artifacts/verify-baked-with-blessings/cookie-lineups/collection.png`. The collection screenshot must show the heading `Cookie lineups` and the specials field or intro, not the old Flavor Rotations label.

## Gotchas

- The collection slug remains `flavor-rotations`. Assert the visible heading and labels, not the slug.
- Two pools still exist. `This week's specials` is the live customer list. `Cookies you might rotate this month` is planning. Do not collapse them or call the planning pool the storefront list.
- Moving one cookie from a cookie form into this week's specials is possible; Cookie lineups is still the place to pick and order the week.
- `No cookie lineup is live right now. Open Cookie lineups, set one to Live now, then try again.` is the baker-facing error when automation needs a live lineup. That is a preview-data state, not a reason to use production.
- Do not hide Carts or Transactions to "simplify" the sidebar. They stay under `Advanced`.
- Preview catalog is preview data. Cookie names on the live card will not match production Specials of the Week.
