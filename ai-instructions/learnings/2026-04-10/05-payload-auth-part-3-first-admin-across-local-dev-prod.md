# 2026-04-10: Payload Auth Part 3, First Admin Across Local, Dev, and Prod

## Table of contents

- [Why this Part 3 exists](#why-this-part-3-exists)
- [The recommendation](#the-recommendation)
- [Example bootstrap script](#example-bootstrap-script)
- [How would you run it?](#how-would-you-run-it)
- [How would this run in production?](#how-would-this-run-in-production)
- [Important clarification: this does **not** auto-run when you load the site](#important-clarification-this-does-not-auto-run-when-you-load-the-site)
- [The environment model](#the-environment-model)
- [Local environment](#local-environment)
- [Dev environment](#dev-environment)
- [Prod environment](#prod-environment)
- [What happens on redeploy?](#what-happens-on-redeploy)
- [How later admins should be created](#how-later-admins-should-be-created)
- [The recommended practical flow](#the-recommended-practical-flow)

## Why this Part 3 exists

Part 2 established the chosen architecture:

- `admins`
- `customers`

This Part 3 answers one specific operational question:

- how do we create the very first admin safely across local, dev, and prod?

Related notes:

- [03-payload-auth-part-1-bootstrap-explained.md](./03-payload-auth-part-1-bootstrap-explained.md)
- [04-payload-auth-part-2-admins-vs-customers.md](./04-payload-auth-part-2-admins-vs-customers.md)

## The recommendation

Use one private bootstrap mechanism:

- a local/server-side admin bootstrap script

Do **not** rely on:

- public signup
- an empty production site with `/admin/create-first-user`
- a permanent public bootstrap route

The first admin should be created by a script that runs outside the public website flow.

## Example bootstrap script

This is the kind of script I mean.

Example file:

- `scripts/bootstrap-first-admin.ts`

Example shape:

```ts
import { getPayload } from 'payload'
import config from '@payload-config'

const email = process.env.BOOTSTRAP_ADMIN_EMAIL
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Initial Admin'

if (!email || !password) {
  throw new Error('Missing BOOTSTRAP_ADMIN_EMAIL or BOOTSTRAP_ADMIN_PASSWORD')
}

const payload = await getPayload({ config })

const existingAdmins = await payload.find({
  collection: 'admins',
  depth: 0,
  limit: 1,
})

if (existingAdmins.totalDocs > 0) {
  console.log('Admin already exists. Nothing to do.')
  process.exit(0)
}

await payload.create({
  collection: 'admins',
  data: {
    email,
    password,
    name,
  },
})

console.log(`Created first admin: ${email}`)
```

That example is not wired into your repo yet. It is the shape of the script I am recommending.

## How would you run it?

Because this repo already has `tsx`, the simplest approach is usually:

```bash
pnpm exec tsx scripts/bootstrap-first-admin.ts
```

Or, if you add a script in `package.json`, then:

```bash
pnpm bootstrap:admin
```

The important point is that this is a manual server-side command, not a public page and not something customers can trigger from the browser.

### What does "installed in this repo" mean?

When I say a tool is "installed in this repo," I mean:

- it is listed in this repo's `package.json`
- and it gets installed into this repo's `node_modules`

In your repo, `tsx` is already listed in `devDependencies` in [package.json](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/package.json#L95).

So this project already depends on `tsx`. You do not need to separately install `tsx` globally on your whole machine just to run one local script.

### What are "this project's installed dependencies"?

That phrase means:

- the packages this specific repo asked for in its `package.json`
- and that pnpm installed for this specific repo

Examples from your repo are things like:

- `next`
- `payload`
- `typescript`
- `tsx`

Those are project dependencies, not random global tools installed somewhere else on your computer.

### What does `pnpm exec` mean?

`pnpm exec` means:

- "run a command using this project's installed tools"

So instead of relying on:

- whatever happens to be installed globally on your machine

it uses:

- the versions installed for this repo

That is useful because it makes the command more predictable. Two people on two machines are more likely to run the same tool version if both are using the repo's local install.

### What is `tsx`?

`tsx` is a tool that runs TypeScript files directly from the command line.

Why that matters:

- Node runs JavaScript
- your bootstrap script example is written in TypeScript

TypeScript is close to JavaScript, but it adds things like:

- type annotations
- TypeScript-specific syntax

Node does not natively execute normal `.ts` source files the same way it executes plain `.js` files. So something has to bridge that gap.

That is where `tsx` helps. It handles the "run this TypeScript file" part for you.

### Why do people talk about "compiling TypeScript"?

Normally, TypeScript source code gets transformed into JavaScript before execution.

Very roughly:

1. you write `.ts`
2. a tool strips or transforms the TypeScript-only syntax
3. the runtime executes JavaScript

When people say "compile TS," they mean that transformation step from TypeScript source into runnable JavaScript output.

Tools like `tsx` make this feel smoother because they let you run a TypeScript entry file directly from the command line without making you manually do a separate build step first.

So this command:

```bash
pnpm exec tsx scripts/bootstrap-first-admin.ts
```

means:

1. ask pnpm to use the repo's local tools
2. pick the `tsx` binary from this repo
3. use that tool to run `scripts/bootstrap-first-admin.ts`

If you do not want to remember the full command every time, you can add a script in `package.json`.

Example:

```json
{
  "scripts": {
    "bootstrap:admin": "tsx scripts/bootstrap-first-admin.ts"
  }
}
```

Then you run:

```bash
pnpm bootstrap:admin
```

### What is a `package.json` script?

A `package.json` script is a named command shortcut stored under the `scripts` section of `package.json`.

In your current repo, examples already exist like:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`

Those names come from the `scripts` section in [package.json](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/package.json#L7).

Why people use scripts:

- shorter commands
- easier for teammates to remember
- easier documentation
- one place to update the command later

### Why does `exec` disappear when using a script?

This is the key part you called out.

When you run:

```bash
pnpm exec tsx scripts/bootstrap-first-admin.ts
```

you are explicitly telling pnpm:

- "please find the local `tsx` binary and run it"

But when you put this in `package.json`:

```json
{
  "scripts": {
    "bootstrap:admin": "tsx scripts/bootstrap-first-admin.ts"
  }
}
```

and then run:

```bash
pnpm bootstrap:admin
```

pnpm already knows it is running a package script. As part of running that script, it automatically makes the repo's local binaries available to the command. So inside the script body, you can usually just write:

- `tsx scripts/bootstrap-first-admin.ts`

instead of:

- `pnpm exec tsx scripts/bootstrap-first-admin.ts`

So the `exec` did not become unnecessary in the universe. It became unnecessary **inside the script body** because pnpm is already running that script in the project's dependency context.

## How would this run in production?

The exact mechanics depend on where you host the app, but the principle stays the same:

- run the script in a trusted environment
- with production environment variables
- against the production database

Examples:

- from a terminal on the production host
- from a secure CI/CD one-off job
- from your own trusted machine if it has the right production environment access

What matters is not the exact shell entrypoint. What matters is:

- the script talks to the real prod DB
- only you or a trusted operator can run it
- it exits safely if an admin already exists

## Important clarification: this does **not** auto-run when you load the site

No:

- visiting the site does not automatically create an admin
- visiting `/admin` does not automatically log you in
- the script does not run on every app start by default

The recommended model is:

1. you run the bootstrap script intentionally
2. it creates the first admin record in the database if none exists
3. then you go to `/admin` and log in with that email/password normally

So it is:

- explicit setup

not:

- automatic browser-time magic

## What the bootstrap script should do

At a high level:

1. initialize Payload with the real config
2. query the `admins` collection
3. if an admin already exists, exit safely
4. if no admin exists, create one admin record

That "check first, then create" rule is critical.

It makes the script:

- safe
- repeatable
- idempotent

`Idempotent` means:

- you can run it multiple times without accidentally creating duplicate first admins

## Why this is the right model

A private bootstrap script is better than a public path because:

- customers cannot trigger it
- it is explicit operator-controlled setup
- it works the same way across environments
- it does not depend on "who gets there first"

Payload's Local API is a good fit for this because the docs say:

- local API operations run server-side
- local API operations override access control by default

Official docs:

- [Local API Overview](https://payloadcms.com/docs/local-api/overview)
- [Local API Access Control](https://payloadcms.com/docs/local-api/access-control)

## The environment model

For now, assume three environments:

- local
- dev
- prod

The same overall strategy can work in all three.

## Local environment

Local is where you are developing on your machine.

Recommended behavior:

- you should be able to create a local admin quickly
- the script can be run manually whenever your local DB is fresh or reset

Typical local flow:

1. start local services
2. if the local DB is empty, run the admin bootstrap script
3. log into `/admin`

Why local is different:

- local databases get reset more often
- convenience matters more
- the audience is just you or another developer

## Dev environment

Dev means:

- a shared deployed environment for testing

Recommended behavior:

- bootstrap the first admin once
- after that, do not create another first admin on every deploy

Typical dev flow:

1. deploy dev environment
2. run the bootstrap script once against the dev database
3. admin logs in and uses the app normally

After that:

- redeploys should not recreate the admin

## Prod environment

Prod means:

- the real live environment with real data

Recommended behavior:

- create the first admin before or during controlled launch
- do not expose public first-admin creation
- keep the bootstrap path private and operator-only

Typical prod flow:

1. deploy the app
2. ensure the database is the real persistent production database
3. run the bootstrap script once against prod
4. confirm the admin can log into `/admin`
5. from then on, admins manage additional admins inside the admin panel

## What happens on redeploy?

Normally:

- redeploying the app does **not** recreate your admin
- redeploying the app does **not** clear your database

That is assuming:

- your database is persistent
- you are not dropping or replacing it
- you are not running destructive reset logic during deployment

So if you create yourself as an admin in prod and then redeploy:

- you should still exist
- the bootstrap script should see that an admin already exists and do nothing

This is why the "check if admin exists first" rule matters so much.

## Are we clearing the DB on redeploy?

Not by default.

Application redeploy and database reset are separate things.

If production uses a persistent Postgres database, then:

- app redeploys update application code
- the database stays

You only lose admin data if something explicitly resets, replaces, or wipes the database.

That is not something a normal redeploy should do.

## When would the first-admin script run again?

It should only create an admin when:

- the `admins` collection is empty

So:

- local fresh DB: yes, it may create a first admin
- dev first-time setup: yes
- prod first-time setup: yes
- normal redeploy after admin already exists: no

## What should happen to `/admin/create-first-user`?

Payload documents `createFirstUser` as a built-in admin route:

- [Admin Panel docs](https://payloadcms.com/docs/admin/overview)

That route is useful for initial setup and development.

But in the architecture you chose, it should not be your production plan.

The safer rule is:

- first admin comes from private bootstrap
- not from a public race to reach a built-in route first

## How later admins should be created

Once the first admin exists, the model changes.

From that point on:

- authenticated admins create additional admins

So yes:

- after the first admin exists, an admin can manually create more admins

That is the normal intended workflow.

The "private bootstrap" requirement is only for:

- the very first admin

After that, admin creation should move into normal admin-only operations.

## What access should the `admins` collection have after bootstrap?

Conceptually, the `admins` collection should behave like:

- `create: adminOnly`
- `read: adminOnly`
- `update: adminOnly`
- `delete: adminOnly`

That means:

- the public cannot create admins
- customers cannot create admins
- only existing admins can create more admins

The bootstrap script is the one exception, because it is a private server-side setup tool.

## The recommended practical flow

Here is the flow I recommend for your chosen split architecture.

### Local

1. bring up the local app and DB
2. run the bootstrap script if `admins` is empty
3. log into `/admin`

### Dev

1. deploy the dev environment
2. run the bootstrap script once against the dev DB
3. use the admin panel normally after that

### Prod

1. deploy the app
2. keep public customer signup separate from admin creation
3. run the bootstrap script once against the prod DB
4. confirm admin login works
5. let existing admins create any additional admins later

## What not to do

Do not rely on:

- public signup for first-admin creation
- a first-user-admin hook on a public collection
- an empty live prod environment with an open race for first admin
- a bootstrap HTTP route left exposed forever

## Bottom line

For the split `admins` + `customers` architecture, the safest first-admin plan is:

- one private bootstrap script
- run once per environment when that environment's `admins` collection is empty
- no public first-admin creation path
- later admins created by existing admins inside the admin system
