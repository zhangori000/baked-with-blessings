# Pricing ladder

My intention with this document is to state the pricing rule, so that anyone changing a price in the code or the admin panel can check the new price against it.

The rule is that a bigger order always costs less per cookie, and that no large-cookie price goes below 45% off a single cookie. The test `tests/int/price-ladder.int.spec.ts` checks both conditions against the code's price definitions and fails when either one breaks.

## Why the rule exists

My intention with this section is to record the mistake that the rule prevents.

Until October 2026 the ladder ran backwards. The 3-cookie box cost $4.00 a cookie, while the 18-cookie and 36-cookie catering packages cost $4.17 a cookie, so a family ordering 36 cookies for a party paid more per cookie than someone buying three. The deepest discount sat on the smallest order, which still costs a whole pickup or meetup to hand over.

## The current ladder

My intention with this section is to list every large-cookie price with its per-cookie price and its discount, so that the steps can be compared.

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

Minis are sold only in boxes, so their ladder starts at the Mini Box, which is 6 minis for $10, and continues with catering at 30 for $45, 60 for $85, and 100 for $140. That ladder already gets cheaper at every step, so it is unchanged.

Each order keeps about 44% to 52% of its price before the bakers' time is counted, assuming about $1.38 of ingredients per large cookie plus the box and the card fee. The cost of the deeper discounts is volume: $1,000 of sales takes about 300 cookies at these prices, instead of 200 cookies at $5 each.

## Where the prices are defined

My intention with this section is to say which copy of a price is the live one, because the code and the hosted database each hold a copy.

The live prices are the ones the owner edits in the admin panel under Products, and they are stored in the hosted database. The code holds the prices that a fresh or local database receives, in three files: (a) `src/endpoints/seed/cookie-catalog.ts` holds the single-cookie prices, which `pnpm update:cookie-prices` writes over the database, so these must match the live admin prices; (b) `scripts/lib/mix-box-specs.ts` holds the Build-Your-Own boxes, which `pnpm seed:mix-boxes` writes; and (c) `scripts/lib/catering-package-specs.ts` holds the catering packages, which `pnpm seed:catering-packages` writes.

Merging a price change in these files does not change the live site. The owner changes live prices by editing the products in the admin panel. Running a seed script against a hosted database, such as `vercel env run -e production -- pnpm seed:mix-boxes`, also works, but like every content script it runs only when the owner explicitly asks for it.
