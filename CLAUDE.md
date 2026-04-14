# CLAUDE.md

Instructions for Claude Code when working on Payload CMS projects.

---

## Primary Source of Truth

Also scan these paths in addition to the primary source when they are relevant:

- `./backlog` (recursive)
- `./ai-instructions` (recursive, including subfolders)
- `./ai-instructions/design-stuff` for design research, screenshots, and the `thoughts.md` files inside each website-analysis folder
- `./ai-instructions/ideas-and-backlog/plan.md` before implementing seed data, catalog structure, menu UX, or storefront product presentation

Use them as supplemental implementation and process guidance, then reconcile with the local repo code.

Additional local design reference:

- The sibling Coinbase CDS repo lives at `C:\Users\zhang\00My Stuff\Coding\Learning\cds`.
- Use it as a reference for frontend engineering discipline, interaction patterns, and accessible component structure.
- Prefer local reimplementation over direct CDS package adoption unless the user explicitly asks for package integration; the local repo notes already document the React compatibility tradeoff and the desire to keep theming flexible.
- When design folders include screenshots plus `thoughts.md`, treat them as direct user preference input rather than optional inspiration.

Do not rely on memory first. When answering questions, proposing architecture, or writing Payload code, read the local Payload repository first:

- Local repo: `C:\Users\zhang\00My Stuff\Coding\Learning\learning-payload-cms\payload`
- Relative from this folder: `..\payload`

Treat the local repo as the primary source of truth for how Payload is actually built.

### Required Research Workflow

1. Start with the relevant local package under `packages/*`.
   Examples:
   - `packages/plugin-form-builder`
   - `packages/payload`
   - `packages/next`
   - `packages/ui`
2. Read the real implementation before explaining behavior or recommending patterns.
3. Prefer code and docs from the local clone over recall.
4. If the local clone is missing the needed detail, is outdated, or the relevant code is not present, fall back to the official GitHub repo: `https://github.com/payloadcms/payload`.
5. When discussing best practices for developing in Payload CMS, derive them from the actual repo structure, package code, docs, and patterns used inside Payload itself, not generic CMS advice.

### Best-Practice Focus Areas

When relevant, inspect these areas first:

- `packages/plugin-form-builder` for plugin patterns, generated collections, override APIs, and field/block composition
- `packages/payload` for core config types, collection/global/field schemas, and utilities
- `packages/next` for admin views, routing, and Next.js integration patterns
- `packages/ui` for admin UI components and frontend conventions
- `docs/` for official project explanations that match the source

### Additional Local Instruction Files

Also read these files in this folder when relevant:

- `TEACHING-GUIDANCE.md` for explanation style, ordering, pacing, and anti-patterns when teaching
- `PAYLOAD-SETTINGS-AND-HOOKS.md` for practical guidance on config settings, analytics placement, hooks, route handlers, endpoints, and context

## What is Payload CMS

Payload is a Next.js-native headless CMS. You install it directly into a Next.js `/app` folder. It gives you:

- A database-backed admin UI
- REST + GraphQL APIs
- TypeScript-first config with full type safety

---

## Project Entry Point

The main config is `payload.config.ts`. Everything — collections, globals, plugins, email, database — is registered here.

```ts
export default buildConfig({
  collections: [...],
  plugins: [...],
  db: mongooseAdapter({ url: process.env.MONGODB_URI }),
  email: ...,
})
```

`payload.config.ts` is the **single** entry point. But for organization, collection and global definitions live in their own files and get imported in:

```
payload.config.ts
  imports Header/config.ts    → GlobalConfig definition
  imports Footer/config.ts    → GlobalConfig definition
  imports collections/Posts   → CollectionConfig definition
  imports plugins/index.ts    → plugin registrations
```

This is purely organizational — there is still only one Payload config. Split your definitions into separate files and import them in.

---

## Collections

A collection is a database table/document type. Each document in a collection is one row. You define collections by specifying their fields.

```ts
const Orders: CollectionConfig = {
  slug: "orders", // used in API routes and payload.create({ collection: 'orders' })
  admin: {
    useAsTitle: "title", // which field to show as the document label in admin UI
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "total", type: "number" },
  ],
};
```

Register it in `payload.config.ts` under `collections: [Orders]`.

---

## Fields

Fields are the columns/properties of a collection document. Every field has at minimum `name` and `type`.

Common types:

- `text` — single line string
- `textarea` — multi-line string
- `number` — numeric value
- `richText` — rich text editor (Lexical or Slate), stores as JSON tree
- `radio` — one of N options
- `select` — dropdown, one or many options
- `checkbox` — boolean
- `date` — date/time picker
- `array` — repeatable group of sub-fields
- `blocks` — array of different typed content blocks (each block has its own fields)
- `group` — nests related fields into a sub-object in the database
- `relationship` — reference to another collection document

### `type: 'tabs'` — organizing fields into tab panels

`tabs` is a layout-only field type. It doesn't store data itself — it groups fields into clickable tab panels in the admin UI so the editor doesn't see a massive wall of fields:

```ts
fields: [
  { name: 'title', type: 'text' },  // always visible above tabs
  {
    type: 'tabs',
    tabs: [
      { label: 'Hero', fields: [hero] },         // tab 1: click "Hero" → see hero fields
      { label: 'Content', fields: [layoutField] }, // tab 2: click "Content" → see blocks
      { name: 'meta', label: 'SEO', fields: [MetaTitleField, MetaImageField, ...] },
    ],
  },
]
```

Key detail: if a tab has a `name` (like `name: 'meta'`), its fields get **nested** under that key in the database (`meta.title`, `meta.description`). If a tab has no `name`, its fields stay top-level. This is purely a data-nesting decision — the UI looks the same either way.

### `@payloadcms/plugin-seo` — SEO fields

The SEO plugin provides ready-made field components for the admin UI:

- **`OverviewField`** — read-only visual mock-up of how the page appears in Google search results. Reads from the other SEO fields to render a preview.
- **`MetaTitleField`** — the `<title>` tag (browser tab + blue Google link). `hasGenerateFn: true` adds an auto-generate button.
- **`MetaImageField`** — the `og:image` for social sharing cards (Twitter, Slack, Facebook). `relationTo: 'media'` references the media collection.
- **`MetaDescriptionField`** — the `<meta name="description">` tag (gray text under Google title).
- **`PreviewField`** — shows the generated URL. `hasGenerateFn: true` auto-generates from the slug.

Typically placed in a tab with `name: 'meta'` so all SEO data nests under `meta` in the database:

```json
{ "meta": { "title": "...", "description": "...", "image": "media-id" } }
```

### `name` vs `label`

- `name` — the database key. Never shown to end users. No spaces.
- `label` — human-readable text shown in the admin UI.

### `admin` on a field

Controls how the field appears in the admin UI. Does not affect the database.

```ts
{
  name: 'status',
  type: 'radio',
  options: ['pending', 'delivered'],
  admin: {
    condition: (data, siblingData) => siblingData?.total > 0,  // show/hide conditionally
    description: 'Choose the order status.',                    // helper text below field
    hideGutter: true,                                           // cosmetic — removes sidebar line
  }
}
```

`condition` receives:

- `data` — the full document (use `_` to ignore)
- `siblingData` — fields at the same nesting level

`condition` works on **any field type** — not just `upload`. You can use it on `text`, `select`, `richText`, `group`, `array`, etc. Any field can be conditionally shown/hidden based on the values of other fields.

### `group` type

Nests fields into a sub-object:

```ts
{
  name: 'delivery',
  type: 'group',
  fields: [
    { name: 'address', type: 'text' },
    { name: 'date', type: 'date' },
  ]
}
// stored as: { delivery: { address: '...', date: '...' } }
```

### `slugField()` - composite field helper pattern

`slugField()` from `payload` does not return an entire collection config. It returns one reusable field config object of type `row`, intended to be placed inside a collection's `fields: [...]` array.

Conceptually, it returns:

- a hidden internal `generateSlug` checkbox field
- a visible `slug` text field
- a `beforeChange` hook that can auto-generate the slug from another field such as `title`
- a custom admin `Field` component that provides the lock / unlock / generate UX for editors

This is a useful pattern to remember for Payload:

- a helper can return a composite field, not just a primitive field
- a field config can combine schema, admin UI behavior, custom admin components, and server hooks
- hidden fields can store internal state for richer editor UX

`slugField()` is therefore a good example of a reusable "field package" built from normal Payload field primitives.

### `Media` / upload collection pattern

A `media` collection is a very common Payload pattern for real companies. It is usually used for images, documents, campaign assets, social images, app graphics, PDFs, and other uploaded files that need their own metadata and admin UI.

Core idea:

- a normal collection stores structured content documents
- an upload-enabled collection stores file-backed documents plus metadata

Typical example:

```ts
export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  fields: [
    { name: 'alt', type: 'text' },
    { name: 'caption', type: 'richText', editor: lexicalEditor(...) },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [...],
  },
}
```

Important meanings:

- `upload` turns the collection into an upload collection and Payload auto-adds file metadata fields such as filename, mime type, filesize, dimensions, and generated `sizes`
- `alt` is important for accessibility and SEO
- `caption` is optional editorial copy shown with the media, and may reasonably use `richText`
- `folders: true` enables folder-based organization in the admin panel
- `adminThumbnail` controls which generated size the admin UI should use for previews
- `focalPoint: true` lets editors choose the visually important part of an image so crops/resizes preserve the subject better
- `imageSizes` defines generated responsive/cropped variants such as thumbnail, square, card, hero, og image, etc.

Storage guidance:

- `upload.staticDir` is a local filesystem path for storing uploaded files
- this is fine for local development and some self-hosted environments with persistent disk
- for serverless or CDN-heavy deployments, prefer external object storage patterns (for example S3-like storage) rather than relying on local disk writes

Rich text guidance:

- `lexicalEditor()` configures a `richText` field to use Lexical
- `FixedToolbarFeature()` adds a persistent toolbar
- `InlineToolbarFeature()` adds a floating selection toolbar
- field-level `editor: lexicalEditor(...)` can extend or override the root editor config for that one field

This is a strong pattern to remember for enterprise apps: a media collection is not just "file storage", it is often an asset-management collection with upload config, editorial metadata, organization, and multiple derived image sizes.

### `blocks` type - the page builder pattern

A `blocks` field is an array where each item can be a **different type**. Each block type is defined as a `Block` with its own `slug` and `fields`. Think of it as a menu of reusable lego pieces the admin can assemble in any order.

**Defining block types:**

```ts
// Each block has a slug (the identifier) and its own fields
export const Content: Block = {
  slug: 'content',                    // ← this becomes blockType in the data
  fields: [{ name: 'columns', type: 'array', fields: [richText, size, enableLink] }]
}
export const MediaBlock: Block = {
  slug: 'mediaBlock',
  fields: [{ name: 'media', type: 'upload', relationTo: 'media' }]
}
```

**Registering blocks on a field:**

```ts
{
  name: 'layout',
  type: 'blocks',
  blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock],
}
```

The `blocks` array is the menu of available types. Only these can be used in `layout`.

**What gets stored in the database:**

Each block in the array gets a `blockType` matching the slug:

```json
[
  { "blockType": "content", "columns": [...] },
  { "blockType": "mediaBlock", "media": "abc123" },
  { "blockType": "cta", "richText": {...}, "links": [...] }
]
```

**Admin UI experience:** The business owner sees an "Add block" button → dropdown of available types. They can add, reorder (drag), delete, duplicate, and collapse blocks. The developer defines what block types exist and what fields each has; the admin composes them however they want.

**Frontend rendering:** Switch on `blockType` to render the right component:

```tsx
{layout.map(block => {
  if (block.blockType === 'content') return <ContentBlock {...block} />
  if (block.blockType === 'mediaBlock') return <MediaBlock {...block} />
})}
```

### `Field` type vs `CollectionConfig`

`CollectionConfig` defines an entire collection (slug, access, hooks, fields). `Field` is one field definition — the building block inside a collection's `fields` array. Fields can be exported standalone for reuse across collections:

```ts
// heros/config.ts — reusable field
export const hero: Field = { name: 'hero', type: 'group', fields: [...] }

// Pages/index.ts — import and drop in
tabs: [{ fields: [hero], label: 'Hero' }]
```

---

## Plugins

Plugins extend Payload by injecting collections, globals, hooks, or fields into the main config. They use a curried function pattern:

```ts
export const myPlugin =
  (
    pluginOptions: MyPluginConfig, // stage 1: you call this
  ) =>
  (config: Config): Config => {
    // stage 2: Payload calls this at boot
    return {
      ...config,
      collections: [...config.collections, newCollection],
    };
  };
```

You call stage 1 and pass the result into `plugins: []` in `payload.config.ts`. Payload calls stage 2 when it boots.

### Why curried?

You have your plugin options. Payload has the full app config. They're available at different times — currying lets each party contribute at the right moment.

---

## formBuilderPlugin

From `@payloadcms/plugin-form-builder`. Automatically creates two collections:

- `forms` — editors build forms here in the admin UI
- `form-submissions` — stores visitor submissions

### The 3 layers of "fields" (do not confuse these)

1. **Collection fields** — the schema of the `forms` collection itself (`title`, `confirmationType`, `confirmationMessage`, `emails`, `redirect`, etc.)
2. **Form-builder field blocks** — the input types an editor can drag into a form (`text`, `email`, `select`, `checkbox`, `payment`, etc.)
3. **Submission values** — the actual data a site visitor submitted (`{ field: 'email', value: 'alice@example.com' }`)

### Config options

```ts
formBuilderPlugin({
  // Enable/disable built-in field types
  fields: {
    payment: false,   // false = disabled, true = enabled, object = enabled with overrides
    checkbox: true,
  },

  // Customize the `forms` collection
  formOverrides: {
    slug: 'bakery-forms',           // rename the collection
    access: { read: () => false },  // change access control
    fields: ({ defaultFields }) => { // modify default fields
      return defaultFields.map((field) => {
        if ('name' in field && field.name === 'confirmationMessage') {
          return { ...field, editor: lexicalEditor({...}) }  // override just the editor
        }
        return field
      })
    }
  },

  // Customize the `form-submissions` collection
  formSubmissionOverrides: { ... },

  // Fallback email for submissions
  defaultToEmail: 'orders@mybakery.com',

  // Intercept emails before they send
  beforeEmail: (emails) => emails.map(e => ({ ...e, subject: `[Bakery] ${e.subject}` })),

  // Custom payment handler
  handlePayment: (data) => { ... },

  // Collections that can be used as redirect targets
  redirectRelationships: ['pages'],
})
```

### `formOverrides.fields` pattern

The plugin gives you its default fields. You map over them, find the one you want to change, spread it (`...field` to keep everything), then override specific properties. Return the full array.

### Email templating

In email config, use `{{fieldName}}` to reference submitted values:

```ts
emailTo: "{{email}}"; // replaced with whatever the visitor typed in the 'email' field
```

### Seed data

`RequiredDataFromCollectionSlug<'forms'>` — a Payload utility type that derives the TypeScript type of a valid document for a given collection. Used in seed scripts to get type safety when pre-populating the database.

---

## richText and Lexical

Rich text fields store content as a **Lexical JSON tree** — not HTML. The structure is a nested tree of nodes:

```json
{
  "root": {
    "type": "root",
    "children": [
      {
        "type": "heading",
        "tag": "h2",
        "children": [{ "type": "text", "text": "Hello", "format": 0 }],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1
      }
    ]
  }
}
```

Fields like `format: 0`, `indent: 0`, `direction: 'ltr'` are mostly zeroed-out defaults. The meaningful parts are `type`, `tag`, and `text`.

Configure the Lexical editor with features:

```ts
editor: lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
  ],
});
```

---

## TypeScript Utilities (used frequently in Payload)

- `Partial<T>` — makes all properties of T optional
- `Omit<T, 'key'>` — removes a specific key from type T
- `T & U` — intersection: the value must satisfy both T and U
- `T | U` — union: the value can be either T or U
- `RequiredDataFromCollectionSlug<'slug'>` — derives the required shape to create a document in that collection
- `import type { X } from 'y'` — imports only the TypeScript type, erased at runtime

---

## Other Plugins in the Website Template

- `redirectsPlugin` — manages URL redirects, stored in a `redirects` collection
- `nestedDocsPlugin` — allows hierarchical parent/child relationships (e.g. nested categories)
- `seoPlugin` — adds SEO metadata fields with auto-generated title/URL helpers
- `searchPlugin` — adds search across specified collections with customizable indexed fields

---

## Seed Scripts

Seed scripts pre-populate the database on first run. They live in `src/endpoints/seed/`. Each file exports a typed object that gets passed to `payload.create()`:

```ts
await payload.create({
  collection: "forms",
  data: contactFormData, // typed as RequiredDataFromCollectionSlug<'forms'>
});
```

---

## Globals

A global is a **single document** that always exists — no creating or deleting, only updating. Used for site-wide things like a header or footer.

```ts
export const Header: GlobalConfig = {
  slug: "header",
  fields: [
    {
      name: "navItems",
      type: "array",
      fields: [link()],
      maxRows: 6,
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
};
```

Register in `payload.config.ts` under `globals: [Header, Footer]`.

### Globals vs Collections

- **Collection** — many documents (many posts, many orders)
- **Global** — exactly one document (one header, one footer)

### Updating a global via Local API

```ts
await payload.updateGlobal({
  slug: "header", // the GlobalConfig slug
  data: { navItems: [] }, // keys match the global's field names
  depth: 0, // 0 = don't populate relationships, just IDs (faster)
  context: {
    disableRevalidate: true, // suppress Next.js revalidation (useful during seeding)
  },
});
```

`data` keys come directly from the global's `fields` array — whatever `name` you gave each field is the key in `data`. TypeScript enforces this automatically.

### Globals have two separate concerns

Each global (Header, Footer) typically has two parts in the codebase:

1. **`config.ts`** — the Payload GlobalConfig. Defines what editors can fill in via the admin UI (nav links, logos, etc.). This is the CMS/data side.
2. **`Component.tsx`** — the React component that renders on the public-facing website. Reads the global's stored data and renders HTML. This is the frontend side.

Payload provides **zero default public-facing UI**. It only provides the admin panel. You build the public Header/Footer components yourself, and they fetch their content from the global.

---

## `data` in Local API calls

In `payload.create`, `payload.update`, `payload.updateGlobal`, etc. — the `data` argument is just **the field values you want to write**, keyed by the field `name`s defined in that collection or global's `fields` array.

```ts
// Header global has one field: name='navItems'
payload.updateGlobal({ slug: "header", data: { navItems: [] } });

// Orders collection has fields: name='title', name='total'
payload.create({
  collection: "orders",
  data: { title: "Croissant order", total: 24 },
});
```

To know what keys are valid in `data` — look at the collection or global's `fields` array. That is always the source of truth. TypeScript will tell you via autocomplete.

---

## Seed Scripts

Seed scripts pre-populate the database on first run. They live in `src/endpoints/seed/`. The seed endpoint:

1. Requires the user to be authenticated (checks session cookie via `payload.auth({ headers })`)
2. Creates a `PayloadRequest` via `createLocalReq({ user }, payload)` to carry user context through Local API calls
3. Clears existing data, then re-inserts fresh seed data in dependency order

```ts
// Seed endpoint pattern (route.ts)
const payload = await getPayload({ config });
const requestHeaders = await headers(); // Next.js — read incoming HTTP headers
const { user } = await payload.auth({ headers: requestHeaders }); // verify session cookie

if (!user) return new Response("Forbidden", { status: 403 });

const payloadReq = await createLocalReq({ user }, payload); // build Local API context
await seed({ payload, req: payloadReq });
```

`createLocalReq` is needed because the Local API (direct `payload.create` etc.) bypasses HTTP but still needs to know who is acting and what database transaction to use.

Each seed data file exports a typed object:

```ts
export const contactForm: RequiredDataFromCollectionSlug<'forms'> = { ... }
// RequiredDataFromCollectionSlug<'forms'> = TypeScript type derived from the forms collection fields
```

---

## Admin UI Notes

- `admin.useAsTitle` — which field displays as the document title in the list view
- `admin.condition` — show/hide a field based on other field values
- `admin.description` — helper text shown below a field
- `admin.hideGutter` — removes the visual sidebar line on group fields
- `admin.enableRichTextRelationship` — controls relationship link rendering in rich text
- Access is separate from admin visibility — `access` controls who can read/write data, `admin.condition` controls what editors see in the UI

## `payload.create` and richText — the full picture

When you call `payload.create()`, the `data` argument is an object whose keys match the collection's field `name`s. For a `text` field, the value is a plain string. For a `richText` field, the value must be a valid Lexical JSON tree.

In normal usage, **you never write Lexical JSON by hand**. The admin UI renders a visual editor (powered by `@payloadcms/richtext-lexical`). The business owner types formatted text, and Lexical auto-generates the JSON tree on save. This JSON is what gets stored in the database and what `payload.create` expects for richText fields.

Seed scripts are the exception — they simulate what a human would do in the UI, so they must provide the Lexical JSON directly. That's why files like `image-1.ts` contain verbose tree structures with `root`, `children`, `direction`, `format`, etc. These were almost certainly copy-pasted from a database dump, not written by hand.

### For media (upload) collections, `data` vs `file`:
- `data` = the metadata fields (alt text, caption, etc.) — matches the collection's `fields` array
- `file` = the actual binary file (image bytes as a Node.js Buffer with name, mimetype, size)

Payload saves the binary to disk/storage and auto-populates fields like `url`, `width`, `height`, `filename`.

---

## How the Admin UI Maps to Seed Data

The JSON in seed files like `contact-form.ts` maps directly to what the business owner sees as a visual form in the admin panel. The admin never sees JSON — Payload renders each field type as a UI element:

| Seed data key | What the admin sees |
|---|---|
| `title: 'Contact Form'` | A plain text input |
| `confirmationType: 'message'` | A radio/dropdown choice: "message" or "redirect" |
| `confirmationMessage: { root: ... }` | A rich text editor (Lexical) — mini word processor with toolbar |
| `emails: [{ emailFrom, emailTo, subject, message }]` | A repeatable array section with + button. Each entry has text inputs + a rich text editor for the message body |
| `fields: [{ blockType: 'text', label: 'Full Name' }, ...]` | A blocks field — draggable list of form input blocks. "Add block" button shows available types (text, email, number, textarea, select, etc.) |
| `submitButtonLabel: 'Submit'` | A plain text input |

When the admin clicks **Save**, Payload serializes the visual state (including Lexical editor content) into the same JSON structure the seed files use. The seed script simply provides this JSON directly, bypassing the UI.

To explore this yourself: run `pnpm run dev`, go to `localhost:3000/admin`, navigate to Forms > Contact Form, and compare what you see with `contact-form.ts`.

---

## MISC learnings that might come in handy

Buffer.from(data)
data is an ArrayBuffer — raw bytes in a browser-style format. Buffer is Node.js's own binary data type. Buffer.from(data) converts the ArrayBuffer into a Node.js Buffer. Payload's File type expects a Node.js Buffer, not a browser ArrayBuffer, so this conversion is necessary.

What is fetchFileByURL overall?
It downloads an image from a URL and returns it as a Payload File object that can be passed to payload.create({ collection: 'media', data: { ... } }). The seed script needs to upload images into the media collection — this function does the downloading part.

fetch(url, { credentials: 'include', method: 'GET' })
Yes, this is standard JavaScript/TypeScript fetch — the same browser API, available in Node.js 18+.

method: 'GET' — the HTTP method. GET means "retrieve this resource." It's actually the default, so writing it explicitly is just being explicit for clarity.
credentials: 'include' — tells fetch to include cookies when making the request, even for cross-origin requests. If the image URL is on a server that requires authentication via cookies, this ensures they're sent. For public images it makes no difference, but it's a safe default.
res.arrayBuffer()
A fetch response has multiple ways to read the body:

res.text() — read as a string
res.json() — parse as JSON
res.arrayBuffer() — read as raw binary data (bytes)
Images are binary data — they're not text or JSON. arrayBuffer() gives you the raw bytes of the image file. That's the only correct way to handle file downloads.

---

## Access Control

Access control functions live in `src/access/`. They are plain functions that return `true` (allow) or `false` (deny). You assign them to the `access` key on a collection or field:

```ts
access: {
  create: authenticated,
  read: anyone,
  update: authenticated,
  delete: authenticated,
}
```

Payload calls these functions automatically before every operation. If `create` returns `false`, the create is rejected with a 403.

### `AccessArgs<TData>` — the argument shape

Every access function receives one argument of type `AccessArgs<TData>` (from `payload`):

```ts
export type AccessArgs<TData = any> = {
  data?: TData          // the document being accessed (typed to your collection's shape)
  id?: string           // ID of the document being accessed
  isReadingStaticFile?: boolean
  req: PayloadRequest   // the incoming request — has req.user attached after session check
}
```

`TData` is a generic — you fill it in with your collection's TypeScript type (e.g. `AccessArgs<User>`) so `data` is properly typed.

### `User` from `@/payload-types`

`payload-types.ts` is a **generated file** — Payload reads your collection configs and generates one TypeScript interface per collection. `User` is the generated type for the `users` collection:

```ts
export interface User {
  id: string
  name?: string | null
  email: string
  hash?: string | null
  loginAttempts?: number | null
  sessions?: { id: string; expiresAt: string }[] | null
  // ...
}
```

This is what Payload attaches to `req.user` after verifying a session cookie.

### `authenticated` — the standard access helper

```ts
type isAuthenticated = (args: AccessArgs<User>) => boolean

export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return Boolean(user)
}
```

- `{ req: { user } }` — double destructure: pull `req` from args, then pull `user` from `req`
- `req.user` is the logged-in user object if a valid session cookie was present, or `null`/`undefined` if not
- `Boolean(user)` → `true` if logged in, `false` if not

### `anyone` — public access helper

```ts
export const anyone = () => true
```

Always returns `true`. Used for public read access (e.g. images anyone can view).

### Access vs admin.condition

- `access` — server-side gate. Controls whether the *operation* (create/read/update/delete) is allowed at all.
- `admin.condition` — client-side visibility. Controls whether a *field* is shown in the admin UI editor. Does not affect the database or API.

---

## Upload Collections and Storage Adapters

### Local development

When you add `upload: { staticDir: '...' }` to a collection, Payload stores uploaded files on disk at `staticDir`. This works fine in local development.

### Production on Vercel (and other serverless platforms)

Vercel's filesystem is **read-only at runtime** — you cannot write files to disk permanently. Any file written during a serverless function invocation is gone when the function exits.

You need a **storage adapter** to redirect uploads to a real file store:

```ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

plugins: [
  vercelBlobStorage({
    collections: { media: true },
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }),
]
```

Available adapters:
- `@payloadcms/storage-vercel-blob` — Vercel Blob Storage
- `@payloadcms/storage-s3` — AWS S3 (or any S3-compatible store)
- `@payloadcms/storage-gcs` — Google Cloud Storage
- `@payloadcms/storage-azure` — Azure Blob Storage
- `@payloadcms/storage-uploadthing` — Uploadthing

The website template does **not** include a storage adapter — it is a starter template. When you deploy to production, you must add one yourself.

### Seeded images

The seed script fetches images from GitHub URLs and uploads them to the media collection. In local dev, they land on disk. Their purpose is purely demo content — so the admin UI shows realistic posts with hero images and thumbnails. They are not production data.
