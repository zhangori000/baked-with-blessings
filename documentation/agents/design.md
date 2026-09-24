# Storefront design for bakery agents

How to design UI in this repo. Pair with `documentation/agents/anti-ai.md`. Standing ops stay in `Claude.md`.

## Product

Baked with Blessings is a sister-owned cookie shop. The public site is a meadow the cookie walks on. Cart money is cents. The admin user is a non-technical owner. Do not add knobs she does not need.

Live site: https://bakedwithblessings.com. Local storefront is often `http://127.0.0.1:3001` because port 3000 is taken.

## Tokens, not new palettes

Build with `src/design-system/bakery` and the CSS variables it already publishes (`--bakery-color-*`, `--bakery-radius-*`, `--bakery-shadow-*`, `--scene-*`, `--font-rounded-display`, `--font-rounded-body`).

Do not introduce a one-off hex or a new font because a screenshot used it. Map the reference onto an existing token. The black cookie-name pill is the cart action. Cream fills are paper. Cocoa is ink. Scenery yellow is a meadow control, not a checkout button.

Ink is warm: cocoa `#2f2414`, near-black `#171510`, muted `rgba(23, 21, 16, 0.64)`, and gold-brown `#7d5512` for links and tags. No blue or navy text, borders, or tag fills; blue belongs to the sky art only.

The storefront is light-only. It does not follow the OS dark setting or the admin's `payload-theme` key, because the pages are built on cream surfaces. Moonlit is a scenery tone, not a dark mode.

The site has multiple scenery tones (dawn, blossom, night, and the rest in `menuHeroScenery`). New chrome must survive a scenery change. Prefer `var(--scene-panel-fill)` and `var(--scene-text)` over a color that only works on dawn.

## Research order

1. Write a one-sentence job. Example: “Show this cookie’s ingredients without covering the cookie, and let a tap on the cookie start add-to-cart.”
2. Refero **styles** for taste. Query the job, not bakery, not forest green, not cream.
3. Refero **screens** for web chrome. Cite `https://refero.design/pages/{uuid}` and the live page.
4. Mobbin **screens** for iOS sheets and product detail. Cite the `mobbin_url`.
5. Lock one primary reference. Borrow one or two details. Stop.

Styles answer how it should feel. Screens answer what is on the glass. Flows answer the steps before and after. Do not search styles with a component name, and do not search screens with a palette.

Orien wants clickable links in the research you show him. Keep queries broad. Over-specified color words hide better examples.

## Two libraries, two jobs

Mobbin is the bigger app-screen library. Use it for sheets, sticky add-to-cart, ingredient lists, HUD-like inboxes.

Refero is tighter web taste plus a design skill. Use it for paper, type, close-X modals, and “does this look generated.”

When Orien asks for two prototypes, keep them separate. Do not mash a 7-Eleven sheet and a Symbolic.ai letter into one card with both a grab handle and a handwriting flourish. Ship a Mobbin skin and a Refero skin, switchable, both viewports.

Local prototype switchers in this repo use `localStorage` keys prefixed `bwb-proto-`. The info-card switcher is `bwb-proto-info-card` with values `mobbin` and `refero`.

## Storefront map

Weekly specials live on `/` and `/rotations`. The cookie carousel is `src/app/(app)/HomeCookieCarousel.client.tsx`.

The cookie image and the black name pill both start the same add-to-cart prompt (`handleOpenCartPrompt`). People did not know the name pill was cart. Do not hide cart behind a third mystery control.

Info is not cart. Info is ingredients and allergens. The Info control sits above the black name dock so it is not a sticker on the cookie.

Announcements are a cream mail inbox in the header, not a magazine popup and not a dimmed modal. Do not copy that inbox onto the cookie info card. They are different jobs.

## Layout rules that already bit us

`.home-page-placeholder` collapses header height. Overlays inside the header get clipped. Portal to `document.body` when a sheet must cover the viewport.

`.homeCookieShowcase` is translated and `overflow: hidden`. `position: fixed` inside it is not viewport-fixed. Portal bottom sheets.

Jumping cookies use `pointer-events: none` on the rig shell so scenery stays tappable. A cookie hit target must set `pointer-events: auto` on the control itself.

Verify clicks in a real browser on the host Orien has open (`127.0.0.1` vs `localhost`). `allowedDevOrigins` must include both. A screenshot of SSR HTML is not verification.

## What “done” means for UI

You clicked the control.

The panel’s computed height is greater than 0 and opacity is greater than 0.

The words you promised are in the DOM.

You tried mobile width and desktop width.

You tried the other scenery tones if the chrome sits on the meadow.

You did not leave a prototype-only color that fails at night.
