# Production Deployment Setup

This guide records the production setup flow for the Baked with Blessings Vercel deployment.

It is intentionally specific to this app, not a generic Payload CMS guide.

## What Gets Deployed

Vercel production deploys come from the repository production branch, currently `main`.

The production custom domain is:

```txt
https://bakedwithblessings.com
```

If the domain says it is configured but has no deployment, the fix is not DNS. The fix is a successful Vercel Production deployment.

## Required Services

Production currently depends on:

- Vercel for hosting and environment variables
- Neon for Postgres
- Vercel Blob for Payload media uploads
- Resend for app email
- Twilio Verify for customer phone verification
- Stripe for checkout

Preview and Production should not share a database. Preview/Development can use the preview Neon integration. Production should use a separate production Neon integration scoped only to Production.

## Vercel Production Environment Variables

Set these in Vercel Project Settings -> Environment Variables with the `Production` environment selected.

Core app:

```txt
PAYLOAD_SECRET
PREVIEW_SECRET
PAYLOAD_PUBLIC_SERVER_URL=https://bakedwithblessings.com
NEXT_PUBLIC_SERVER_URL=https://bakedwithblessings.com
NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY=US
```

Database:

```txt
DATABASE_URL
NEON_POSTGRES_URL
NEON_DATABASE_URL
```

The app normally reads the database in this order:

```txt
DATABASE_URL || NEON_POSTGRES_URL || NEON_DATABASE_URL
```

There is one safety exception for local one-off commands. `vercel env run -e production -- ...` injects Production env vars, but local `.env.local` can still be loaded by the child process. If that local file has `DATABASE_URL` pointing at `localhost`, `127.0.0.1`, or `::1`, the app ignores it when `VERCEL=1` and uses `NEON_POSTGRES_URL` / `NEON_DATABASE_URL` instead. This prevents Production migration and seed commands from accidentally targeting local Docker.

The Neon/Vercel integration creates many `NEON_*` variables on purpose. They are different connection-string formats and individual pieces for different tools:

- `NEON_POSTGRES_URL`: normal pooled Postgres URL
- `NEON_DATABASE_URL`: another supported connection URL
- `NEON_POSTGRES_URL_NON_POOLING`: direct/non-pooled connection
- `NEON_POSTGRES_PRISMA_URL`: Prisma-oriented connection URL
- `NEON_PGHOST`, `NEON_PGUSER`, `NEON_PGPASSWORD`, etc.: individual connection parts

This app only needs one usable connection URL, but keeping the generated values is fine.

Blob:

```txt
BLOB_READ_WRITE_TOKEN
```

Email:

```txt
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_FROM_NAME=Baked with Blessings
CONTACT_NOTIFICATION_TO
ORDER_NOTIFICATION_TO
```

Twilio:

```txt
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID
```

Admin bootstrap:

```txt
BOOTSTRAP_ADMIN_EMAIL
BOOTSTRAP_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_NAME
```

`BOOTSTRAP_ADMIN_PASSWORD` is used by the one-time admin bootstrap script. It is a warning in the build guard if it is short, not a deployment blocker.

## Stripe During First Production Deploy

Stripe can require a working website before live keys are available. For the first production deploy, use Stripe test-mode values:

```txt
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOKS_SIGNING_SECRET=whsec_...
ALLOW_TEST_STRIPE_IN_PRODUCTION=true
```

This lets the site deploy so the working production URL can be submitted to Stripe.

Before accepting real payments, replace the Stripe values with live-mode values:

```txt
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOKS_SIGNING_SECRET=whsec_...
ALLOW_TEST_STRIPE_IN_PRODUCTION=false
```

Then redeploy Production.

## Build Guard

The production environment check is custom repo code:

```txt
scripts/check-env-security.ts
```

It is wired through `package.json`:

```json
"prebuild": "pnpm run check:no-shop-route && pnpm run check:env-security"
```

It is not a Payload CMS feature. It exists so Vercel fails fast when required production values are missing, local-only, or obvious placeholders.

Run it locally:

```bash
pnpm.cmd run check:env-security
```

Warnings should be reviewed, but only errors block the build.

## First Production Database Setup

After the code with `seed:prod` has been merged into `main` and Vercel Production has a successful deployment, initialize the production database from the project root:

```bash
pnpm.cmd exec vercel env run -e production -- pnpm.cmd payload migrate
pnpm.cmd exec vercel env run -e production -- pnpm.cmd bootstrap:admin
pnpm.cmd exec vercel env run -e production -- pnpm.cmd seed:prod
```

Use `seed:prod` for Production. Do not use the generic `seed` command against Production unless you intentionally want the broader demo/starter data.

The production seed:

- seeds products, product media, catering products, and flavor rotation data
- seeds the two blog posts
- seeds the Blessings Network starter data
- creates one example review with a business response
- creates two discussion topics:
  - `What is there to do in Minnesota?`
  - `What are your favorite dessert, bakery, or cafe places in the Twin Cities, and why?`

## Normal Deploy Flow

1. Make code changes on a branch.
1. Run focused checks locally.
1. Push the branch and merge to `main`.
1. Wait for the Vercel Production deployment to become `Ready`.
1. If migrations changed, run:

```bash
pnpm.cmd exec vercel env run -e production -- pnpm.cmd payload migrate
```

Payload schema push is disabled everywhere (`push: false`). Local, Preview, and Production schema changes all go through committed migration files.

1. Verify `https://bakedwithblessings.com`.

## Local Env Pulling

Pulling Production env vars writes secrets into a local ignored file. Do not commit it.

```bash
pnpm.cmd exec vercel env pull .env.production.local --environment=production --yes
```

`.env*` files are ignored except `.env.example`.
