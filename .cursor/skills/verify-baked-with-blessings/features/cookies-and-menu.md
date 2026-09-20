# Cookies and menu

Cookies and menu is the standing catalog: where a flavor lives, its price, and its photos. The first tab is `On the menu`. This week's specials are chosen on Cookie lineups, not here.

## Sub-features

- `menu-daily-work` opens Cookies and menu from the Daily work card.
- `menu-collection` uses heading `Cookies and menu` and standing-catalog intro copy, not Products.
- `menu-first-tab` opens a cookie on tab `On the menu` first.
- `menu-placement` asks `Where does this flavor live right now?` with Always available, This week's specials, or Catering trays only.
- `menu-price-photos` shows Price and photos on that first tab.
- `menu-later-tabs` keeps Writing, Trays, and Search listing after On the menu.
- `menu-cross-link` points this week's specials back to Cookie lineups.

## How to get to it (user POV)

- From the dashboard Daily work, choose `Cookies and menu`.
- Open `{PREVIEW}/admin/collections/products` (the path is still `products`; the heading is Cookies and menu).
- From the Cookie lineups intro, follow `Cookies and menu`.
- Open any cookie document and read the first tab.

## Driving it with the browser

Preconditions:

- Signed in on the Ready preview dashboard.
- Doctor has passed.
- You are observing unless the owner asked to edit preview prices. Money is stored in cents (`700` = `$7.00`).

- **Daily work entry.** From `/admin`, in `section[aria-labelledby="daily-work-heading"]` click `Cookies and menu` (`Change always-available cookies, prices, and photos.`). Land on `/admin/collections/products` with heading `Cookies and menu`.
- **List intro.** Copy says this is the standing catalog, and that this week's specials are picked on `Cookie lineups`. Collection description says specials live on Cookie lineups.
- **Default columns.** The list shows title, where it lives (`menuPlacement`), price, mini price, categories, and publish status — not a raw CMS dump.
- **Open a cookie.** Click a cookie title in this tab. The first tab label is `On the menu`. Do not pass if the first tab is `Description & Photos`, `Writing`, or `Price & Tray`.
- **On the menu fields.** On that first tab, find `Where does this flavor live right now?` with options `Always available on the menu`, `This week's specials`, and `Catering trays only`. Find `Price` (large / individual price). Find the photo / gallery controls. Placement help text says to use Cookie lineups to set the customer-facing order.
- **Later tabs.** Confirm tabs `Writing`, `Trays`, and `Search listing` exist after `On the menu`. Do not use Writing as the first-tab proof.
- **Cross-link.** Follow the intro link `Cookie lineups` if you need to prove the two doors. Stay in this tab. Heading becomes `Cookie lineups`.
- **Sidebar group.** Cookies and menu sits in `Daily work` with Orders and Cookie lineups.
- **Proof.** Save `artifacts/verify-baked-with-blessings/cookies-and-menu/collection.png` (heading `Cookies and menu`) and `artifacts/verify-baked-with-blessings/cookies-and-menu/on-the-menu-tab.png` (first tab selected, placement + price visible).

## Gotchas

- The collection slug remains `products`. Assert the heading `Cookies and menu`.
- `This week's specials` on a cookie form adds the flavor to the live lineup. Cookie lineups remains the place to order the week. Do not edit placement on preview unless asked.
- Always-available cookies stay on public `/menu` year-round. Specials also appear on `/rotations`. This file does not replace `public-specials-and-menu.md`.
- Price fields show dollars; stored values are cents. Do not type `700` expecting $700.
- Batch builders / trays are not individual flavors. They belong on later tabs and must not be added to a lineup's specials list.
- Do not hide related ecommerce collections. A hidden related collection can blank `/admin` (Payload 3.84). If `/admin` goes black after a config change, that is a login-shell regression — go to `admin-cream-login.md`.
