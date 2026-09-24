# Flavor votes: backlog

Weekly flavor voting shipped at `/vote` (admin: Content → Flavor Votes). This file tracks the follow-ups we chose not to build yet.

## How it works today

- The owner makes one Flavor Vote per week: picks cookie products, sets it to **Live**. The newest Live vote is the one on `/vote`.
- Everyone gets 3 cookie tokens (changeable per poll under **More options**, max 10). Tokens can be stacked on one flavor.
- A voter is an anonymous, httpOnly cookie. The stored key is a SHA-256 of `PAYLOAD_SECRET` + the cookie, so the database never holds the raw token. Votes can be changed until the poll closes.
- Standings appear after someone votes (toggle: **Show standings after voting**), and always after the poll closes.
- The optional "What flavor would you want?" box stores one raw string (80 chars max) per voter. The owner sees the list in the poll's **Results so far** panel.

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
- **Past results:** show the final standings of closed polls on `/old-flavors` ("Last week's vote").
- **Admin timezone display:** the Voting closes picker shows the owner's computer time zone. If the owner edits from a device outside Central time, consider Payload's `timezone` option on the date field (needs a migration column).
