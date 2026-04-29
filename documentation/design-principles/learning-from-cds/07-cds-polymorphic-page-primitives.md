# 07. CDS Polymorphic Page Primitives

This chapter adds one more CDS pattern that is useful for the bakery app-wide migration: reusable page primitives built from a smaller styling vocabulary.

CDS has low-level primitives like `Box`, `HStack`, `VStack`, and `Text`. Those components accept shared style props and can render as different HTML elements with an `as` prop. For example, the same `Text` primitive can render as a `span`, `p`, `h1`, or `h3`, while keeping the same color, font, spacing, and overflow API.

That is called a polymorphic primitive. "Polymorphic" just means one component can take more than one shape.

```tsx
<Text as="h1" font="display1" color="fg">
  Page title
</Text>

<Text as="p" font="body" color="fgMuted" numberOfLines={2}>
  Short page summary
</Text>
```

The point is not that `as` is magic. The point is that the design system keeps styling behavior in one place while still letting the rendered HTML stay semantic.

## The Wrapper Layer

CDS does not stop at `Box` and `Text`. It also creates wrapper components for common interface patterns.

Examples from the CDS codebase:

- `TextDisplay1` is a small wrapper around `Text` that defaults `font="display1"`.
- `SectionHeader` accepts named pieces like `title`, `description`, `start`, and `end`, then lays them out consistently.
- `PageHeader` accepts slots like `start`, `title`, and `end`, then handles the responsive grid behavior internally.
- `CardRoot` chooses whether to render as a layout wrapper or a pressable wrapper based on the requested element.

That teaches an important design-system lesson:

Low-level primitives are useful, but most app code should eventually use semantic wrappers.

## Why This Helps

Without the wrapper layer, every page decides things like:

- how big a page title should be,
- how much spacing belongs above a form,
- how a content panel should be bordered,
- what color a page lead paragraph should use,
- whether an index list should use a paper surface or a transparent section.

That is exactly where styling drift starts.

With semantic page primitives, the app can say:

```tsx
<BakeryPageShell>
  <BakeryPageSurface>
    <BakeryPageEyebrow>Customer account</BakeryPageEyebrow>
    <BakeryPageTitle>Log in</BakeryPageTitle>
    <BakeryPageLead>Access order history and checkout details.</BakeryPageLead>
  </BakeryPageSurface>
</BakeryPageShell>
```

The page code describes intent. The design system decides the actual spacing, font scale, color, radius, and border.

## Human Decisions Still Exist

This does not mean the system magically decides the perfect page style. Humans still define the contract.

For example, the bakery app can decide:

```ts
BakeryPageTitle = large rounded display type
BakeryPageLead = readable muted body copy
BakeryPageSurface = light paper panel with bakery border
```

Then individual pages use those roles instead of writing new Tailwind/CSS combinations every time.

This is the same idea as semantic color tokens:

```ts
theme.footerBg = "#fff8f2"
BakeryPageShell uses footerBg as the app paper background
```

The value is still human-authored, but the usage becomes consistent.

## How This Applies To The Bakery Migration

For the next migration slice, the bakery app should add a small page primitive layer:

- `BakeryPageShell`: outer page or content band.
- `BakeryPageSurface`: reusable panel or centered content surface.
- `BakeryPageHeader`: consistent vertical stack for page intro content.
- `BakeryPageEyebrow`: small uppercase category text.
- `BakeryPageTitle`: semantic title text.
- `BakeryPageLead`: readable supporting copy.
- `BakerySectionHeader`: reusable title/description row for sections.

This does not replace the scenery system. The scenery system remains the expressive hero layer. The page primitive layer handles the quieter content below and around those scenes.

## Practical Rule

Use low-level primitives when building a new primitive. Use semantic wrappers when building a page.

That means app routes should not usually worry about exact values like `font-size: 2.2rem`, `padding: 3rem`, or `border: rgba(...)`. They should mostly choose page roles like `title`, `lead`, `surface`, `section`, and `paper`.

## Follow-Up Pattern: Card And Action Roots

CDS also has a `CardRoot` idea: the card can render as a plain layout wrapper, a link, or a pressable button depending on what the caller needs.

That matters because cards often drift too:

```tsx
<div className="rounded-lg border bg-white p-4 shadow-sm" />
<article className="rounded-[8px] border bg-[#fffdf6] p-5" />
<button className="rounded-xl border bg-white px-4 py-3" />
```

Those all mean roughly "content surface." The design system should give that idea one name.

The bakery migration now has:

```tsx
<BakeryCard tone="paper" spacing="md">
  Regular content card
</BakeryCard>

<BakeryCard as={Link} href="/blog/story" interactive tone="transparent">
  Clickable row
</BakeryCard>

<BakeryAction variant="primary" size="md">
  Submit review
</BakeryAction>
```

This is the same lesson as page primitives, just one level smaller:

- `BakeryPageSurface` is for major page sections.
- `BakeryCard` is for repeated panels, rows, review cards, and order cards.
- `BakeryAction` is for pill-like actions that need consistent radius, font, disabled state, and hover behavior.

The caller still chooses intent. The design system owns the boring geometry.
