# 2026-04-10: BeforeDashboard, Turbopack, Auth

## Table of contents

- [Scope of this note](#scope-of-this-note)
- [Repo and environment](#repo-and-environment)
- [What broke](#what-broke)
- [Root cause](#root-cause)
- [Important concepts](#important-concepts)
- [What Payload admin was doing](#what-payload-admin-was-doing)
- [Why `/` worked while `/admin` failed](#why--worked-while-admin-failed)
- [What fixed it without leaving Turbopack](#what-fixed-it-without-leaving-turbopack)
- [Why not install CDS directly](#why-not-install-cds-directly)
- [Webpack vs Turbopack takeaway](#webpack-vs-turbopack-takeaway)
- [Auth and users takeaway at that time](#auth-and-users-takeaway-at-that-time)
- [What changed later](#what-changed-later)
- [Practical notes](#practical-notes)
- [Related notes](#related-notes)

## Scope of this note

This note captures the state of the repo before the later admin-vs-customer split. That matters because some of the auth statements here are historically true for April 10, but they are not the final architecture of the repo now. The point of this note is to preserve what actually failed, why it failed, and what the system looked like at the time, not to describe the final system after later refactors.

## Repo and environment

The repo at the time was `learning-payload-cms/baked-with-blessings`. The stack was Next `16.2.1`, React `19.2.4`, Payload `3.81.0`, `pnpm`, and Windows. Docker was only responsible for Postgres. The app process itself was not containerized; it was running locally through `pnpm dev`. That distinction mattered because the admin failure was happening in the local Next/Payload build pipeline, not inside Docker and not inside Postgres.

## What broke

The homepage at `/` loaded, but `/admin` returned `500`. The failing styling path traced back to `src/components/BeforeDashboard/index.scss`, and the concrete Sass failure was `Can't find stylesheet to import` while trying to resolve shared Payload UI styles. The important operational takeaway was that the site was not globally dead. The break was isolated to the admin route.

## Root cause

`BeforeDashboard` was a custom component injected into Payload's admin experience before the real built-in dashboard. That custom component imported Payload's shared SCSS through `@import '~@payloadcms/ui/scss';`. Under this setup, that import chain failed when Turbopack tried to resolve it on Windows with the `pnpm` package layout. In other words, the problem was not "Payload admin is broken" in the abstract. The problem was that one custom admin component depended on a Sass import path that Turbopack was not resolving safely in this environment.

## Important concepts

The browser does not run raw `.ts`, `.tsx`, or `.scss` files. Next first compiles and bundles those source files into runnable JavaScript and CSS. `/` and `/admin` use the same Next dev server, but they do not share the exact same route tree or import graph. A route can therefore be healthy in dev until you visit a different route that pulls in a different dependency chain. That is why `/` working did not prove `/admin` was healthy. It only proved the homepage branch of the app compiled.

`beforeDashboard` is also easy to misunderstand. It is not "the admin dashboard itself." It is simply extra content that Payload renders before the built-in dashboard. So if `beforeDashboard` fails, the entire `/admin` route can still fail even though the built-in dashboard code is fine. That is what happened here.

Another important concept is that Payload's admin layer still has older Sass assumptions in some places, and Sass itself has older conventions like `@import` and `~` package resolution that are more legacy-shaped than modern CSS module imports. That does not make them wrong, but it does mean newer bundlers like Turbopack can be less forgiving when the package layout or resolution assumptions do not line up cleanly.

## What Payload admin was doing

When you visit `/admin`, Payload classifies that route as its dashboard route. For that dashboard route, Payload renders the `beforeDashboard` content, then the built-in modular dashboard, then any `afterDashboard` content. The built-in dashboard itself is widget-based. If you do not define a custom widget layout, Payload still injects a default collections-oriented dashboard. So the admin page at that time was a mix of your custom intro panel plus Payload's normal admin content underneath it.

## Why `/` worked while `/admin` failed

This is the part that often confuses people most. In development, Next compiles routes on demand. That means the dev server does not necessarily compile every admin-related dependency before you visit `/admin`. The homepage route did not need the bad Sass import chain, so it compiled and rendered. The admin route did need it, because `BeforeDashboard` sat in that route's render path. The failure was therefore route-specific, not app-wide.

## What fixed it without leaving Turbopack

The fix was not to rip out Payload admin or abandon Turbopack immediately. The direct fix was to replace the buggy SCSS-based `BeforeDashboard` implementation with a local CSS-module implementation and remove the custom component's dependency on Payload's shared SCSS entrypoint. That preserved Payload admin, preserved the custom intro panel idea, and made the specific custom surface Turbopack-safe. The visual treatment stayed CDS-inspired, but it did not require installing `@coinbase/cds-web` directly.

## Why not install CDS directly

The local `cds` repo was still useful as a design and implementation reference, but full package adoption was not the safe first move. The key reason was version compatibility. CDS web was targeting React 18, while this app was already on React 19. In a situation like that, borrowing patterns and selectively reimplementing pieces is safer than assuming the full package will behave cleanly across the stack. The repo could still learn from CDS without coupling itself to that package immediately.

## Webpack vs Turbopack takeaway

Webpack was proposed as a fallback because it is older and more battle-tested around legacy Sass import behavior. That did not mean Turbopack was "bad." It meant Turbopack was stricter in this exact environment and therefore surfaced the issue faster. If older Sass package import patterns remain in play, Webpack is often the safer compatibility fallback. If the custom component avoids that Sass layer entirely, Turbopack can stay and the admin route can still be stable. In this case, the cleaner engineering move was to remove the fragile custom dependency instead of switching bundlers first.

## Auth and users takeaway at that time

At that moment in the repo, admin login was still email plus password, customer login was still email plus password, and phone-related work in the repo was only checkout or order-contact groundwork, not real phone auth. The repo still used a single `users` collection to represent both admins and customers, and a `roles` field distinguished them. The first created user automatically received the `admin` role through `ensureFirstUserIsAdmin`. After the first user existed, later public signups did not become admin automatically. That was the historical auth shape on April 10 before the later collection split work.

## What changed later

Later, the repo moved away from that single-`users` setup. Admins and customers were split into separate collections, first-admin creation was moved to an explicit bootstrap path, and customer auth was later expanded further. So if this note is read beside newer notes in the same folder, the right interpretation is: this file records the earlier failure and earlier auth model, while the later numbered files describe the refactor away from that model.

## Practical notes

If the first user's email was mistyped but still known, the practical move at that time was to log in with the exact mistyped address and fix it later from the admin. If the first user's email was mistyped and effectively inaccessible, recovery usually meant directly updating the user record or creating another admin through a privileged path. Also, `No email adapter provided` in development did not mean auth was broken. It only meant Payload would write email flows to the console instead of sending real email.

## Related notes

Coinbase Storybook sidebar notes live at `ai-instructions/learnings/coinbase/storybook-sidebar-tabs.md`. The later auth and bootstrap notes for this repo continue in the rest of the `2026-04-10` learning folder.
