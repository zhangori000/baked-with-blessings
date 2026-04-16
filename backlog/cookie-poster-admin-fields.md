# Cookie Poster Admin Fields

## Goal

Move the remaining hardcoded sheep-card / poster metadata out of `src/app/(app)/shop/cookiePosterData.ts` and into Payload so a business administrator can manage it in `/admin`.

## Why this is still hardcoded today

The storefront now pulls the real cookie image, price, title, and product linkage from Payload `products` + `media`.

What is still hardcoded is the poster-specific presentation layer, such as:

- subtitle
- chips
- label text
- label color
- fallback body SVG path

This is currently design-owned metadata in code.

## What "chips" means

Chips are the small rounded label pills shown on each sheep card, for example:

- `BROWN BUTTER`
- `FUDGY`
- `CHOCOLATE`

They are short visual descriptors, not product variants.

## Desired admin experience

The business owner should be able to edit poster metadata in clear business language, without needing to understand implementation details like `slug`.

Good field labels and descriptions matter here. Example admin wording:

- `Poster Subtitle`
  Short line under the cookie title on the sheep card.
- `Poster Tags`
  Short all-caps pills shown on the sheep card, such as `BROWN BUTTER` or `CHEWY`.
- `Poster Label`
  Small highlighted label shown above the title on the poster page.
- `Poster Label Color`
  Background color for the highlighted label.
- `Poster Summary`
  Short marketing description used on the poster page and sheep card.

## Slug handling

The business owner should not need to think about slugs more than necessary.

Preferred approach:

- keep using the existing auto-generated product slug behavior
- use the product slug as the internal key for poster metadata
- do not expose "use this exact slug to make the sheep card work" as an admin responsibility

## Likely implementation shape

Best candidate is adding a grouped set of poster fields onto `Products`, rather than making a separate collection.

Example concept:

- `poster.subtitle`
- `poster.chips`
- `poster.label`
- `poster.labelTone`
- `poster.summary`

Potentially keep some things code-owned even after this:

- decorative `/public` assets like `singular-sheep-head.svg`
- grassland background art
- cloud art

That split is healthy:

- business-owned content in Payload
- developer-owned decorative art in `/public`

## Nice-to-have admin descriptions

When this is implemented, each field should explain where it appears:

- sheep card
- cookie poster detail page
- menu section only

That will reduce confusion for non-technical admins.

