# 2026-04-10: Payload Auth Part 1, Bootstrap Terms and Safer Signup Explained

## Table of contents

- [Why this note exists](#why-this-note-exists)
- [The big picture](#the-big-picture)
- [What does "storefront" mean?](#what-does-storefront-mean)
- [What is Payload `auth`?](#what-is-payload-auth)
- [What is the built-in first admin user route?](#what-is-the-built-in-first-admin-user-route)
- [What is "admin bootstrap"?](#what-is-admin-bootstrap)
- [What is a hook?](#what-is-a-hook)
- [What is `beforeChange`?](#what-is-beforechange)
- [What are `roles`?](#what-are-roles)
- [What is `publicAccess.ts`?](#what-is-publicaccessts)
- [What is whitelisting?](#what-is-whitelisting)
- [What is `auth.verify`?](#what-is-authverify)
- [What is CSRF?](#what-is-csrf)
- [What is CORS?](#what-is-cors)
- [What is an email adapter?](#what-is-an-email-adapter)

## Why this note exists

This note explains the Payload-specific terms that came up while talking about:

- the first admin user
- public signup
- roles
- hooks
- access control
- email verification
- CSRF / CORS
- whether to split admins and customers into separate collections

This is written against the current repo at `learning-payload-cms/baked-with-blessings`.

## The big picture

Right now, your app has one auth-enabled collection called `users`.

That one collection is currently doing two jobs:

- admin users who can log into the Payload admin panel
- customer users who sign up on the storefront

That is possible in Payload, but it makes the security story more important, because the same collection is serving both your staff/admin use case and your public customer use case.

## What does "storefront" mean?

`Storefront` means:

- the public customer-facing part of the website

In this repo, that means pages and flows like:

- home page
- product pages
- cart
- checkout
- customer login
- customer account page

It does **not** mean the Payload admin panel.

So when I say:

- "storefront customer signup"

I mean:

- the signup flow regular customers use on the public website

## What is Payload `auth`?

`auth` is not a separate library you import. It is a feature of a Payload collection.

When a collection has `auth` enabled, Payload adds authentication behavior to that collection.

Official docs: [Authentication Overview](https://payloadcms.com/docs/authentication/overview)

What Payload says it adds:

- account creation
- login
- logout
- password reset
- auth-related emails like verification and password reset

In other words:

- a normal collection is just data
- an auth-enabled collection is data plus login/account behavior

In your repo, the `users` collection is auth-enabled here:

- [Users collection](../../../src/collections/Users/index.ts)

Specifically:

- [Users collection `auth`](../../../src/collections/Users/index.ts)

Right now your `auth` config is minimal:

- token expiration is set
- email verification is not enabled yet
- lockout settings are not configured yet

## What is the built-in first admin user route?

Payload has built-in admin routes.

Official docs: [Admin Panel docs](https://payloadcms.com/docs/admin/overview)

Payload documents this built-in admin route:

- `createFirstUser` with default route `/create-first-user`

Inside your app, because your admin panel is mounted at `/admin`, that becomes:

- `/admin/create-first-user`

What "route" means here:

- a route is just a URL path that your app knows how to respond to

So yes:

- if you type `/admin/create-first-user` in the browser
- you are visiting a real built-in Payload admin route

What happens at a high level:

1. your browser requests the URL `/admin/create-first-user`
2. Payload recognizes that URL as a built-in admin page
3. Payload renders the "create the first admin user" page
4. when you submit that page, Payload handles the request on the server and creates the first admin user through its built-in auth/admin flow

The important clarification is:

- this is not "you typed a URL and directly called some random function in your repo"
- this is "you visited a built-in Payload page, and Payload's server handled the form submission behind that page"

So the browser is interacting with:

- a built-in Payload admin page

and that page is backed by:

- built-in Payload server-side auth/admin logic

That is what I mean by:

- Payload's built-in admin-first-user flow

## What is "admin bootstrap"?

`Bootstrap` means:

- the one-time setup needed to get a system into its initial usable state

`Admin bootstrap` means:

- safely creating the initial admin account

That is a special moment in the system's life because before the first admin exists, nobody can manage the app properly.

## What does "out of band" mean?

`Out of band` means:

- outside the public customer-facing signup flow

Examples:

- a seed script run from your terminal
- a local-only script
- a deployment setup step
- a private server-side route that regular customers cannot hit

It does **not** mean:

- a normal browser signup form open to the public internet

## What is a hook?

Payload hooks are server-side functions that run automatically at specific moments in the document lifecycle.

Official docs: [Hooks Overview](https://payloadcms.com/docs/hooks/overview)

Payload describes hooks as a way to run side effects during precise lifecycle moments.

Common examples:

- modify data before save
- send email after change
- enforce business rules
- integrate with third-party systems

Hooks run on the server, not in the browser.

## What is `beforeChange`?

`beforeChange` means:

- run this logic before a document is created or updated

Payload docs explicitly say `beforeChange` runs when a document is created or updated.

In your repo, the `roles` field uses a `beforeChange` hook:

- [Users collection](../../../src/collections/Users/index.ts)

The hook attached is:

- [ensureFirstUserIsAdmin hook](../../../src/collections/Users/hooks/ensureFirstUserIsAdmin.ts)

That means:

- before the `roles` field is finally saved
- Payload runs that hook
- the hook can change the value

## What are `roles`?

`Roles` are labels you store on a user document so your code can decide what that user is allowed to do.

In your repo, `roles` is a field on the `users` collection:

- [Users collection](../../../src/collections/Users/index.ts)

Current allowed values:

- `admin`
- `customer`

Plain English meaning:

- `admin` means the user is allowed to perform admin-level actions
- `customer` means the user is a storefront customer

These roles are checked in access functions like:

- [checkRole utility](../../../src/access/utilities.ts)
- [isAdmin access helper](../../../src/access/isAdmin.ts)

## What does "append `admin` to roles" mean?

It means:

- if the current `roles` value does not already contain `admin`
- add `admin` into the array before saving

That is what your hook does here:

- [ensureFirstUserIsAdmin hook](../../../src/collections/Users/hooks/ensureFirstUserIsAdmin.ts)

Current behavior:

1. a new user is being created
2. the hook looks up how many users exist
3. if there are zero users
4. it adds `admin` to the roles array

So the first created user document becomes an admin.

## What is `publicAccess.ts`?

This file is here:

- [publicAccess.ts](../../../src/access/publicAccess.ts)

The file currently says:

- allow access by returning `true`

In plain English:

- anyone is allowed

That is why this line matters in the users collection:

- [Users collection](../../../src/collections/Users/index.ts)

Specifically, the `create` access rule is:

- `create: publicAccess`

That means:

- anyone can create a `users` document through that collection's API

This is why the first-user / public-signup interaction is risky.

## What does `create` mean in a collection access block?

In Payload, `create` is the rule that controls:

- who is allowed to create a new document in this collection

So this:

- `create: publicAccess`

means:

- anyone can create a user

while something like:

- `create: adminOnly`

would mean:

- only admins can create a user

This is server-side access control. It is not just UI behavior.

## What is whitelisting?

`Whitelisting` means:

- only accept the specific fields you intentionally allow

For public customer signup, a whitelist might be:

- `email`
- `password`
- `passwordConfirm`
- maybe `name`

Not allowed from public signup:

- `roles`
- `orders`
- `cart`
- hidden/internal admin-only fields

This matters because the browser form is not a security boundary.

Even if your UI does not show a `roles` input, a malicious person can still try to send JSON directly to your API.

Example of a malicious request body:

```json
{
  "email": "attacker@example.com",
  "password": "secret",
  "roles": ["admin"]
}
```

That is what `client-supplied roles` means:

- the client tries to tell the server what role they should have

The server should ignore or reject that.

## Does whitelisting mean people cannot modify roles, orders, and cart even through direct API calls?

That is the goal, yes.

If the server is implemented correctly:

- the client should not be able to set or change `roles`
- the client should not be able to create fake `orders`
- the client should not be able to inject `cart` data arbitrarily

But this only becomes true if the server enforces it.

UI-only restrictions are not enough.

## What is a seed script or local API call for the first admin?

Payload has a Local API.

Official docs: [Local API](https://payloadcms.com/docs/local-api/overview)

Payload describes the Local API as running the same operations as REST/GraphQL directly on your server, and specifically lists:

- seeding data via Node seed scripts

This means you can run server-side code like:

1. start a Node process locally
2. initialize Payload
3. call `payload.create(...)`
4. create the first admin user

This is safer than public signup because it does not expose the first-admin action to the public internet.

Important Local API detail:

Official docs: [Respecting Access Control with Local API Operations](https://payloadcms.com/docs/local-api/access-control)

Payload says:

- local API operations override access control by default

That is useful for admin bootstrap because:

- your one-time setup script can create the initial admin even if normal public access rules would not allow it

## What is `auth.verify`?

Official docs: [Authentication Overview](https://payloadcms.com/docs/authentication/overview) and [Authentication Emails](https://payloadcms.com/docs/authentication/email)

`auth.verify` means:

- require email verification before the user is allowed to log in

Payload docs say:

- `verify: true` requires email verification before being allowed to authenticate

So the flow becomes:

1. user signs up
2. Payload sends verification email
3. user clicks verification link
4. user can log in

This is helpful for public customer signup.

## About `maxLoginAttempts` and `lockTime`

Payload supports both:

- `maxLoginAttempts`
- `lockTime`

Official docs:

- [Authentication Overview](https://payloadcms.com/docs/authentication/overview)
- [Preventing Production API Abuse](https://payloadcms.com/docs/production/preventing-abuse)

Payload's docs say:

- `maxLoginAttempts` is how many failed logins are allowed
- `lockTime` is how long the lockout lasts in milliseconds
- Payload recommends a "reasonable but low number"

You said you want:

- `maxLoginAttempts: 20`

That is your product/security tradeoff to make.

My opinion:

- `20` is much more forgiving for humans
- it is also much more forgiving for attackers

So if you choose `20`, do it deliberately knowing the tradeoff.

If you ever split admins and customers into separate collections, a better setup would be:

- admins: lower threshold
- customers: higher threshold

## What is CSRF?

Official docs:

- [Preventing Production API Abuse](https://payloadcms.com/docs/production/preventing-abuse)
- [Payload Config](https://payloadcms.com/docs/configuration/overview)
- [Authentication Cookies](https://payloadcms.com/docs/authentication/cookies)

CSRF means:

- Cross-Site Request Forgery

Plain English:

- another website tries to trick a logged-in browser into sending authenticated requests to your app

Payload's docs say CSRF protection verifies request authenticity to prevent malicious actions from another site using an authorized user's browser.

In config, Payload defines `csrf` as:

- a whitelist array of URLs to allow Payload to accept cookies from

This matters because your auth flow uses cookies.

## What is CORS?

Official docs:

- [Payload Config](https://payloadcms.com/docs/configuration/overview)
- [Preventing Production API Abuse](https://payloadcms.com/docs/production/preventing-abuse)

CORS means:

- Cross-Origin Resource Sharing

Plain English:

- which browser origins are allowed to make requests to your API

Payload defines `cors` as a setting for accepting incoming requests from given domains.

Simple distinction:

- CSRF is about preventing malicious authenticated actions from another site
- CORS is about which origins are allowed to call your API

Both matter in production.

## What is an email adapter?

Official docs: [Email Functionality](https://payloadcms.com/docs/email/overview)

Payload says:

- the email adapter is passed into the `email` property of the Payload config
- that allows Payload to send auth-related emails like password reset and new user verification

So when I say "configure an email adapter," I mean:

- connect Payload to a real email-sending provider

Examples from Payload docs:

- Nodemailer adapter
- Resend adapter

In your repo:

- the email line is currently commented out in [payload.config.ts](../../../src/payload.config.ts)

That means:

- production email sending is not actually configured yet

Without a real email adapter:

- `auth.verify` is not very useful
- forgot-password emails are not production-ready

## Do we need a phone adapter?

Not in the same built-in Payload sense.

Payload has first-class email adapter docs and packages.

Phone/SMS auth usually means:

- choosing an SMS provider
- writing your own OTP flow
- storing and validating verification codes
- handling resend, cooldown, abuse prevention, and delivery failures

That is why phone auth is more custom work.

## What happens if we split admins and customers into separate collections?

Official admin docs say this is a valid architecture:

- `admins` for admin panel users
- `customers` for end users

Official docs:

- [Admin Panel docs](https://payloadcms.com/docs/admin/overview)

Official ecommerce docs also say:

- customers can be any collection of users in your application
- customers are linked to carts, orders, and addresses

Official docs:

- [Ecommerce Overview](https://payloadcms.com/docs/ecommerce/overview)

This means splitting them does **not** ruin ecommerce by itself.

In fact, it can make the domain cleaner:

- admin auth is separate from storefront customer auth
- carts/orders/addresses belong to customers only
- admin panel access belongs to admins only

## If an admin is also a customer, what happens?

If you split `admins` and `customers`, then the cleanest mental model is:

- an admin account is for admin-panel access
- a customer account is for shopping activity like carts, orders, and addresses

So yes:

- the same real human may end up with two records

Example:

- `admins` collection: one record for "Zhang the site owner/admin"
- `customers` collection: one record for "Zhang the buyer/customer"

That is not automatically wrong. It is often the simplest clean separation.

The important point is:

- they are different identities for different purposes

They are not "the same row with fewer permissions."

They are:

- two separate collection documents
- potentially with the same email address
- used in different parts of the app

Common ways to handle this:

### Option 1: totally separate accounts

- admin logs into `/admin` with the admin account
- the same person logs into the storefront with the customer account
- carts and orders belong only to the customer account

This is the simplest implementation.

### Option 2: separate accounts, but linked

- keep separate `admins` and `customers`
- add a relationship field linking them if needed
- useful if you want to know that the same human owns both identities

This adds complexity, but can be useful for reporting or account management.

### Option 3: one collection instead of splitting

- keep a single `users` collection
- let one user have both `admin` and `customer` roles

This avoids duplicate identities, but it is exactly the design that needs more careful hardening.

So the split is cleaner, but the tradeoff is:

- better separation
- more identity/account complexity

## Why splitting still costs real work in this repo

Even though Payload supports the split, your current app is wired around one `users` collection.

Examples:

- [Payload config `admin.user`](../../../src/payload.config.ts)
- [Ecommerce plugin `customers.slug`](../../../src/plugins/index.ts)
- [Auth provider hitting `/api/users/*`](../../../src/providers/Auth/index.tsx)
- [Create account form posting to `/api/users`](../../../src/components/forms/CreateAccountForm/index.tsx)

Today:

- admin login uses `users`
- customer login uses `users`
- ecommerce plugin customers also use `users`

If you split collections, you would likely change to:

- `admin.user: 'admins'`
- ecommerce plugin `customers.slug: 'customers'`
- storefront auth provider and forms from `/api/users/*` to `/api/customers/*`

## What the split refactor would actually touch in this repo

This is not a tiny one-line config change. It is a real refactor.

At minimum, I would expect these areas to change:

- [payload.config.ts](../../../src/payload.config.ts)
  - change `admin.user` from `users` to `admins`
- [plugins/index.ts](../../../src/plugins/index.ts)
  - change ecommerce `customers.slug` from `users` to `customers`
- [Auth provider](../../../src/providers/Auth/index.tsx)
  - storefront auth calls would move from `/api/users/*` to `/api/customers/*`
- [CreateAccountForm](../../../src/components/forms/CreateAccountForm/index.tsx)
  - customer signup endpoint would need to change
- [ForgotPasswordForm](../../../src/components/forms/ForgotPasswordForm/index.tsx)
  - customer forgot-password endpoint would need to change
- [AccountForm](../../../src/components/forms/AccountForm/index.tsx)
  - customer account update endpoint would need to change
- [login page](../../../src/app/(app)/login/page.tsx)
  - copy and assumptions may need updating
- access helpers like:
  - [checkRole utility](../../../src/access/utilities.ts)
  - [isAdmin access helper](../../../src/access/isAdmin.ts)
  - [customerOnlyFieldAccess](../../../src/access/customerOnlyFieldAccess.ts)
  - these would need review because they currently assume one collection with role tags
- generated types:
  - `payload-types.ts` would be regenerated after the schema changes
- tests:
  - anything assuming `/api/users/*` for customer auth would need updating

## Pros of splitting admins and customers

- cleaner mental model
- safer by default
- no public customer signup path touching the admin collection
- different auth policies per collection
- easier to make admins stricter than customers

## Cons of splitting admins and customers

- more refactor work now
- storefront auth provider must be rewired
- account forms and forgot-password flow must be rewired
- any shared access helpers based on `roles` need redesign
- data migration may be needed if you already have real users

## When is splitting worth it?

Splitting is most worth it when:

- you want the cleanest long-term security model
- you want admin auth and customer auth to have different policies
- you do not want public signup anywhere near the admin collection
- you are still early enough that refactoring auth is affordable

Staying with one collection is most worth it when:

- you want less refactor work right now
- you want one identity that can be both admin and customer
- you are willing to harden the shared `users` collection carefully

## What is the practical recommendation right now?

### Option A: safer single-collection setup

Keep `users`, but:

1. remove or gate the first-user-admin hook for production
2. do admin bootstrap out of band
3. keep public signup customer-only
4. ignore or reject client-supplied roles
5. add verification, lockout, CSRF, CORS, email delivery, and bot protection

This is the lowest-churn fix.

### Option B: split admins and customers

Create:

- `admins`
- `customers`

Then:

1. point `admin.user` to `admins`
2. point ecommerce customers to `customers`
3. move storefront auth to `customers`
4. keep admin auth fully separate

This is the cleaner long-term architecture, but it is a larger change.

## The most important risk in the current repo

These two facts together are the dangerous combination:

- [publicAccess.ts](../../../src/access/publicAccess.ts) allows public create
- [ensureFirstUserIsAdmin hook](../../../src/collections/Users/hooks/ensureFirstUserIsAdmin.ts) promotes the first created user to admin

That is why production should not rely on the current first-user behavior.
