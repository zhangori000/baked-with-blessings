# Anti-AI UI for bakery agents

This file is the house rule for “does this look like a model drew it.” It is adapted from Refero’s anti-slop craft, then locked to Baked with Blessings. Read `documentation/agents/design.md` before you draw or restyle a storefront surface.

Refero styles are the taste source. Do not invent a look from memory. Search styles first, then lock one primary direction. Screens and Mobbin come after, for the job on the page.

## What this bakery already is

The storefront is a painted meadow with a cookie that behaves like a character, a black name pill that starts cart, and cream paper for notes. That cream is scenery and stationery. It is not the generic “calm editorial SaaS” template. Do not flatten the meadow into a white marketing page to look “cleaner.” Do not add a second cream system on top of the one in `src/design-system/bakery`.

## Do not ship these tells

Never use indigo or violet (`#6366f1`, `#8b5cf6`, `#7c3aed`) unless the owner’s brand file names that color. Refero’s Gumroad style keeps pitch black for primary actions and parks hot pink on stickers only. Borrow that rule: the black cookie-name pill is the cart action. Do not recast it as a purple gradient button.

Do not wrap every group in a rounded card with a drop shadow. A card is allowed when the person must treat that box as one object they open, drag, or confirm. The info sheet, the cart prompt, and the announcements inbox are cards. A scenery pill row is not.

Do not default to dark mode. This product is daylight meadow unless the scenery tone is already night.

Do not reach for the autopilot “literary” kit: oversized serif headline, one italic word in a different face, olive/clay accents, ivory canvas. Refero flags that as a current model default. This bakery may use cream paper because the product is a family cookie shop with handwritten notes. You still have to say why the paper is a letter or a receipt, not why it felt tasteful.

Do not use emoji as icons. Use the existing header glyphs or a Lucide mark that already lives next to them.

Do not add a colored left stripe on a card unless that stripe means pin, status, or selection.

Do not average references. If one Refero style is Gumroad (black, white, pink coins), one is Symbolic.ai (parchment sheets), and one is Honk (electric blue), the answer is not a polite cream card with a muted gold button. Pick one primary. Borrow at most two details. Keep each token in its job.

Do not steal a color’s job. Gumroad’s creator pink is illustration, not a CTA. Symbolic.ai’s ink black is type and filled actions, not a section wash. Bakery cream is paper and meadow light, not a dim overlay.

Do not replace the cookie photograph, the sheep parts, or the meadow painting with CSS blobs. If you cannot ship the real asset, keep the slot and the aspect ratio.

Do not put a speech-bubble tail on every new panel. The old cookie info card used a tail because it floated over the cookie. New chrome should earn a tail or go without one.

## What to do instead

Search Refero styles with the job, not the current hex. Bad: “forest green cream bakery meadow card.” Good: “product info overlay close button” or “paper note on a light canvas.”

Name the primary style and the three traits that must survive. Example lock used for the Refero info-card prototype: Symbolic.ai parchment sheets plus Alison Roman’s ink-on-cream letter plus IKEA’s quiet X close. Example lock used for the Mobbin info-card prototype: 7-Eleven ingredients sheet plus Starbucks product sheet plus a black sticky Add to cart.

Keep one memorable move. For this shop that move is the cookie in the meadow, not a new decorative headline.

Edit words down. If deleting a sentence does not hide an allergen or a price, delete it.

## Screenshot test

Sit the frame next to a real product. If it could be any AI landing page after you hide the bakery wordmark, it failed. If it still reads as this meadow and this cookie, it passed.

## Checklist before you hand UI to Orien

Accent is not indigo.

Cards exist only where the person interacts with the container.

No decorative side stripe.

No emoji icons.

Light meadow, unless scenery is already night.

Cream paper has a job (letter, receipt, inbox row), not a vibe.

You can name the Refero style or Mobbin screen that justified the shape.

Token roles match `src/design-system/bakery` and the lock above.

The cookie photo and meadow are still the image, not a fake illustration.

You did not average three strong references into one safe middle.
