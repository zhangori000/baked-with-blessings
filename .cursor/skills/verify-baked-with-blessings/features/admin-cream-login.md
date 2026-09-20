# Cream admin login

Logged-out preview `/admin` shows a real cream bakery sign-in — heading `Sign in to the bakery admin`, email, password, Sign in — instead of Payload's blank black shell. After a preview admin signs in, the bakery dashboard opens. Production login is never used.

## Sub-features

- `login-logged-out` opens cream Sign in when the tab has no bakery admin session.
- `login-preview-copy` shows the `Preview admin` eyebrow and preview-only helper copy.
- `login-fields` exposes Email, Password, and a `Sign in` submit on `#fffaf0`.
- `login-success` signs in with a preview admin and lands on the dashboard.
- `login-failure` keeps the cream page and shows the environment mismatch alert.
- `login-not-black` rejects an empty black body or `<!--$--><!--/$-->` Suspense shell.
- `login-not-prod` refuses `bakedwithblessings.com` and the `Private workspace` eyebrow.

## How to get to it (user POV)

- Open `{PREVIEW}/admin` while signed out of the bakery admin.
- Open `{PREVIEW}/admin/login` while signed out.
- After a failed boot, read `The admin panel could not load` instead of a black screen.
- From a signed-in session, use Payload's account menu to log out, then return to `/admin`.
- Do not use `https://bakedwithblessings.com/admin`.

## Driving it with the browser

Preconditions:

- Doctor has passed on the Ready preview host. The tab is that preview, not production.
- Vercel SSO is complete in this same tab, or the run is reported `blocked: vercel-sso`.
- If the dashboard is already showing, log out in this tab before proving cream login.

- **Confirm host.** Read the address bar. It must be the Ready `*.vercel.app` preview. If it is `bakedwithblessings.com`, stop.
- **Open logged-out admin.** Navigate the same tab to `{PREVIEW}/admin`. The document background is `#fffaf0`. The root of the form page is `[data-admin-shell="login"]`. The heading is `Sign in to the bakery admin`. The body is not black and is not an empty Suspense comment.
- **Read preview copy.** The uppercase eyebrow is `Preview admin`, not `Private workspace`. Body copy says this is a Vercel preview, not the live site, and that production login still lives at `bakedwithblessings.com/admin`. Footer copy says this preview needs its own admin user and database.
- **See the form.** Labels `Email` and `Password` are visible. Inputs are `#field-email` (`type=email`, `name=email`) and `#field-password` (`type=password`, `name=password`). The submit button name is `Sign in`.
- **Failed credentials (optional).** Submit a deliberately wrong preview password. The cream page stays. A `role=alert` reads `That email and password did not match an admin account for this environment.` The tab does not jump to production.
- **Sign in.** Fill `#field-email` and `#field-password` with the preview admin account. Click `Sign in`. The button may read `Signing in…`. On success the tab goes to `{PREVIEW}/admin` and the heading `What would you like to take care of?` is visible, with eyebrow `Bakery command center`.
- **Boot error path.** If the heading is `The admin panel could not load` and `[data-admin-shell="error"]` is present, capture it. That is a visible cream error, not a black shell. Do not repair it with production env vars.
- **Proof.** Save `artifacts/verify-baked-with-blessings/admin-cream-login/logged-out.png` (cream Sign in, preview host visible) and `artifacts/verify-baked-with-blessings/admin-cream-login/signed-in-dashboard.png` after a successful preview login. Note the entry point (`/admin` or `/admin/login`).

## Gotchas

- Vercel SSO (`vercel.com/sso-api`) is in front of the cream page. SSO is not the bakery login. After SSO you must still see `Sign in to the bakery admin` when logged out of Payload.
- A signed-in cookie skips the cream page and opens the dashboard. Log out in this tab to prove `login-logged-out`. Do not open a second tab.
- `Private workspace` means you are not on a Vercel preview. Stop. That copy is for non-preview deploys, including production.
- The historic failure is Next 16 + Payload `RootLayout` leaving `<!--$--><!--/$-->` over dark CSS. Any empty black `/admin` is a fail, even if `curl` returned 200.
- Wrong-password copy is environment-specific. Do not treat a failed preview login as a reason to use the production admin user or production database.
- `PAYLOAD_SECRET` and the preview database must belong to preview. Never copy production secrets into chat to "make login work."
