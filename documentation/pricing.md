# Pricing ladder

My intention with this document is to state the pricing rule, so that anyone changing a price in the code or the admin panel can check the new price against it.

The rule is that a bigger order always costs less per cookie, and that no large-cookie price goes below 45% off a single cookie. The test `tests/int/price-ladder.int.spec.ts` checks both conditions against the code's price definitions and fails when either one breaks.

## Why the rule exists

My intention with this section is to record the mistake that the rule prevents.

Before this change the ladder ran backwards, and the live prices keep running backwards until the owner applies the new ones in the admin panel. The 3-cookie box cost $4.00 a cookie, while the 18-cookie and 36-cookie catering packages cost $4.17 a cookie and the 60-cookie package tied the box at $4.00, so a family ordering 36 cookies for a party paid more per cookie than someone buying three. The deepest discount sat on the smallest order, which still costs a whole pickup or meetup to hand over.

## The ladder in the code

My intention with this section is to list every large-cookie price the code defines, with its per-cookie price and its discount, so that the steps can be compared.

As of Oct 16, 2026, the live admin prices are still the old ones: Cookie Box 3 for $12, and catering 18 for $75, 36 for $150, and 60 for $240, with no Half-Dozen or Dozen. The prices below take effect on the live site only when the owner applies them.

```text
order                            price    per cookie   off a $5 single
single large cookie              $5.00    $5.00         0%
Build-Your-Own Cookie Box (3)    $11      $3.67        27%
Build-Your-Own Half-Dozen (6)    $21      $3.50        30%
Build-Your-Own Dozen (12)        $39      $3.25        35%
catering, 18 cookies             $56      $3.11        38%
catering, 36 cookies             $104     $2.89        42%
catering, 60 cookies             $165     $2.75        45%
```

Minis are sold only in boxes, so their ladder starts at the Mini Box, which is 6 minis for $10, and continues with catering at 30 for $45, 60 for $85, and 100 for $140. That ladder already gets cheaper at every step, so it is unchanged. Single minis are stored at $3.00, except Dirty Chai at $2.50.

Each bundle keeps about 44% to 53% of its price before the bakers' time is counted. That estimate assumes about $1.38 of ingredients per large cookie, a box or tray costing from about $0.50 to $4.50 depending on size, and Stripe's card fee of 2.9% plus 30 cents. The cost of the deeper discounts is volume: $1,000 of sales takes about 300 cookies at these prices, instead of 200 cookies at $5 each.

## Where the prices are defined

My intention with this section is to say which copy of a price is the live one, because the code and the hosted database each hold a copy.

The live prices are the ones the owner edits in the admin panel under Products, and they are stored in the hosted database. The code holds the prices that a fresh or local database receives, in four files: (a) `src/endpoints/seed/cookie-catalog.ts` holds the single-cookie prices, which `pnpm update:cookie-prices` writes over the database and which `scripts/update-flavor-lineup.ts` reads, so these must match the live admin prices; (b) `scripts/lib/mix-box-specs.ts` holds the Build-Your-Own boxes, which `pnpm seed:mix-boxes` writes; (c) `scripts/lib/catering-package-specs.ts` holds the catering packages, which `pnpm seed:catering-packages` writes; and (d) `src/endpoints/seed/catering-catalog.ts` holds the retired one-flavor trays (10 for $50 and 10 minis for $20), which `pnpm seed` creates and `pnpm seed:mix-boxes` moves to draft, so they sit outside the ladder.

## How to put new prices on the live site

My intention with this section is to say which way of changing live prices changes only the prices, because the seed scripts change much more.

Merging a price change in these files does not change the live site. To change only the prices, the owner edits the Price field of each product in the admin panel, and the box prices and the catering prices should change in the same sitting, so that the live ladder never runs backwards in between.

The seed scripts are not a price-only change. `pnpm seed:mix-boxes` rewrites each box's title, menu text, portion label, category, flavor list, and publish status, and it creates and publishes any box that is missing, such as the Half-Dozen and the Dozen, with no photo or summary until someone adds them in the admin panel. `pnpm seed:catering-packages` likewise rewrites each package's title, menu text, description, category, flavor list, and publish status. Running either against a hosted database, such as `vercel env run -e production -- pnpm seed:mix-boxes`, therefore resets any copy the owner edited, and like every content script it runs only when the owner explicitly asks for it.
