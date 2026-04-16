# `@next/env` ESM Import Gotcha (2026-04-16)

## The problem

While running `pnpm run import:cookie-media`, the script crashed immediately on this line:

```ts
import { loadEnvConfig } from '@next/env'
```

The runtime error was:

```txt
SyntaxError: The requested module '@next/env' does not provide an export named 'loadEnvConfig'
```

At first glance this is confusing because the package has TypeScript declarations that clearly mention `loadEnvConfig`. That makes it look like a normal named export should work. But the type file and the runtime file are not the same thing, and this is one of those cases where the type surface is friendlier than the actual module shape.

## What was actually happening

This repo is ESM-oriented because `package.json` has `"type": "module"`, and the scripts are run through `tsx`, which evaluates them in an ESM context. The installed `@next/env` package, however, is emitted as CommonJS at runtime. Its `package.json` points `main` to `dist/index.js`, and that built file ends with `module.exports = n`.

That means the runtime module is essentially a CommonJS object. In ESM, a line like `import { loadEnvConfig } from '@next/env'` expects a true named ESM export. Since the runtime is CommonJS, that named binding is not available the way the script expects, so Node throws before the script even starts.

## The fix

Use the default/CommonJS-compatible import form and then destructure from that object:

```ts
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())
```

This works because the CommonJS module is presented to ESM as the default export object, and `loadEnvConfig` lives on that object at runtime.

## Why this is a useful lesson

The important learning is that TypeScript declarations can make a package look like it supports named ESM imports even when the runtime artifact is still CommonJS. When a script fails with a message like “does not provide an export named ...”, that usually means the runtime module format and the import syntax disagree. The package might still have the function you want; you just have to access it through the default/CommonJS bridge instead of a named ESM import.

## How to debug this next time

If this happens again, inspect three things in order. First, check the package’s `package.json` for `main`, `module`, and `exports`. Second, open the built runtime file and look for `module.exports` versus real `export` statements. Third, verify the live shape with a tiny no-side-effect command like:

```bash
node --input-type=module -e "import nextEnv from '@next/env'; console.log(typeof nextEnv.loadEnvConfig)"
```

That keeps the debugging focused on the module boundary instead of blaming the rest of the script.

## What changed in this repo

The fix was applied to:

- `scripts/import-cookie-media.ts`
- `scripts/seed.ts`
- `scripts/bootstrap-first-admin.ts`

All three now load `@next/env` through the default import and then call `loadEnvConfig(process.cwd())`.
