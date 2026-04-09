# Payload Settings and Hooks

This file captures practical guidance on Payload app settings, analytics placement, hooks, route handlers, endpoints, and hook context.

## Payload Config Settings

These are app-level settings in `payload.config.ts`. A large brand such as McDonald's could use them like this:

- `admin`: customize admin UI, branding, dashboard, live preview, custom admin components
- `bin`: add custom CLI tasks such as syncing locations or importing menu data
- `editor`: choose the default rich text editor and features for `richText` fields
- `db`: choose the database adapter
- `serverURL`: set the absolute base URL of the app
- `collections`: register repeatable document types such as `menuItems`, `locations`, `promotions`, `news`
- `compatibility`: temporary upgrade flags during version migrations
- `globals`: register singleton documents such as `header`, `footer`, `alertBanner`
- `cors`: allow trusted frontends or tools to call Payload from approved domains
- `localization`: store translated content per locale
- `logger`: send logs to a preferred logger or destination
- `loggingLevels`: tune log verbosity
- `graphQL`: configure GraphQL queries, mutations, limits, and custom extensions
- `cookiePrefix`: avoid cookie collisions across multiple related apps
- `csrf`: whitelist origins that can send cookies safely
- `defaultDepth`: default relationship population depth for queries
- `defaultMaxTextLength`: app-wide text-size guardrail
- `folders`: configure folder behavior for assets or documents
- `queryPresets`: predefined admin-side query filters
- `maxDepth`: hard cap on query relationship depth for safety and performance
- `indexSortableFields`: auto-index sortable top-level fields
- `upload`: base upload behavior such as file handling and defaults
- `routes`: customize where Payload mounts admin and API routes
- `email`: configure email adapter for auth emails, forms, and notifications
- `onInit`: run startup logic after Payload boots
- `debug`: show more detailed debug info in development
- `telemetry`: opt out of Payload telemetry if desired
- `hooks`: root-level hooks such as global error handling
- `plugins`: register reusable feature packages
- `endpoints`: add custom HTTP endpoints to the Payload server
- `custom`: freeform extension point for custom metadata
- `i18n`: admin UI language support
- `secret`: cryptographic secret for auth and encryption workflows
- `sharp`: image resizing, cropping, and focal-point processing
- `typescript`: generated type file configuration

## Analytics and Config

Analytics can touch several settings depending on what "analytics" means:

- `plugins` if analytics is implemented as a reusable plugin
- `hooks` if you want global error tracking or app-level instrumentation
- `endpoints` if you expose a custom analytics ingestion endpoint
- `collections` if you store analytics events or reporting snapshots in Payload
- `graphQL` or `endpoints` if you expose custom reporting queries
- `admin` if editors need analytics dashboards inside the admin panel
- `custom` if you need to stash analytics-specific configuration for your own code

Analytics usually does not live in only one setting. It is often a combination of:

- route handler or custom endpoint to receive or serve analytics data
- hooks to emit tracking when content or orders change
- admin customizations to display reporting
- optional collections to persist derived metrics

## Hooks vs Route Handlers vs Endpoints

Hooks can contain business logic. The important distinction is not "hooks are for data, routes are for business logic." The real distinction is:

- Hook: logic that should run whenever a Payload entity changes or is read, regardless of which entry point triggered it
- Route handler or custom endpoint: logic tied to one specific HTTP request shape, protocol, or workflow

### Good Hook Use Cases

- calculate order totals whenever an `order` document changes
- normalize slugs, phone numbers, or hours before saving
- revalidate Next.js caches after publishing content
- sync menu items or locations to a search index after save or delete
- send confirmation emails after an order or form submission is created
- recalculate aggregate metrics after a write

### Good Route or Endpoint Use Cases

- accept and verify a Stripe webhook signature
- return an XML sitemap response
- parse request query params for a report or export
- orchestrate a custom checkout flow
- combine CMS data with live data from another service for one response

## The Core Decision Rule

Ask:

"If the same document change happened through a different entry point, would I still need this logic to run?"

- If yes, prefer a hook
- If no, prefer a route handler or endpoint

## Entry Points Matter

The same document may be created or updated through many entry points:

- Payload Admin UI
- REST API
- GraphQL API
- Local API (`payload.create`, `payload.update`, etc.)
- seed scripts
- background jobs
- custom endpoints

If important logic only exists inside one route handler, other entry points can bypass it. Hooks help centralize lifecycle rules.

## Context

`context` is request-scoped data shared across hooks in a single operation lifecycle. It is useful for:

- passing expensive fetched data from one hook to another
- suppressing behavior during bulk operations such as seeding
- preventing infinite loops when one hook triggers another write
- passing flags through Local API calls without adding fake fields to documents

## Analytics and Hooks

Analytics can be implemented in hooks when you want tracking to happen whenever content or commerce entities change:

- `afterChange` on `orders` to emit revenue events
- `afterChange` on `promotions` to refresh reporting caches
- `afterDelete` on `locations` to remove records from search or reporting systems

But request-specific analytics collection, such as a frontend beacon endpoint, usually belongs in a route handler or custom endpoint.
