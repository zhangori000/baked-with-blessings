# Flavor votes: backlog

Weekly flavor voting shipped at `/vote` (admin: Content → Flavor Votes). This file tracks the follow-ups we chose not to build yet.

## How it works today

- The owner makes one Flavor Vote per week: picks cookie products, sets it to **Live**. The newest open Live vote is the one on `/vote`.
- **Voting opens** (optional, admin sidebar) schedules the start. Empty means it opens as soon as it is Live.
- `/vote` has four states. **Open:** the ballot, plus a "Past votes" list below it: one expandable row per closed vote (newest first, the latest one open), showing the winner and full standings, 8 at a time with "Show older votes". **Cooldown:** no open vote, so the latest results are the main content, with a "Next vote opens in…" countdown (or "To be announced" when no opening time is set) and "We'll send an email when it's up", and an "Earlier votes" list below. **Scheduled only:** a countdown. **Nothing:** coming soon.
- Every closed vote has a permanent results page at `/vote/results/<id>`. Open votes redirect to `/vote`, and hidden ones return 404. The admin **Results so far** panel shows this link and a ready-to-send message with the top 3 once voting closes. Ties share a place.
- Everyone gets 3 cookie tokens (changeable per poll under **More options**, max 10). Tokens can be stacked on one flavor.
- A voter is an anonymous, httpOnly cookie. The stored key is a SHA-256 of `PAYLOAD_SECRET` + the cookie, so the database never holds the raw token. Votes can be changed until the poll closes.
- Standings appear after someone votes (toggle: **Show standings after voting**), and always after the poll closes.
- The optional "What flavor would you want?" box stores one raw string (80 chars max) per voter. The owner sees the list in the poll's **Results so far** panel.

## Bring-back requests (nudges)

- Every card on `/old-flavors` has a **Bring it back** button. `/vote` shows a "Miss an old flavor?" box under the ballot (and in the cooldown and empty states). Both open the same picker. Nudges are separate from vote tokens, and the picker leaves out flavors already on the open ballot.
- One nudge per person per flavor, using the same anonymous voter cookie as votes (unique on product + voter key). The email is optional; entering one again updates it.
- Each new nudge emails the owner right away (same inboxes as other owner alerts), with the running count and a link to **Admin → Bring-back requests** (`/admin/bring-back`, also on the dashboard). That page lists flavors with the most-wanted first, plus the emails to copy.
- If more than 30 nudges arrive in an hour, owner emails pause and the nudges are still saved. This limits inbox floods; there is no per-IP limit yet.
- Not built yet: the "it's back" email to people who left an address. Once the bakery-update email flow can target a list, send it when a nudged flavor returns to the lineup.

## Changing the close time

- Default: Sunday 8:00 PM `America/Chicago`, in `src/features/flavor-polls/schedule.ts` (`FLAVOR_POLL_SCHEDULE`). Changing that constant changes the default for new polls (needs a deploy). It is DST-safe.
- Any single poll can override it with the **Voting closes** field in the admin sidebar, no deploy needed.
- If the close time changes often, promote `FLAVOR_POLL_SCHEDULE` into a `SitePages`-style global (weekday + time) so the owner can edit it.

## Spike: grouping similar flavor ideas

**Problem:** write-ins are raw strings. "ube", "Ube cookie", and "purple yam crinkle" all count as different ideas, so the list gets noisy.

**Goal:** a weekly report for the baker that groups similar ideas, with counts, and costs no LLM tokens.

**Approach to try, in order of effort:**

1. **Normalize:** lowercase, trim, strip punctuation, drop filler words (`cookie`, `cookies`, `a`, `the`, `please`), singularize. On its own this probably merges most duplicates.
2. **Fuzzy match:** cluster normalized strings by token-set similarity (e.g. `fastest-levenshtein` or a trigram Jaccard), threshold around 0.8. Catches typos like "snickerdoodel".
3. **Local embeddings (only if 1–2 aren't enough):** run a small sentence-embedding model in-process (`@xenova/transformers` / Transformers.js with `all-MiniLM-L6-v2`, about 25 MB, CPU-only). Then do agglomerative clustering on cosine distance. This catches synonyms ("ube" vs "purple yam") and needs no external API.

**Report delivery options:**
- Admin: a "Grouped ideas" section in the Results panel. Compute on demand from the `flavor-poll-votes` rows.
- Email: a weekly cron (Vercel Cron) after the poll closes that sends the grouped list to the baker. Needs an email provider decision.

**Open questions:** Should the report cover all polls or only the latest? Should the baker be able to merge or rename clusters by hand?

## Other follow-ups

- **Countdown pill on `/menu` and home** that links to `/vote` while a poll is open. Skipped in v1 to keep the PR focused.
- **Abuse limits:** v1 relies on the voter cookie, so clearing cookies allows another ballot. If that becomes a problem, add a per-IP rate limit on `POST /api/flavor-polls/[id]/vote` (e.g. Vercel KV / Upstash sliding window) or require a signed-in customer.
- **Past votes at scale:** `/vote` loads every closed vote and its ballots in two queries. Fine for years of weekly votes; if it ever gets slow, load older rows on demand instead.
- **Email when the next vote opens:** the cooldown copy promises an email. Once the mass-email feature lands, send one when a vote's **Voting opens** time passes (or when it goes Live), linking to `/vote`, and one when it closes, linking to `/vote/results/<id>` (reuse `buildResultsShareMessage`).
- **Admin timezone display:** the Voting closes picker shows the owner's computer time zone. If the owner edits from a device outside Central time, consider Payload's `timezone` option on the date field (needs a migration column).
