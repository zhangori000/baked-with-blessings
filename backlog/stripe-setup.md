# Stripe Setup

## Current state

The project includes placeholder Stripe values in `.env` so local development can start before real payments are configured.

Current placeholders:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOKS_SIGNING_SECRET`

## Before real payments

Replace the placeholders with real Stripe test keys first, then production keys later.

## Apple Pay note

The checkout uses Stripe Payment Element with automatic payment methods. That means the integration can support wallets like Apple Pay, but Apple Pay still depends on Stripe-side setup and domain registration.

## Follow-up tasks

- add real Stripe test keys
- verify webhook forwarding locally
- register domains for Apple Pay and other wallet methods when moving past localhost
- decide whether guest checkout should recover orders by email, phone, or both
