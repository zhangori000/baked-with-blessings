# Baked with Blessings

This template is in **BETA**.

This project started from the official [Payload Ecommerce Template](https://github.com/payloadcms/payload/blob/main/templates/ecommerce). It keeps that structure, components, and ecommerce flows, but is set up locally as the foundation for the Baked with Blessings cafe website.

This template is right for you if you are working on building an ecommerce project or shop with Payload.

Core features:

- [Pre-configured Payload Config](#how-it-works)
- [Authentication](#users-authentication)
- [Access Control](#access-control)
- [Layout Builder](#layout-builder)
- [Draft Preview](#draft-preview)
- [Live Preview](#live-preview)
- [On-demand Revalidation](#on-demand-revalidation)
- [SEO](#seo)
- [Search & Filters](#search)
- [Jobs and Scheduled Publishing](#jobs-and-scheduled-publish)
- [Website](#website)
- [Products & Variants](#products-and-variants)
- [User accounts](#user-accounts)
- [Carts](#carts)
- [Guest checkout](#guests)
- [Orders & Transactions](#orders-and-transactions)
- [Stripe Payments](#stripe)
- [Currencies](#currencies)
- [Automated Tests](#tests)

## Quick Start

To spin up this example locally, follow these steps:

### Clone

If you have not done so already, you need to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

Use the `create-payload-app` CLI to clone this template directly to your machine:

```bash
pnpx create-payload-app my-project -t ecommerce
```

### Development

1. `cd baked-with-blessings`
1. `docker compose up -d` to start the local Postgres database
1. `.env` is already included for local development, or you can copy `.env.example` over it if you want a clean reset
1. `pnpm install && pnpm dev` to install dependencies and start the dev server
1. open `http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

### Preview bootstrap

After linking the repo to Vercel with `pnpm exec vercel link`, one-off setup commands can be run against the Vercel Preview database and Blob store:

```bash
pnpm exec vercel env run -e preview -- pnpm bootstrap:admin
pnpm exec vercel env run -e preview -- pnpm seed
```

The scripts intentionally load local `.env` files for normal development, but when they run under Vercel env injection they preserve hosted Preview values. If `DATABASE_URL` still points at local Postgres while `NEON_POSTGRES_URL` is present, the scripts use the hosted Neon URL so setup commands do not accidentally seed Docker.

For the dummy customer account, Vercel Sensitive variables may not be downloadable through the CLI. The variable can still exist in Vercel for deployments, but `vercel env run` may not reveal the value to local one-off scripts. Pass the password locally while keeping the Preview database/blob vars from Vercel:

```bash
BOOTSTRAP_TEST_CUSTOMER_PASSWORD='your-preview-password' pnpm exec vercel env run -e preview -- pnpm bootstrap:test-customer
```

On PowerShell, use:

```powershell
$env:BOOTSTRAP_TEST_CUSTOMER_PASSWORD = 'your-preview-password'
pnpm exec vercel env run -e preview -- pnpm bootstrap:test-customer
Remove-Item Env:\BOOTSTRAP_TEST_CUSTOMER_PASSWORD
```

The test customer login identifier defaults to `test.customer@baked-with-blessings.invalid`. If you type the wrong password, the script will create or update the Preview customer with that wrong password. Nothing is permanently broken: update the Vercel env var to the intended password if needed, then rerun the command with the same intended password to reset the customer.

### Production deployment guide

For the current Baked with Blessings Vercel production flow, use [Production Deployment Setup](./documentation/getting-started/production-deployment.md). It covers the required Vercel env vars, Neon Production database setup, the temporary Stripe test-mode launch path, migrations, admin bootstrap, and `seed:prod`.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel and unpublished content. See [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Pages

  All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Pages are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Media

  This is the uploads enabled collection used by pages, posts, and projects to contain media like images, videos, downloads, and other assets. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

- #### Categories

  A taxonomy used to group products together.

- ### Carts

  Used to track user and guest carts within Payload. Added by the [ecommerce plugin](https://payloadcms.com/docs/ecommerce/plugin#carts).

- ### Addresses

  Saves user's addresses for easier checkout. Added by the [ecommerce plugin](https://payloadcms.com/docs/ecommerce/plugin#addresses).

- ### Orders

  Tracks orders once a transaction successfully completes. Added by the [ecommerce plugin](https://payloadcms.com/docs/ecommerce/plugin#orders).

- ### Transactions

  Tracks transactions from initiation to completion, once completed they will have a related Order item. Added by the [ecommerce plugin](https://payloadcms.com/docs/ecommerce/plugin#transactions).

- ### Products and Variants

  Primary collections for product details such as pricing per currency and optionally supports variants per product. Added by the [ecommerce plugin](https://payloadcms.com/docs/ecommerce/plugin#products).

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end like nav links.

- `Footer`

  Same as above but for the footer of your site.

## Access control

Basic access control is setup to limit access to various content based based on publishing status.

- `users`: Users with the `admin` role can access the admin panel and create or edit content, users with the `customer` role can only access the frontend and the relevant collection items to themselves.
- `pages`: Everyone can access published pages, but only admin users can create, update, or delete them.
- `products` `variants`: Everyone can access published products, but only admin users can create, update, or delete them.
- `carts`: Customers can access their own saved cart, guest users can access any unclaimed cart by ID.
- `addresses`: Customers can access their own addresses for record keeping.
- `transactions`: Only admins can access these as they're meant for internal tracking.
- `orders`: Only admins and users who own the orders can access these. Guests require a valid `accessToken` (sent via email) along with the order's email to view order details.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## User accounts

Registered users can log in to view their order history, manage saved addresses, and track ongoing orders directly from their account dashboard.

## Guests

Guest checkout allows users to complete purchases without creating an account. When a guest places an order:

1. The order is associated with their email address
2. A unique `accessToken` is generated for secure order lookup
3. An order confirmation email is sent containing a secure link to view the order

To look up an order as a guest, users visit `/find-order`, enter their email and order ID, and receive an email with a secure access link. This prevents order enumeration attacks where malicious users could iterate through sequential order IDs to access other customers' order information.

## Layout Builder

Create unique page layouts for any type of content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- Hero
- Content
- Media
- Call To Action
- Archive

Each block is fully designed and built into the front-end website that comes with this template. See [Website](#website) for more details.

## Lexical editor

A deep editorial experience that allows complete freedom to focus just on writing content without breaking out of the flow with support for Payload blocks, media, links and other features provided out of the box. See [Lexical](https://payloadcms.com/docs/rich-text/overview) docs.

## Draft Preview

All products and pages are draft-enabled so you can preview them before publishing them to your website. To do this, these collections use [Versions](https://payloadcms.com/docs/configuration/collections#versions) with `drafts` set to `true`. This means that when you create a new product or page, it will be saved as a draft and will not be visible on your website until you publish it. This also means that you can preview your draft before publishing it to your website. To do this, we automatically format a custom URL which redirects to your front-end to securely fetch the draft version of your content.

Since the front-end of this template is statically generated, this also means that pages, products, and projects will need to be regenerated as changes are made to published documents. To do this, we use an `afterChange` hook to regenerate the front-end when a document has changed and its `_status` is `published`.

For more details on how to extend this functionality, see the official [Draft Preview Example](https://github.com/payloadcms/payload/tree/examples/draft-preview).

## Live preview

In addition to draft previews you can also enable live preview to view your end resulting page as you're editing content with full support for SSR rendering. See [Live preview docs](https://payloadcms.com/docs/live-preview/overview) for more details.

## On-demand Revalidation

We've added hooks to collections and globals so that all of your pages, products, footer, or header changes will automatically be updated in the frontend via on-demand revalidation supported by Nextjs.

> Note: if an image has been changed, for example it's been cropped, you will need to republish the page it's used on in order to be able to revalidate the Nextjs image cache.

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo) for complete SEO control from the admin panel. All SEO data is fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Search

This template comes with SSR search features can easily be implemented into Next.js with Payload. See [Website](#website) for more details.

## Orders and Transactions

Transactions are intended for keeping a record of any payment made, as such it will contain information regarding an order or billing address used or the payment method used and amount. Only admins can access transactions.

An order is created only once a transaction is successfully completed. This is a record that the user who completed the transaction has access so they can keep track of their history.

### Guest Order Access

Guest users can securely access their orders through the `/find-order` page:

1. Guest enters their email address and order ID
2. If the order exists and matches the email, an access link is sent to their email
3. The link contains a secure `accessToken` that grants temporary access to view the order

This email verification flow prevents unauthorized access to order details. The `accessToken` is a unique UUID generated when the order is created and is required (along with the email) to view order details as a guest.

**Security note:** Order confirmation emails should include the order ID so guests can use the "Find Order" feature. The access token is only sent via the verification email to prevent enumeration attacks.

## Currencies

By default the template ships with support only for USD however you can change the supported currencies via the [plugin configuration](https://payloadcms.com/docs/ecommerce/plugin#currencies). You will need to ensure that the supported currencies in Payload are also configured in your Payment platforms.

## Stripe

By default we ship with the Stripe adapter configured, so you'll need to setup the `secretKey`, `publishableKey` and `webhookSecret` from your Stripe dashboard. Follow [Stripe's guide](https://docs.stripe.com/get-started/api-request?locale=en-GB) on how to set this up.

## Tests

We provide automated tests out of the box for both E2E and Int tests along with this template. They are being run in our CI to ensure the stability of this template over time. You can integrate them into your CI or run them locally as well via:

To run Int tests wtih Vitest:

```bash
pnpm test:int
```

To run E2Es with Playwright:

```bash
pnpm test:e2e
```

or

```bash
pnpm test
```

To run both.

## Jobs and Scheduled Publish

We have configured [Scheduled Publish](https://payloadcms.com/docs/versions/drafts#scheduled-publish) which uses the [jobs queue](https://payloadcms.com/docs/jobs-queue/jobs) in order to publish or unpublish your content on a scheduled time. The tasks are run on a cron schedule and can also be run as a separate instance if needed.

> Note: When deployed on Vercel, depending on the plan tier, you may be limited to daily cron only.

## Website

This template includes a beautifully designed, production-ready front-end built with the [Next.js App Router](https://nextjs.org), served right alongside your Payload app in a instance. This makes it so that you can deploy both your backend and website where you need it.

Core features:

- [Next.js App Router](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- [Payload Admin Bar](https://github.com/payloadcms/payload/tree/main/packages/admin-bar)
- [TailwindCSS styling](https://tailwindcss.com/)
- [shadcn/ui components](https://ui.shadcn.com/)
- User Accounts and Authentication
- Fully featured blog
- Publication workflow
- Dark mode
- Pre-made layout building blocks
- SEO
- Search
- Live preview
- Stripe payments

### Cache

Although Next.js includes a robust set of caching strategies out of the box, Payload Cloud proxies and caches all files through Cloudflare using the [Official Cloud Plugin](https://www.npmjs.com/package/@payloadcms/payload-cloud). This means that Next.js caching is not needed and is disabled by default. If you are hosting your app outside of Payload Cloud, you can easily reenable the Next.js caching mechanisms by removing the `no-store` directive from all fetch requests in `./src/app/_api` and then removing all instances of `export const dynamic = 'force-dynamic'` from pages files, such as `./src/app/(pages)/[slug]/page.tsx`. For more details, see the official [Next.js Caching Docs](https://nextjs.org/docs/app/building-your-application/caching).

## Development

To spin up this example locally, follow the [Quick Start](#quick-start). Then [Seed](#seed) the database with a few pages, posts, and projects.

### Working with Postgres

Postgres and other SQL-based databases follow a strict schema for managing your data. In comparison to our MongoDB adapter, this means that there's a few extra steps to working with Postgres.

Note that often times when making big schema changes you can run the risk of losing data if you're not manually migrating it.

#### Three databases, one shared codebase

| Environment | Database | Schema sync mechanism |
|---|---|---|
| **Local** (your laptop) | Docker Postgres (`pnpm db:up`) | Migrations only. Payload schema push is disabled everywhere. |
| **Preview** (Neon) | Neon DB linked to Vercel preview | Migrations only - must be run manually with `pnpm sync-db:preview`. |
| **Production** (Neon) | Neon DB linked to Vercel prod | Migrations only - must be run manually with `pnpm sync-db:prod`. |

Each database is independent. Migration files in `src/migrations/` are the **shared source of truth** that lets every database catch up to the schema your code expects. Do not rely on Payload/Drizzle dev push for schema changes; `payload.config.ts` sets `push: false` on purpose.

#### Schema change workflow

Whenever you add, remove, or rename a Payload field/collection/global, follow these four steps:

```bash
# 1. Generate a migration file that captures the schema change:
pnpm payload migrate:create
#    READ the generated file in src/migrations/ before committing.
#    If local migration history is stale, it may include too much. Trim it
#    down to only the statements that describe your change.

# 2. Apply the migration locally and test the app/admin UI.
pnpm payload migrate

# 3. Commit + push. Wait for the Vercel preview build to go green.

# 4. Sync the hosted databases. These run `payload migrate` AND the
#    page-content bootstrap idempotently, in one step:
pnpm sync-db:preview
#    verify the change on the preview URL, then:
pnpm sync-db:prod
```

> **Known gap (early dev only):** between steps 3 and 4, the preview deploy is technically broken - new code expects the new schema but the Neon DB hasn't been migrated yet. Once the schema stabilizes, wire `migrate:vercel` into the `prebuild` step so it auto-runs on Vercel deploys. Don't do that yet - the interactive prompts during destructive changes still need a human (see `--force-accept-warning` discussion below).

#### Authoring a migration locally

```bash
pnpm payload migrate:create
```

This compares your code's schema against the existing migration files (and the local DB's `payload_migrations` table) and writes a new file under `src/migrations/`. Always read it before committing.

##### `migrate:create` can over-include when local history is stale

This project previously allowed local Payload dev schema push. A database touched by that old behavior can have tables that match code while `payload_migrations` does not fully reflect the migration files. When that happens, `migrate:create` may regenerate "everything not yet tracked" - sometimes thousands of lines describing tables that already exist elsewhere.

When this happens:

1. **Hand-edit the generated `.ts`** to keep only the SQL that describes your real change. Match the convention used by existing migrations like `20260430_030000_add_flavor_rotations.ts`.
2. **Rename the file** to a descriptive `_add_<thing>.ts` suffix (e.g., `20260501_212728_add_page_content_globals.ts`).
3. **Update `src/migrations/index.ts`** to point at the renamed file.
4. **Delete the matching auto-generated `.json` snapshot** if it appeared.

For purely additive changes (a new field, a new global), the part you keep is usually a single `CREATE TABLE` or `ALTER TABLE ADD COLUMN` plus the matching `DROP` in `down()`.

If your local Docker DB is disposable, the cleanest fix for stale local migration history is to reset the local Postgres volume, restart Docker Postgres, and run the committed migrations from scratch:

```bash
pnpm db:down
docker compose down -v
pnpm db:up
pnpm payload migrate
```

Only do this when you are okay losing local-only rows, uploads metadata, local admin users, and seed data. Preview and Production are not affected by this local Docker reset.

#### Applying migrations to Neon

```bash
pnpm payload migrate
```

This walks `src/migrations/` and applies anything not yet recorded in the target DB's `payload_migrations` table. To target preview or production, use the wrapper scripts:

```bash
pnpm sync-db:preview     # vercel env run -e preview -- (migrate + bootstrap page content)
pnpm sync-db:prod        # vercel env run -e production -- (migrate + bootstrap page content)
```

Those wrappers rely on `vercel login` + `vercel link` having been run once. They use `vercel env run` to inject the right Neon connection string for the chosen environment, so no manual copy-paste of secrets is needed.

##### `.env.local` and `vercel env run`

`vercel env run -e preview -- ...` and `vercel env run -e production -- ...` are the correct way to run one-off commands against hosted Vercel environments. However, local `.env.local` can still be loaded by the CLI or child process. If `.env.local` contains `DATABASE_URL=postgresql://...127.0.0.1...`, a naive config that blindly prefers `DATABASE_URL` can accidentally target local Docker instead of Neon.

This project guards against that in `src/utilities/resolveDatabaseURL.ts`: when `VERCEL=1` and `DATABASE_URL` points at `localhost`, `127.0.0.1`, or `::1`, the app ignores that local URL and uses `NEON_POSTGRES_URL` / `NEON_DATABASE_URL` instead. Keep local-only `DATABASE_URL` values in `.env.local`, but do not remove the resolver guard.

##### Sensitive env var caveat

`vercel env run` cannot pull variables marked **Sensitive** in the Vercel dashboard. This project's `payload.config.ts` normally falls back from `DATABASE_URL` to `NEON_POSTGRES_URL` to `NEON_DATABASE_URL`, so even if production's `DATABASE_URL` is Sensitive, the script still works because `NEON_DATABASE_URL` is pullable. If both are Sensitive, you'll need to either downgrade one in the Vercel UI, or paste a connection string directly:

```bash
DATABASE_URL='postgresql://neondb_owner:...' pnpm payload migrate
```

(Single quotes recommended so the shell doesn't choke on special characters in the password.)

##### `--force-accept-warning` is dangerous

Some destructive schema diffs (renames, dropped columns, type changes that can lose data) trigger an interactive Y/N prompt. **Do not blindly add `--force-accept-warning` to automated migrate runs** - picking the wrong default can drop production data silently. The right pattern is to answer the prompts when generating the migration locally (`migrate:create`), inspect the resulting SQL, then commit. Once the file is committed, `pnpm payload migrate` is non-interactive because all decisions are baked into the file.

#### Page-content globals (`pnpm bootstrap:page-content`)

The hero copy on `/blog` and `/discussion-board` is editable from `/admin → Globals → Blog Page Content / Discussion Board Content`. The first time a fresh DB has these tables (after `migrate`), the rows are empty. `pnpm bootstrap:page-content` populates them with the defaults defined in `src/globals/BlogPageContent.ts` and `src/globals/DiscussionBoardContent.ts`.

The script is idempotent: it only fills empty fields, never overwrites editor-set values. Safe to re-run.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

### Seed

To seed the database with a few pages, products, and orders you can click the 'seed database' link from the admin panel.

The seed script will also create a demo user for demonstration purposes only:

- Demo Customer
  - Email: `customer@example.com`
  - Password: `password`

> **NOTICE: `pnpm seed` is destructive.** It drops the current database and re-imports cookies, products, posts, media, etc. from scratch. Only run it on a fresh project or one whose data you can afford to lose. The hand-editable hero copy on `/blog` and `/discussion-board` is **not** wiped by `pnpm seed` — it lives in two separate globals and is bootstrapped by `pnpm bootstrap:page-content`, which is idempotent and safe to re-run. For prod-safe content top-ups, use `pnpm seed:prod` (calls `seedProduction`, additive only).

## Production

To run Payload in production, you need to build and start the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.
1. When you're ready to go live, see Deployment below for more details.

### Deploying to Vercel

This template can also be deployed to Vercel for free. You can get started by choosing the Vercel DB adapter during the setup of the template or by manually installing and configuring it:

```bash
pnpm add @payloadcms/db-vercel-postgres
```

```ts
// payload.config.ts
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

export default buildConfig({
  // ...
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  // ...
```

We also support Vercel's blob storage:

```bash
pnpm add @payloadcms/storage-vercel-blob
```

```ts
// payload.config.ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export default buildConfig({
  // ...
  plugins: [
    vercelBlobStorage({
      collections: {
        [Media.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
  // ...
```

### Vercel environment security

For the full production deployment checklist, see [Production Deployment Setup](./documentation/getting-started/production-deployment.md).

Before creating or promoting a production deployment, run:

```bash
pnpm run check:env-security
```

On Vercel production builds this runs in strict mode through `prebuild` and fails if production-critical secrets are missing, still local-only, or still placeholders. To force the same behavior locally, run `pnpm exec cross-env CHECK_ENV_SECURITY_STRICT=true pnpm run check:env-security`.

Mark these Vercel environment variables as Sensitive and rotate any real values that were previously stored as non-sensitive variables: `PAYLOAD_SECRET`, `DATABASE_URL`, `PREVIEW_SECRET`, `BLOB_READ_WRITE_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOKS_SIGNING_SECRET`, `BOOTSTRAP_ADMIN_PASSWORD`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, and `RESEND_API_KEY`.

Do not mark intentionally public browser values as sensitive: `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Anything with `NEXT_PUBLIC_` is bundled for the browser and must never contain a secret.

### Self-hosting

Before deploying your app, you need to:

1. Ensure your app builds and serves in production. See [Production](#production) for more details.
2. You can then deploy Payload as you would any other Node.js or Next.js application either directly on a VPS, DigitalOcean's Apps Platform, via Coolify or more. More guides coming soon.

You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
