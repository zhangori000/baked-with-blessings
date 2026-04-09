# Cafe Project — Competitor Comparison Feature

Notes from a planning conversation. Hypothetical project: a cafe website built on
Payload + Next.js (using the ecommerce template as a starting point) where each
menu item shows how it compares to competitors (Starbucks, Blue Bottle, etc.).

This file is a future-me reference, not a spec.

---

## The Feature in Plain Words

1. On every product card, show a small badge: "10% cheaper than Starbucks" or
   "uses organic milk."
2. Click the badge → open a detailed comparison view (modal or dedicated page)
   with a richer breakdown: price, ingredients, sourcing, etc.
3. Inside the comparison view, also show "if you like X drink from Starbucks,
   you'd probably like our Y" — i.e., recommendations.

---

## Backend Modeling — Two Options

### Option A: Embed comparisons on the Product (start here)

Add an `array` field directly to the Products collection:

```ts
{
  name: 'comparisons',
  type: 'array',
  fields: [
    { name: 'competitor', type: 'text' },        // "Starbucks"
    { name: 'theirPrice', type: 'number' },
    { name: 'ourPrice', type: 'number' },
    { name: 'highlight', type: 'text' },         // "10% cheaper"
    {
      name: 'reasons',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },         // "Organic milk"
        { name: 'icon', type: 'select', options: ['leaf', 'heart', 'dollar'] },
      ],
    },
  ],
}
```

**Pros:** zero extra collections, edits live where the product lives, perfect
for a small menu.

**Cons:** if "Starbucks" needs a logo and brand color shared across 30 products,
you'll be duplicating it.

### Option B: Separate `competitors` and `comparisons` collections

```
collections/
├── Products
├── Competitors          ← Starbucks, Blue Bottle, Philz (logo, brand color, url)
└── Comparisons          ← links a Product → a Competitor + details
```

**When to switch:** the moment you find yourself copy-pasting the same
competitor name/logo into multiple products. Migrating from A to B is a one-time
script, not a rewrite — Payload's schema-first approach makes this cheap.

---

## Frontend Pieces

The ecommerce template already has every primitive you need.

| Piece | Where it lives in the template |
|---|---|
| Card on product grid | `components/ProductGridItem/` |
| Badge to add to the card | (new) `components/ComparisonBadge/` |
| Modal for detail view | `components/ui/dialog.tsx` (shadcn Dialog) |
| Or dedicated route | `app/(app)/products/[slug]/compare/page.tsx` |
| Server-side data fetch | `payload.findByID({ collection: 'products', depth: 2 })` |

The badge reads `product.comparisons[0].highlight`. The modal/page renders the
full array with reasons + (later) recommendations.

---

## Tracking Competitor Data — Future Roadmap

**Phase 1 — now: manual entry.** Cafe owner types it into the admin panel
quarterly. Competitor prices don't move often. Engineering cost of automation
is not justified yet.

**Phase 2 — when manual gets painful:** scheduled scraping.

### Why APIs aren't the answer

- Starbucks has no public price/menu API.
- Almost no cafe chain does — APIs exist when there's a business reason
  (affiliate programs, ordering integrations like DoorDash/Toast/Square,
  grocery like Kroger/Walmart). Pricing intelligence is not one of them.
- **Worth checking first:** if a competitor uses Square / Toast / Clover POS,
  there's sometimes an unauthenticated public menu URL. Free win if it exists.

### Web scraping options

Tiered from DIY to managed:

| Tool | What it is | When to use |
|---|---|---|
| **Scrapy** (Python) | Mature scraper framework. Queues, retries, pipelines, robots.txt. | Static HTML, large crawls |
| **Playwright / Puppeteer** | Headless real browsers. Slower, renders JS. | SPAs (most modern menus) |
| **Crawlee** (Node, by Apify) | Wraps Playwright + Cheerio with queues, proxies, fingerprinting. | Modern DIY sweet spot |
| **Colly** (Go) | Fast, low-resource, static-page focused. | Speed, no browser needed |
| **Apify / Bright Data / ScraperAPI / ScrapingBee** | SaaS — point at URL, get parsed data, they handle proxies/CAPTCHAs. | When you don't want to maintain infra |

**Recommendation for this project:** **Apify** with a scheduled actor.
~$50/month, no infrastructure, runs weekly, posts results to a Payload
endpoint that updates the `comparisons` (or `Comparisons` collection in
Option B). Way less effort than self-hosting Crawlee on a cron.

### Legal / ethical guardrails (don't skip)

- Read `robots.txt` — not legally binding but signals intent.
- Read the site's ToS — many forbid scraping. *hiQ v. LinkedIn* made the law
  messier, not cleaner. CFAA exposure is real if you ignore explicit prohibition.
- Rate limit: ~1 req/sec, identify your user-agent, scrape off-hours.
- Cache aggressively — prices change weekly at most.
- Public, unauthenticated data is the safest target.

---

## Recommendations: "If You Like X, You'd Also Like Y"

Three tiers, ordered by complexity. Pick the lowest one that solves the problem.

### Tier 1 — Manual curation (start here)

The ecommerce template **already ships with this**. The Products collection has
a `relatedProducts` field with `filterOptions: { id: { not_in: [id] } }`. The
cafe owner picks 3–4 "similar" items per product in the admin panel.

For a cafe with under 100 items, this is the right answer. Stop here unless
something forces you onward.

### Tier 2 — Rule-based (one query)

When manual gets tedious, fall back to a Payload `find`:

```ts
const similar = await payload.find({
  collection: 'products',
  where: {
    category: { equals: product.category },
    price: {
      greater_than: product.price * 0.8,
      less_than: product.price * 1.2,
    },
    id: { not_equals: product.id },
  },
  limit: 4,
})
```

"Same category, ±20% price, not myself." Use it on the product page when the
manual `relatedProducts` array is empty.

### Tier 3 — Collaborative filtering (overkill until proven)

"People who bought X also bought Y" — requires real purchase history at scale.

- **Managed:** Recombee, Algolia Recommend, AWS Personalize.
- **DIY:** Python's `surprise` or `implicit` library for matrix factorization.
- **Threshold:** don't bother under ~10k orders. Below that, rule-based
  recommendations beat noisy ML.

---

## Why Payload Makes This Easy

Three properties that matter for this kind of feature:

1. **Schema-first.** Define a field in TypeScript → admin UI, REST endpoints,
   and TypeScript types are all generated. No SQL migrations to hand-write,
   no admin form to build.

2. **Arbitrary nesting.** `array` inside `array` inside `array` works. The
   "comparison has reasons, each reason has an icon" structure is one config
   object.

3. **You own the frontend.** Payload doesn't dictate any UI. The badge, the
   modal, the comparison page — all just React you write however you want,
   fed by `payload.find()` (server) or `fetch('/api/products')` (client).

The one-line summary: **add a field → admin UI appears → fetch from frontend
→ render however you want.** That's the entire dev loop for this feature.

---

## Decision Log

| Question | Answer (for this project, today) |
|---|---|
| Embed comparisons on Product or separate collection? | **Embed** (Option A) until duplication hurts |
| How to track competitor data? | **Manual** now, **Apify scheduled actor** when manual gets painful |
| How to do recommendations? | **Manual `relatedProducts`** (already in template), rule-based fallback |
| Modal or dedicated comparison page? | TBD — start with **modal**, promote to page if content gets rich |
| When to revisit? | When the menu exceeds ~30 items or competitor data feels stale |
