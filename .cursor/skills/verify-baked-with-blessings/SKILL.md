---
name: verify-baked-with-blessings
description: Drive the Baked with Blessings Ready Vercel preview (cream admin login, baker orders, cookie lineups, standing menu, public /rotations and /menu) the way a bakery lead does. Use when proving bakery preview-stack UI, never production.
---

# Verify Baked with Blessings

Agent-facing control skill for the bakery preview stack. Read this file, then the matching file under `features/`. Drive the **Ready Vercel preview only**. Never open production. Never merge. Never point preview at the production database.

The surface is the web app: Payload admin at `/admin` and the public storefront. There is no project-local `control-*` binary. The harness is one long-lived browser tab plus read-only `gh` / `curl` checks.

Stack this skill is written against (later PRs inherit these labels):

- Cream logged-out admin (`Sign in to the bakery admin`, `#fffaf0` document) instead of a blank black Payload shell.
- Baker orders queue: **Newest first**, customer, items, payment language.
- **Cookie lineups** / **This week's specials** and **Cookies and menu** / **On the menu** as the first cookie tab.
- Public `/rotations` (Specials of the Week) and `/menu` still load.

## Launch

Do not start `pnpm dev`. Do not open `https://bakedwithblessings.com` or `https://www.bakedwithblessings.com`. Official proof is the Ready Vercel preview for the bakery preview-stack PR you are verifying (today that tip is PR #54 / `cursor/baker-cookie-lineup-d195`, or a later preview-stack PR that lists this skill).

1. Resolve the preview URL from the PR, not from memory:

   ```bash
   gh pr view <n> --json url,title,headRefName,statusCheckRollup,body
   ```

   Require a Vercel check whose state is `SUCCESS` / Ready. Copy the `*.vercel.app` preview host from the PR body (the line that starts with the preview `/admin` URL) or from the Vercel check target. Typical host shape:

   `https://baked-with-blessings-git-<branch-slug>-orien-zhangs-projects.vercel.app`

2. Refuse these hosts immediately: `bakedwithblessings.com`, `www.bakedwithblessings.com`, any Vercel URL labeled Production. If the page eyebrow reads `Private workspace` instead of `Preview admin`, you are not on preview — stop.

3. Open **one** browser tab to `{PREVIEW}/admin`. Reuse that tab for the whole run. Vercel Deployment Protection may first send the tab to `vercel.com/sso-api`. That gate is expected. Complete Vercel SSO in this same tab if you are the owner; if you are an automated agent without SSO, stop and report `blocked: vercel-sso` with the preview URL. Do not fall back to production or localhost.

4. Ready means: after SSO, `{PREVIEW}/admin` is either the cream login document or the signed-in bakery dashboard — not a black empty body.

There is no server teardown. Do not delete the Vercel deployment. Do not run `pnpm payload migrate`, `pnpm sync-db:*`, or any `seed*` / `bootstrap:*` / `update:cookie-prices` / `import:cookie-media` script against the preview (or any hosted) database.

## Doctor

Run this read-only check before the first drive, after any failed drive, and whenever the tab looks wrong. An instance that fails doctor is not worth driving.

```bash
PREVIEW='https://<ready-preview-host>'   # must contain baked-with-blessings-git- and vercel.app
case "$PREVIEW" in
  *bakedwithblessings.com*|*www.bakedwithblessings.com*) echo 'REFUSE: production'; exit 1 ;;
esac

curl -sI "$PREVIEW/admin" | tr -d '\r'
curl -sI "$PREVIEW/rotations" | tr -d '\r'
curl -sI "$PREVIEW/menu" | tr -d '\r'
```

Pass when all of the following are true:

- Host is a `baked-with-blessings-git-*-orien-zhangs-projects.vercel.app` preview (or the exact `*.vercel.app` host printed on the Ready PR).
- Vercel status for that commit is Ready / `SUCCESS`.
- `/admin` is not a `200` HTML body that is empty, black, or only `<!--$--><!--/$-->`.
- After SSO, the logged-out document has `background: #fffaf0`, `data-admin-shell="login"`, and the heading `Sign in to the bakery admin`, **or** the signed-in dashboard heading `What would you like to take care of?`.
- A visible error page with heading `The admin panel could not load` and `data-admin-shell="error"` is a preview-env failure (missing `PAYLOAD_SECRET` or preview DB). Report it. Do not "fix" it by pointing at production.

Fail / stop when:

- The host is production, or the login eyebrow is `Private workspace`.
- The tab shows a blank black Payload shell.
- Doctor cannot see the page because SSO is unfinished and you are not the owner — report blocked, do not invent a local substitute.

## Drive

Reuse the same tab. Prefer in-app links and exact paths over opening a second window. Prefer accessible names and these stable handles over coordinates:

| What | Handle |
| --- | --- |
| Logged-out admin | `{PREVIEW}/admin` or `{PREVIEW}/admin/login` |
| Cream shell | `[data-admin-shell="login"]` |
| Email | `#field-email` / label `Email` |
| Password | `#field-password` / label `Password` |
| Submit | button `Sign in` (`type=submit`) |
| Dashboard | heading `What would you like to take care of?` |
| Orders queue card | heading `Newest first` |
| Lineup card | heading `This week's specials` |
| Daily work | `section[aria-labelledby="daily-work-heading"]` |
| Orders list | `/admin/collections/orders` — heading `Orders` |
| Cookie lineups | `/admin/collections/flavor-rotations` — heading `Cookie lineups` |
| Cookies and menu | `/admin/collections/products` — heading `Cookies and menu` |
| Public specials | `/rotations` — nav label `Specials of the Week` |
| Public menu | `/menu` — nav label `Menu` |
| Open-orders permalink | `/admin/collections/orders?where[status][in][0]=processing&where[status][in][1]=confirmed&where[status][in][2]=ready&sort=-createdAt` |

Sign in only with a **preview** admin account for this environment. POST goes to `/api/admins/login` with `{ email, password }` and `credentials: "include"`. Never paste production `PAYLOAD_SECRET`, production DB URLs, or production admin passwords into chat.

Drive features serially from `features/README.md`. Start each recipe from the dashboard unless that file says otherwise. After a mutation you did not mean to keep, leave the preview data as you found it — this skill is observational unless the owner asked to edit preview content.

Read the matching feature file before clicking. A proof that uses one convenient entry point is incomplete when that file lists others.

## Evidence

Write proof under `artifacts/verify-baked-with-blessings/<feature-id>/` in the workspace (create the directory; do not commit it). Named location, not "somewhere in chat":

- `artifacts/verify-baked-with-blessings/admin-cream-login/`
- `artifacts/verify-baked-with-blessings/baker-orders-queue/`
- `artifacts/verify-baked-with-blessings/cookie-lineups/`
- `artifacts/verify-baked-with-blessings/cookies-and-menu/`
- `artifacts/verify-baked-with-blessings/public-specials-and-menu/`

Each feature needs:

1. The URL actually driven (must be the preview host).
2. A screenshot of the action and a screenshot of the resulting state (not only the final frame).
3. Visible bakery identity: cream login heading, dashboard title, collection heading, or public nav label.
4. A one-line note of the feature ID and entry point (`dashboard-card`, `direct-url`, `public-nav`, …).

Proof standards:

- Exercise the real user path in the preview browser. Do not call internal setters, seed scripts, or test-only endpoints and call that verified.
- Side effects: preview DB is not production. Absence of Zoe / live orders on preview is expected proof that the DBs are separate, not a failure.
- Mocks are not used. If the dashboard says `Order preview is temporarily unavailable` or `Lineup status is temporarily unavailable`, capture that and stop that sub-feature — do not fabricate rows.
- If a path is unreachable (SSO, missing preview admin, no live lineup), report skip with the unmet precondition. Do not mark it verified via a different path.

## Cleanup

Cleanup removes scratch you created in the tab (half-filled forms, leftover dialogs). It never deletes evidence.

- Keep every file under `artifacts/verify-baked-with-blessings/`. After cleanup, confirm those files still exist at that path.
- Do not `rm -rf artifacts`. Do not empty the evidence directories.
- Do not kill browsers or processes by name. If you started a helper `curl`/`gh` command, it is already finished.
- Do not destroy the Vercel preview. Do not log the owner out of Vercel SSO.
- If later features in the same pass still need the admin session, stay signed in. Only log out when the cream-login recipe says to, or when the whole pass is done and you need to leave the tab on the cream login.
- Do not run hosted migrations, seeds, or price/media scripts as "cleanup."

## Helpers

This skill ships no scripts. Invocation is the browser plus:

```bash
gh pr view <n> --json url,headRefName,statusCheckRollup,body
curl -sI "$PREVIEW/admin"
```

If a later helper is added under this skill directory, it must be executable and documented here before anyone is told to run it.
