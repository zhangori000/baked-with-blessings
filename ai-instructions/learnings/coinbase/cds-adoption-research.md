# Coinbase CDS Adoption Research

Date: 2026-04-10

Note: this assumes you meant Coinbase **CDS** (Design System), not CDN.

## Why I researched this

You want to know whether to:

1. install the published CDS packages into your app with `pnpm`, or
2. copy the implementation ideas or source code into your own codebase.

This note is written specifically for your current site at `learning-payload-cms/baked-with-blessings`.

## Existing notes already in this repo

- Storybook sidebar inventory: `ai-instructions/learnings/coinbase/storybook-sidebar-tabs.md`
- Related app note: `ai-instructions/learnings/2026-04-10/before-dashboard-and-auth.md`

That earlier note already captured one important conclusion: the admin work used a CDS-inspired local implementation, not the `@coinbase/cds-web` package directly.

## Primary sources used

Local Coinbase CDS repo:

- `Learning/cds/README.md`
- `Learning/cds/templates/next-app/README.md`
- `Learning/cds/templates/next-app/src/app/layout.tsx`
- `Learning/cds/templates/next-app/src/app/page.tsx`
- `Learning/cds/packages/web/package.json`
- `Learning/cds/packages/icons/package.json`
- `Learning/cds/packages/icons/README.md`
- `Learning/cds/packages/web/src/navigation/Sidebar.tsx`
- `Learning/cds/packages/web/src/navigation/SidebarItem.tsx`
- `Learning/cds/packages/web/src/tabs/Tabs.tsx`
- `Learning/cds/packages/web/src/tabs/SegmentedTabs.tsx`
- `Learning/cds/apps/docs/docs/getting-started/installation/_webContent.mdx`
- `Learning/cds/apps/docs/docs/getting-started/styling/_webContent.mdx`
- `Learning/cds/apps/docs/docs/getting-started/theming/_webContent.mdx`
- `Learning/cds/apps/docs/docs/getting-started/templates/_webContent.mdx`
- `Learning/cds/apps/docs/docs/getting-started/ai-overview.mdx`
- `Learning/cds/apps/docs/docs/components/navigation/Sidebar/webMetadata.json`
- `Learning/cds/apps/docs/docs/components/navigation/Tabs/webMetadata.json`
- `Learning/cds/apps/docs/docs/components/navigation/SegmentedTabs/webMetadata.json`
- `Learning/cds/LICENSE`

Official docs site:

- [CDS installation docs](https://cds.coinbase.com/getting-started/installation/)
- [CDS docs index for LLMs](https://cds.coinbase.com/llms/web/routes.txt)
- [Sidebar docs](https://cds.coinbase.com/components/navigation/Sidebar/)
- [Tabs docs](https://cds.coinbase.com/components/navigation/Tabs/)

Your current app:

- `baked-with-blessings/package.json`
- `baked-with-blessings/.npmrc`

## What Coinbase CDS actually gives you

CDS is a React and React Native design system with:

- cross-platform components
- a token-driven theme system
- a `ThemeProvider`
- responsive style props on web
- component docs with examples, props, styles, source links, and Storybook links

For web, the official getting-started docs say you need:

- `@coinbase/cds-web`
- `framer-motion@^10`
- global icon and CDS CSS imports
- `ThemeProvider`
- `MediaQueryProvider`

Their Next template shows the expected root setup:

- import `@coinbase/cds-icons/fonts/web/icon-font.css`
- import `@coinbase/cds-web/globalStyles`
- import `@coinbase/cds-web/defaultFontStyles`
- wrap the app with `ThemeProvider`
- usually also wrap with `MediaQueryProvider`

## CDS docs and example surface area

One reason CDS is worth studying even if you never install it is that the docs surface is unusually rich.

There are multiple ways to learn or reuse patterns:

- official docs site: [cds.coinbase.com](https://cds.coinbase.com)
- component docs with `Examples`, `Props`, `Styles`, Storybook links, and source links
- starter templates in the repo:
  - `templates/next-app`
  - `templates/vite-app`
  - `templates/webpack-app`
  - `templates/expo-app`
- live docs playground: [Playground](https://cds.coinbase.com/getting-started/playground/)
- LLM-friendly routes index: [web/routes.txt](https://cds.coinbase.com/llms/web/routes.txt)
- docs UI support for `Copy for LLM` and markdown-oriented page export

This matters because it means CDS is valuable even as a research corpus:

- easier to inspect than many design systems
- easier to feed into AI workflows
- easier to reconstruct locally without importing the whole library

## Important constraint for your current app

Your current site uses:

- `next` `16.2.1`
- `react` `19.2.4`
- `react-dom` `19.2.4`

The local CDS repo currently declares these web peer dependencies:

- `react: ^18.3.1`
- `react-dom: ^18.3.1`
- `framer-motion: ^10.18.0`

That means:

- CDS web is not currently declaring official React 19 support in the checked source
- installing it into this app is possible in a package-manager sense, but not officially aligned in peer dependency terms

Your `.npmrc` includes `legacy-peer-deps=true`, so `pnpm` may let you install it anyway. That reduces install friction, but it does **not** change the compatibility risk.

## Option A: install the published CDS package

### Official install path

The official docs show:

```bash
npm install @coinbase/cds-web framer-motion@^10
```

or:

```bash
yarn add @coinbase/cds-web framer-motion@^10
```

The docs do not show a `pnpm` command, but because this is a normal npm-published package, the direct equivalent is:

```bash
pnpm add @coinbase/cds-web framer-motion@^10
```

That `pnpm` command is an inference from the published package setup, not a command explicitly shown in the docs.

### Pros

- fastest way to get real CDS behavior
- easiest way to stay close to Coinbase APIs and examples
- docs, Storybook, and source links map directly to installed components
- best if you want many components, not just one or two

### Cons

- current React 18 peer dependency mismatch with your React 19 app
- CDS expects its own provider and global styles setup
- adopting it deeply may fight parts of your existing Tailwind and Payload setup
- some components also depend on `framer-motion`

### Verdict for your app

This is the highest-risk path for `baked-with-blessings` right now.

If you want to try the real package, do it in:

- a small isolated prototype
- a throwaway branch
- or a separate sandbox app based on the CDS Next template

I would not make this the default strategy for your production app until React support lines up better.

## Deep dive: RollingNumber

`RollingNumber` is one of the most interesting CDS components for your site because it is both:

- visually distinctive
- useful for real commerce and comparison UI

Official references:

- [RollingNumber docs](https://cds.coinbase.com/components/numbers/RollingNumber/)
- Storybook listed in metadata: `components-rollingnumber--examples`
- source path in repo: `packages/web/src/numbers/RollingNumber/RollingNumber.tsx`

### What it supports

From the docs and source, `RollingNumber` supports:

- animated per-digit roll transitions
- currency, percent, compact notation, grouping, and other `Intl.NumberFormat` options
- `prefix` and `suffix` as text or React nodes
- `colorPulseOnUpdate`
- configurable positive and negative pulse colors
- two digit transition styles:
  - `every`
  - `single`
- `formattedValue` override when you want custom visible text but still want animation driven by numeric `value`
- `ariaLive` control for screen-reader behavior
- swappable internal subcomponents for advanced customization

### Good use cases for your site

This is more than a crypto widget. It can fit your site in several ways:

- live cart subtotal updates
- product comparison deltas
  - `$1.25 less than Starbucks`
  - `2x the chocolate chips`
- countdowns for limited bakes or pickup windows
- "cookies sold this week" or "fresh from oven in X min"
- mini social proof counters
- catering quantity builders
- order minimum / progress UI

### The component is powerful, but not cheap

This is not a light presentational component.

The source pulls in:

- `framer-motion`
- `@coinbase/cds-common` number formatting helpers
- locale helpers
- motion tokens
- several internal subcomponents

It is also highly composable, with replaceable internals:

- `RollingNumberMaskComponent`
- `RollingNumberAffixSectionComponent`
- `RollingNumberValueSectionComponent`
- `RollingNumberDigitComponent`
- `RollingNumberSymbolComponent`

That is excellent if you adopt CDS fully, but it also means this is not an ideal copy-paste target if you only want the visual effect.

### Best path for RollingNumber in your app

For `baked-with-blessings`, the most practical path is:

1. Use the CDS docs and examples as behavioral reference.
2. Recreate a smaller local version.
3. Start with only the features you actually need.

For example, your local first version probably only needs:

- numeric `value`
- optional `format`
- optional `prefix` / `suffix`
- simple digit roll animation
- optional positive/negative color flash
- `ariaLive="off"` for rapidly changing counters

You likely do **not** need in v1:

- swappable internal subcomponents
- full CDS text prop forwarding
- all selector/className override surfaces
- both digit transition variants

### Practical recommendation

If you want this effect on your site, I would build a local `RollingNumber` inspired by CDS, not import their full component into this app.

That gives you:

- the distinctive motion
- a smaller dependency surface
- no React 18 peer mismatch
- control over typography and visual style

## Components most worth borrowing from CDS

For your site, the highest-value CDS references are:

- `RollingNumber`
  - for price/comparison motion
- `Sidebar` and `SidebarItem`
  - for clean admin-style navigation or filter rails
- `Tabs` / `SegmentedTabs`
  - for menu category switching and compare modes
- `ProgressBar` / `ProgressCircle`
  - for order progress, fundraising, stock, or sellout signals
- `PageHeader`, `NavigationBar`, `SectionHeader`
  - for structured page framing

## Best learning workflow going forward

If you want to keep researching CDS effectively, this is the order I would use:

1. docs page
2. styles tab
3. example code
4. Storybook
5. source
6. template usage

For AI-assisted research specifically:

1. use the docs page
2. use the `Copy for LLM` or markdown export
3. use [web/routes.txt](https://cds.coinbase.com/llms/web/routes.txt)
4. only then dig into raw source

## Option B: copy docs examples and recreate locally

This is the strongest fit for your current app.

Why:

- you already have a local CDS-inspired direction
- the docs site is unusually implementation-friendly
- each component page gives you imports, examples, props, styles, Storybook, and source links
- Coinbase also exposes an LLM-friendly routes index at [cds.coinbase.com/llms/web/routes.txt](https://cds.coinbase.com/llms/web/routes.txt)

This is the path I recommend for:

- Sidebar
- SidebarItem
- Tabs
- SegmentedTabs
- NavigationBar
- PageHeader-like patterns

Use the docs and template code for:

- component shape
- spacing rhythm
- token naming ideas
- state behavior
- accessibility behavior
- responsive structure

Then implement the actual UI with your own local components, Tailwind classes, and the libraries you already trust in this repo.

## Option C: copy Coinbase source code directly

Legally, the repo is open under Apache 2.0, so source reuse is possible.

Practically, direct copy/paste is often **not** drop-in.

Examples from the actual source:

- `Sidebar.tsx` depends on internal layout primitives, shared breakpoints, a custom `useDimensions` hook, `@linaria/core`, and `@coinbase/cds-common`
- `SidebarItem.tsx` depends on CDS `Pressable`, `Icon`, `Text`, tooltip primitives, theme types, and sidebar context
- `Tabs.tsx` depends on `@coinbase/cds-common` tab state, shared hooks, `react-use-measure`, and `framer-motion`
- `SegmentedTabs.tsx` is simpler, but it still sits on top of the lower-level CDS Tabs machinery

So the real answer is:

- copying **ideas and patterns** is easy
- copying **example snippets** is moderate
- copying **full source files** is expensive unless you are ready to port internal dependencies too

## Best practical rule

Use these rules:

### Safe to copy or recreate locally

- visual structure
- layout patterns
- prop names you like
- state machines
- accessibility behavior
- example JSX
- style direction from docs examples

### Risky to transplant directly

- low-level primitives
- provider internals
- theme system internals
- anything depending on `@coinbase/cds-common`
- anything depending on compiled CDS style infrastructure
- animated tab internals built on `framer-motion`

## Recommended strategy for baked-with-blessings

For this specific app, the best approach is:

1. Keep using CDS as a reference system, not as a hard dependency.
2. Recreate the pieces you need locally in your own component layer.
3. Start from docs examples and template snippets before looking at raw source.
4. Only open raw source when you need behavior details.
5. Prefer `SegmentedTabs` docs and examples over low-level `Tabs` unless you actually need custom tab machinery.

## Suggested workflow

### For a component you want to mimic

1. Open the component doc page.
2. Read `Examples`, `Props`, and `Styles`.
3. Use the `Source` link only if the docs example is not enough.
4. Rebuild the component locally with your existing stack.
5. Keep the CDS API shape only when it helps your own code stay clear.

### For broader Coinbase styling

Use these docs first:

- [Introduction](https://cds.coinbase.com/getting-started/introduction/)
- [Installation](https://cds.coinbase.com/getting-started/installation/)
- [Styling](https://cds.coinbase.com/getting-started/styling/)
- [Theming](https://cds.coinbase.com/getting-started/theming/)
- [Templates](https://cds.coinbase.com/getting-started/templates/)
- [AI Overview](https://cds.coinbase.com/getting-started/ai-overview/)

Then use the LLM docs index:

- [Web routes index](https://cds.coinbase.com/llms/web/routes.txt)

## Bottom-line recommendation

For your current site:

- do **not** make `@coinbase/cds-web` the default plan yet
- do **use** CDS docs and template code aggressively as reference
- do **recreate** Coinbase-like components locally
- do **copy** small snippets and ideas
- do **not** expect raw CDS source files to paste cleanly into this app

If later you want a closer CDS integration, the safest next step is a small separate sandbox that tests:

- `pnpm add @coinbase/cds-web framer-motion@^10`
- root provider setup
- React 19 behavior
- one navigation component and one tab component
- one local imitation of `RollingNumber` compared against the CDS docs behavior

## High-value URLs

- [CDS docs home](https://cds.coinbase.com)
- [Installation](https://cds.coinbase.com/getting-started/installation/)
- [Styling](https://cds.coinbase.com/getting-started/styling/)
- [Theming](https://cds.coinbase.com/getting-started/theming/)
- [Templates](https://cds.coinbase.com/getting-started/templates/)
- [AI Overview](https://cds.coinbase.com/getting-started/ai-overview/)
- [Web routes index](https://cds.coinbase.com/llms/web/routes.txt)
- [Sidebar docs](https://cds.coinbase.com/components/navigation/Sidebar/)
- [Tabs docs](https://cds.coinbase.com/components/navigation/Tabs/)
- [Coinbase CDS GitHub repo](https://github.com/coinbase/cds)
