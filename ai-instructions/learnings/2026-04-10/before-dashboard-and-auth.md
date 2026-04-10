# 2026-04-10: BeforeDashboard, Turbopack, Auth

## Repo and environment

- Repo: `learning-payload-cms/baked-with-blessing`
- Stack at time of issue: Next `16.2.1`, React `19.2.4`, Payload `3.81.0`, `pnpm`, Windows
- Docker only runs Postgres. The app itself runs locally via `pnpm dev`.

## What broke

- `/` loaded, but `/admin` returned `500`.
- The failing file was `src/components/BeforeDashboard/index.scss`.
- Sass error: `Can't find stylesheet to import` while resolving Payload UI shared styles.

## Root cause

- `BeforeDashboard` is a custom component injected before Payload's real admin dashboard.
- It imported `@payloadcms/ui` SCSS through `@import '~@payloadcms/ui/scss';`.
- Under this setup, the SCSS import chain failed in Turbopack on Windows with `pnpm` package layout.
- The problem was not Docker, not Postgres, and not the homepage route.

## Important concepts

- The browser does not run raw `.ts` or `.scss`. Next compiles source code into browser-ready JS/CSS.
- `/` and `/admin` use the same build system, but different route trees and import graphs.
- A route can fail only when visited because Next dev compiles routes on demand.
- `beforeDashboard` is not the main dashboard. It is just content rendered before the built-in dashboard.
- Payload's built-in admin UI still uses an SCSS-based styling layer in places.
- `@import` Sass syntax and the `~` package import style are older conventions with more legacy assumptions.

## What Payload admin was doing

- `/admin` is classified as the dashboard route by Payload routing internals.
- Payload then renders:
  - `beforeDashboard`
  - the built-in modular dashboard
  - `afterDashboard`
- The built-in dashboard is widget-based.
- Payload injects a default `collections` widget if you do not define your own.

## What fixed it without leaving Turbopack

- Replaced the buggy SCSS-based `BeforeDashboard` with a local CSS-module implementation.
- Removed the custom component's dependency on Payload's shared SCSS entrypoint.
- Kept Payload admin itself, but made the custom intro panel Turbopack-safe.
- The fix used CDS-inspired local styling, not the `@coinbase/cds-web` package itself.

## Why not install CDS directly

- Local `cds` repo is open source and useful for reference.
- CDS web currently targets React 18.
- This app is on React 19.
- Borrowing patterns/source selectively is safer than assuming the full package is compatible.

## Webpack vs Turbopack takeaway

- Webpack was proposed as a fallback because it is more battle-tested for older Sass import behavior.
- Turbopack is not "bad"; it is just less forgiving here.
- If older Sass package import patterns stay in play, Webpack is the safer fallback.
- If the custom component avoids that Sass layer entirely, Turbopack can stay.

## Auth and users takeaway

- Admin login is still email + password.
- Customer login is also still email + password.
- Phone-related changes in this repo are checkout/order contact groundwork, not phone auth.
- The `users` collection stores both admins and customers; `roles` distinguishes them.
- The first created user automatically gets the `admin` role through `ensureFirstUserIsAdmin`.
- After the first user exists, later public signups do not become admin automatically.

## Practical notes

- If the first user's email is mistyped but known, log in with that exact email and fix it later.
- If the first user's email is mistyped and inaccessible, recovery likely means updating the user directly or creating another admin through a privileged path.
- `No email adapter provided` in dev only means Payload logs emails to the console.

## Related notes

- Coinbase Storybook sidebar notes live at `ai-instructions/learnings/coinbase/storybook-sidebar-tabs.md`.
