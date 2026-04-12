# 2026-04-10: Payload Auth Part 2, Split `admins` and `customers`

## Table of contents

- [Why this Part 2 exists](#why-this-part-2-exists)
- [The core idea](#the-core-idea)
- [What the `admins` collection should mean](#what-the-admins-collection-should-mean)
- [What the `customers` collection should mean](#what-the-customers-collection-should-mean)
- [What changes in this repo if you split](#what-changes-in-this-repo-if-you-split)
- [What happens if Orien is both an admin and a buyer?](#what-happens-if-orien-is-both-an-admin-and-a-buyer)
- [The two serious choices for "Orien is both"](#the-two-serious-choices-for-orien-is-both)
- [Which option I recommend](#which-option-i-recommend)
- [Does splitting break ecommerce?](#does-splitting-break-ecommerce)
- [My recommendation for this repo](#my-recommendation-for-this-repo)

## Why this Part 2 exists

Part 1 explained the auth terms.

This Part 2 is the architecture note for the model you chose: separate `admins` and separate `customers`. The goal is to make the responsibilities of each collection obvious, make the repo impact concrete, and answer the real-world identity question of what happens when the same human needs both admin access and customer behavior.

Part 1 lives here:

- [03-payload-auth-part-1-bootstrap-explained.md](./03-payload-auth-part-1-bootstrap-explained.md)

## The core idea

The split model means `admins` is only for people who can access `/admin`, while `customers` is only for people who buy things on the public website. This is the model Payload explicitly supports in its admin docs: `admin.user: 'admins'` for the admin panel, with a separate customer collection for end users.

Official docs:

- [Admin Panel docs](https://payloadcms.com/docs/admin/overview)
- [Ecommerce Overview](https://payloadcms.com/docs/ecommerce/overview)

## What `storefront` means

`Storefront` means:

- the public customer-facing side of the site

In this repo, that includes flows like:

- home page
- product pages
- cart
- checkout
- customer login
- customer account

It does **not** mean the Payload admin panel.

## What the `admins` collection should mean

The `admins` collection should be the auth-enabled collection used by the admin panel, the collection behind `admin.user`, and the place for owner or staff accounts. In practice, it should hold things like `email`, `password`, `name`, and maybe an internal `staffRole` later. It should not carry carts, orders, addresses, or other customer-facing ecommerce profile concerns. One useful simplification of this split is that if every document in `admins` is already an admin account, you may not need a general `admin` role flag at all. You might still want internal staff roles later, but that is a different question from customer-vs-admin separation.

## What the `customers` collection should mean

The `customers` collection should be the auth-enabled collection used by the public website, the collection used by customer signup and customer login, and the collection linked to ecommerce data. In the ecommerce plugin config, this is the collection behind `customers.slug: 'customers'`. It should contain things like `email`, `password`, `name`, maybe `phone`, maybe marketing preferences, and the ecommerce joins for orders, cart, and addresses. It should not contain admin access flags or staff-only operational data.

## Why this split is cleaner

With this split, public signup never touches the admin collection, admin auth and customer auth stop sharing the same documents, ecommerce data belongs only to customer identities, and admin login policy can be stricter than customer login policy. That cleaner separation is the main benefit.

## What this would look like conceptually

This is architecture sketching, not final code.

### `admins`

```ts
export const Admins: CollectionConfig = {
  slug: 'admins',
  auth: {
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    create: adminOnlyOrBootstrapOnly,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'staffRole', type: 'select', options: ['owner', 'manager', 'editor'] },
  ],
}
```

### `customers`

```ts
export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: {
    verify: true,
    maxLoginAttempts: 20,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    create: customerSignupOnly,
    read: customerSelfOrAdmin,
    update: customerSelfOrAdmin,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'phone', type: 'text' },
    // joins for orders, cart, addresses
  ],
}
```

## What changes in this repo if you split

This is a real refactor, but it is very manageable this early.

At minimum, these areas change:

- [payload.config.ts](../../../src/payload.config.ts)
  - `admin.user` moves from `users` to `admins`
- [plugins/index.ts](../../../src/plugins/index.ts)
  - ecommerce `customers.slug` moves from `users` to `customers`
- [Auth provider](../../../src/providers/Auth/index.tsx)
  - customer auth requests move from `/api/users/*` to `/api/customers/*`
- [CreateAccountForm](../../../src/components/forms/CreateAccountForm/index.tsx)
  - customer signup endpoint changes
- [ForgotPasswordForm](../../../src/components/forms/ForgotPasswordForm/index.tsx)
  - customer forgot-password endpoint changes
- [AccountForm](../../../src/components/forms/AccountForm/index.tsx)
  - customer account update endpoint changes
- [login page](../../../src/app/(app)/login/page.tsx)
  - wording and assumptions update
- admin access helpers
  - some current role-based helpers will need redesign because the admin/customer split is now expressed by collection, not only by role tags
- generated types
  - `payload-types.ts` must be regenerated
- tests
  - any tests assuming customer auth is `/api/users/*` must be updated

## What happens if Orien is both an admin and a buyer?

This is the most practical question.

If you split `admins` and `customers`, then the cleanest default model is:

- one admin record
- one customer record

So yes:

- the same real human can have two records

Example:

- `admins`: Orien the owner/admin
- `customers`: Orien the buyer

That means:

- Orien logs into `/admin` with the admin account
- Orien logs into the public site with the customer account
- Orien's cart, orders, and addresses live on the customer record only

This is not a bug. It is usually the cleanest separation.

## The two serious choices for "Orien is both"

There are really two options worth considering.

### Option A: separate accounts, no linking

- one record in `admins`
- one record in `customers`
- no explicit relation between them

Pros:

- simplest implementation
- easiest security boundary
- easiest to reason about
- easiest to debug

Cons:

- the same human has two identities in the system
- no built-in connection between those identities

This is the best default if you want the split without overengineering it.

### Option B: separate accounts, explicitly linked

- one record in `admins`
- one record in `customers`
- relationship field connecting them

Pros:

- still keeps admin/customer separation
- lets you know the same human owns both accounts
- can support admin UX like "view linked customer profile"

Cons:

- more schema complexity
- more migration complexity
- more UI and logic complexity
- not necessary unless you already know you need that relationship

## Which option I recommend

For this repo, I recommend:

- Option A first

Meaning:

- separate admin account
- separate customer account
- no linking initially

Why I recommend it:

- your security boundary stays clean
- implementation stays simple
- you can always add linking later if the business actually needs it

## Can the same email be used in both collections?

Usually yes, if uniqueness is enforced per collection and not globally.

That means:

- `orien@example.com` can exist once in `admins`
- and also once in `customers`

But even if the email matches, those are still two different records with two different purposes.

## Does splitting break ecommerce?

No.

Payload's ecommerce model is already customer-centered.

Official docs say:

- customers can be any user collection in your app
- customers are linked to carts, orders, and addresses

Official docs:

- [Ecommerce Overview](https://payloadcms.com/docs/ecommerce/overview)

So the split actually matches ecommerce more cleanly:

- carts, orders, and addresses belong to customers
- admin accounts stop carrying ecommerce-specific baggage

## What gets simpler if you split

- customer signup is clearly separated from admin auth
- admin access becomes "can this person access the admins collection?"
- ecommerce joins sit only on customers
- your mental model becomes much cleaner

## What gets harder if you split

- you now have two auth-enabled collections in the app
- customer auth code must be rewired
- the same human may have two separate accounts
- tests and generated types need updating

## My recommendation for this repo

Because you said you are still early in development, I think this is the right time to split.

My recommended shape is:

1. create `admins`
2. create `customers`
3. set `admin.user` to `admins`
4. point ecommerce customers to `customers`
5. move public auth flows onto `customers`
6. treat admin accounts and customer accounts as separate identities

If later you discover a real need to link admin and customer identities for the same human, add that as a second step instead of building it on day one.
