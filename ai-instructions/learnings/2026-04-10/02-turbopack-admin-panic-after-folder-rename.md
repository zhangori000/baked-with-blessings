# 2026-04-10: Why `/admin` Started Panicking After the Folder Rename

## Table of contents

- [Bottom line](#bottom-line)
- [First: what these words mean](#first-what-these-words-mean)
- [What is `.next`?](#what-is-next)
- [Why I think this is a bundler problem](#why-i-think-this-is-a-bundler-problem)
- [Why the rename is the leading suspect](#why-the-rename-is-the-leading-suspect)
- [Why `/admin` breaks but other requests still work](#why-admin-breaks-but-other-requests-still-work)
- [Do you have to switch to Webpack?](#do-you-have-to-switch-to-webpack)
- [Turbopack vs Webpack](#turbopack-vs-webpack)
- [Expert guidance for your case](#expert-guidance-for-your-case)

## Bottom line

- Your app is probably not dead.
- The most likely problem is stale Next.js dev cache after the local folder rename.
- The break appears to be in the build tool layer, not in your business logic, auth logic, or database.

## First: what these words mean

### What is a bundler?

A bundler is a build tool.

Its job is to:

- read your source files
- follow every `import`
- figure out which files belong to a page or route
- transform that code into something the browser and server can actually run

In your app, the two bundler choices are:

- Turbopack
- Webpack

## What does "resolve" mean?

`Resolve` means:

- "Given this import statement, where is the actual file or package on disk?"

Examples:

- `import React from 'react'`
- `import config from '@payload-config'`
- `import './custom.scss'`

For each one, the bundler has to locate the real target.

If it cannot find the target correctly, that is a **resolution** problem.

## What is "bundler resolution"?

It is the part of the build process where the bundler tries to map imports to real files or packages.

Simple version:

1. code says `import X from 'something'`
2. bundler asks "where is `something`?"
3. bundler finds the matching file or package
4. bundler keeps building

If step 3 fails, the build can fail before your page even runs.

## What is a "route graph"?

That phrase just means:

- the full tree of files and imports needed for one route

For example, `/admin` does not use exactly the same files as `/`.

So the `/admin` route has its own set of:

- layouts
- page files
- imported components
- imported styles
- imported packages

That full set is what I mean by the route's graph.

## What is `.next`?

`.next` is Next.js's generated working folder.

It contains build output and dev/build cache data.

It is **not** your source code.

It is safe to delete when the dev/build state gets weird, because Next can regenerate it.

You can think of `.next` as:

- generated artifacts
- cached compiler state
- temporary build output for the current project path and current code

## Why I think this is a bundler problem

This is an inference from the panic log and the generated files.

I do **not** mean I have a mystical certainty. I mean the evidence points strongly in one direction.

The panic log repeatedly says:

- `Failed to write app endpoint /(payload)/admin/[[...segments]]/page`
- `Caused by: - Next.js package not found`
- `Execution of get_next_server_import_map failed`

Why that matters:

- `Failed to write app endpoint` means the failure happened while Next was trying to build the route output.
- `Next.js package not found` means the build tool could not locate what it needed.
- `get_next_server_import_map` is build-system language. It is about preparing imports for the server side of the app.

That is why I called it a bundler-resolution problem.

If this were a Postgres problem, I would expect errors about:

- database connection
- SQL
- migrations
- Payload db adapter

If this were an auth problem, I would expect errors about:

- login
- cookies
- users
- permissions
- Payload auth flow

If this were a normal route runtime error, I would expect a stack trace pointing at one of your actual app files during execution.

Instead, the failure is happening earlier, during route compilation.

## Why the rename is the leading suspect

You renamed the local folder from:

- `baked-with-blessing`

to:

- `baked-with-blessings`

After that, the generated `.next` files still contained old absolute paths that referenced the old folder name.

Example:

- [.next/types/app/(payload)/layout.ts](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/.next/types/app/(payload)/layout.ts#L1) still points at the old singular folder path.

That is a concrete sign that `.next` was created before the rename and is now stale.

So the likely sequence is:

1. Next generated cache and metadata when the repo lived at the old folder path.
2. You renamed the folder.
3. Some cached data inside `.next` still pointed at the old absolute path.
4. Turbopack tried to build `/admin` using stale path information.
5. That route panicked during compilation.

## Did the rename actually "kill the app"?

Probably not.

More likely:

- the rename invalidated cached build state
- Turbopack is reacting badly to that stale state

That is very different from:

- your source code being destroyed
- your database breaking
- your repo being unrecoverable

So no, the rename probably did not "kill" the app. It likely broke the current dev cache.

## Why `/admin` breaks but other requests still work

Next dev compiles routes on demand.

That means:

- one route can compile successfully
- another route can fail later when its own imports are processed

That fits what you saw:

- `/api/users/me` still returned `200`
- `/admin` kept panicking

So the app is not uniformly broken. A specific route build path is broken.

## Why I suggested Webpack so quickly

Not because I think Webpack is "the real answer."

I suggested it because it is a strong diagnostic shortcut.

If Webpack can boot the same app and `/admin` works, then that tells us:

- your app code is mostly fine
- the immediate problem is Turbopack-specific

That makes Webpack a **temporary isolation step**, not a philosophical surrender.

## Do you have to switch to Webpack?

No.

If you want to stay on Turbopack, that is reasonable.

The right Turbopack-first sequence is:

1. stop the dev server
2. delete `.next`
3. start dev again with Turbopack
4. test `/admin`

That addresses the stale-cache theory directly.

If it works, great. No Webpack needed.

If it still fails after a clean `.next`, then the next step is:

- gather a clean repro
- optionally generate a Turbopack trace
- decide whether this is a real Turbopack bug or a config edge case

## Turbopack vs Webpack

### Turbopack

- newer
- built into Next.js
- default in Next 16
- designed for fast local development
- incremental and aggressively cached
- can hit edge-case bugs because it is newer

Official Next docs describe Turbopack as an incremental bundler built into Next.js, and say it is the default bundler in Next 16.

### Webpack

- older
- more mature
- more battle-tested
- broader compatibility history
- usually the safer fallback when a toolchain edge case appears

Webpack is not "for worse engineers."

It is often the choice of engineers who care more about:

- compatibility
- predictability
- stability under weird edge cases

Turbopack is not "for better engineers."

It is often the choice of engineers who want:

- faster feedback loops
- the current Next.js default
- better dev performance when the project fits the happy path

## Expert guidance for your case

My guidance is:

- do **not** permanently switch to Webpack just because of one scary panic
- do **not** ignore the stale `.next` evidence either

Best order of operations:

1. treat the rename as a cache-corruption suspect
2. clear `.next`
3. retry Turbopack first if you want to preserve the default setup
4. only use Webpack temporarily if Turbopack is still blocking your work

That is not "taking the easy way out."

It is separating:

- root-cause investigation

from:

- keeping yourself productive

## If you want to stay on Turbopack

Then the immediate plan should be:

1. stop the running dev server
2. delete `.next`
3. start `next dev` normally again
4. test `/admin`

If it still panics after that, then the question changes from:

- "did the rename stale the cache?"

to:

- "does this repo/config hit a real Turbopack bug even from a clean state?"

## Official docs checked

- [Next.js Turbopack docs](https://nextjs.org/docs/app/api-reference/turbopack)
- [Next.js Turbopack config docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
- [webpack concepts](https://webpack.js.org/concepts/)
- [webpack module resolution](https://webpack.js.org/concepts/module-resolution)
