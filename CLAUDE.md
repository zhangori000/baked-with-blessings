# Operational guardrails — Baked with Blessings

Standing rules only. Keep this file under ~20 lines; concepts and decisions live in `documentation/`.

- Money is stored in CENTS everywhere: `priceInUSD: 700` = $7.00. Same for cart subtotals, order amounts, and Stripe amounts.
- Schema changes use explicit migrations (`push: false`): edit collections → `pnpm generate:types` → write the migration → `pnpm payload migrate` (local Docker only; `pnpm db:up` first).
- `pnpm payload migrate:create` works again (snapshot re-baselined 2026-06-12 via `20260612_071216_snapshot_refresh`). Clean additive changes generate prompt-free, and it auto-updates `src/migrations/index.ts` — but ALWAYS read the generated SQL before committing. If it shows interactive rename-or-create prompts (ambiguous diffs), agent shells cannot answer them: ask the user to run it in a real terminal, or hand-write the migration in the house idempotent style (see `20260501_130000_add_manual_order_payments.ts`). In general, prefer non-interactive flags or hand-authored output over any command that can prompt.
- Deploys NEVER auto-migrate. Do not wire migrations into build/prebuild. Hosted databases are migrated manually: `pnpm sync-db:preview` / `pnpm sync-db:prod`.
- Migration ordering: additive changes → migrate before deploying. Destructive changes (drop/rename) → deploy the code that stops using the field first, migrate after the deploy is proven. This preserves Vercel instant rollback.
- Never run content scripts (`seed*`, `update:cookie-prices`, `import:cookie-media`, `bootstrap:*`) against hosted databases unless explicitly asked — hosted content is owner-managed via the admin panel.
- Business data (orders, customers, carts, transactions) never syncs between environments, in either direction.
- One feature per commit, so each is individually revertable. Plain branches (`git checkout -b`); never use `.claude/worktrees/`.
- Verify UI changes in a real browser (`pnpm dev`, storefront at localhost:3000) — typecheck/lint alone is not verification.
- The site has multiple themes/scenery variants. Build UI with the existing design system (`src/design-system/bakery`) and existing CSS variables — no one-off colors or fonts.
- The admin panel's primary user is a non-technical business owner: plain-language field descriptions, few knobs, hide advanced fields rather than exposing them.
