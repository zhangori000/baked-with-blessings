# Payload Import Map After Plugin Change

## What happened

After adding `@payloadcms/storage-vercel-blob` to `payload.config.ts`, the admin UI logged:

`getFromImportMap: PayloadComponent not found in importMap`

with a missing key like:

`@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler`

## Why

Payload admin uses a generated import map file:

- `src/app/(payload)/admin/importMap.js`

That file is a build-time lookup table from string component paths in Payload config/plugins to real imported modules.

When a new plugin introduces an admin/client component, the import map must be regenerated.

If it is stale:

- the app can still partially run
- server logs mention missing components from the import map
- admin screens that rely on that plugin may break or render incorrectly

## Fix

Run:

```bash
pnpm run generate:importmap
```

Then restart the Next dev server.

## What that command really is

In this repo, `pnpm run generate:importmap` comes from `package.json`:

```json
"generate:importmap": "cross-env NODE_OPTIONS=--no-deprecation payload generate:importmap"
```

So the real Payload command underneath is:

```bash
payload generate:importmap
```

`pnpm run generate:importmap` is just the repo's script wrapper around the Payload CLI command.

## What Payload generates

Payload scans config and plugin declarations that point at admin components, then rewrites:

- `src/app/(payload)/admin/importMap.js`

That generated file contains real JavaScript imports and an object lookup table so Payload admin can resolve component paths like:

- `@/components/BeforeLogin#BeforeLogin`
- `@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler`

without trying to discover them dynamically at runtime.

## Should this be part of the media import script?

Usually, no.

Reason:

- `import:cookie-media` is a content/data operation
- `generate:importmap` is an admin build/config sync operation

The import map only needs regeneration when admin-facing config changes, for example:

- adding or removing a Payload plugin
- changing custom admin components
- changing admin field/view overrides

It does **not** need to run every time you import media records.

If it were baked into `import:cookie-media`, that script would start doing unrelated build-time maintenance every run, which is noisy and harder to reason about.

Better mental model:

- run `generate:importmap` after Payload plugin/admin config changes
- run `import:cookie-media` when you want to upload cookie media
- keep those as separate responsibilities

If you want automation later, the better place would be a higher-level setup checklist or a dedicated "after Payload config changes" workflow, not the cookie import script.

## Mental model

- `payload.config.ts` declares admin components indirectly by string path
- `generate:importmap` materializes those references into imports
- changing plugins/admin components without regenerating the import map leaves admin runtime out of sync
