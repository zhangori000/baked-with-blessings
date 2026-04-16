# Env Load Order And ESM Hoisting (2026-04-16)

## The symptom

After fixing the `@next/env` import shape, the cookie media import script moved forward but then failed with:

```txt
Error: missing secret key. A secret key is needed to secure Payload.
```

This was confusing because `PAYLOAD_SECRET` was definitely present in both `.env.local` and `.env`, and a direct test confirmed that `loadEnvConfig(process.cwd())` really was loading the variable.

## What was actually wrong

The problem was not that the env file failed to load. The problem was **when** the env file loaded relative to the rest of the module graph.

The original script looked structurally like this:

```ts
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

import { createLocalReq, getPayload } from 'payload'
import config from '../src/payload.config'
```

That looks like `loadEnvConfig()` runs before the config import. But in ESM, static imports are resolved and evaluated before the importer’s body runs. That means `../src/payload.config` was being executed before `loadEnvConfig(process.cwd())` actually ran.

Since `payload.config.ts` reads values like:

```ts
secret: process.env.PAYLOAD_SECRET || ''
```

it captured an empty string during module evaluation. By the time the script later called `loadEnvConfig()`, it was too late for that already-created config object.

## The fix

Keep the env load at the top, but move env-dependent imports to **dynamic imports** inside the async function:

```ts
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const runImport = async () => {
  const { createLocalReq, getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })
}
```

This works because the script body now runs first, `loadEnvConfig()` mutates `process.env`, and only then does Node evaluate `payload.config.ts`.

## The useful mental model

In ESM, **text order is not execution order for static imports**. If a module depends on environment variables at import time, you cannot rely on putting `loadEnvConfig()` “above” a static import in the same file. If the imported module reads env at the top level, you must either load env earlier in the process itself or switch that import to a dynamic import that happens after env initialization.

## What changed in this repo

This fix was applied to:

- `scripts/import-cookie-media.ts`
- `scripts/seed.ts`
- `scripts/bootstrap-first-admin.ts`

All three now:

1. load env values first with `loadEnvConfig(process.cwd())`
2. dynamically import `payload` and `../src/payload.config`
3. initialize Payload only after env is present
