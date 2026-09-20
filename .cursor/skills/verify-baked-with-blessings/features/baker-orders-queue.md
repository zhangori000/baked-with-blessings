# Baker orders queue

The baker sees unfinished orders newest first, with who ordered, what to bake, and whether it is paid — on the dashboard card and on the Orders list. Preview rows are preview data. Zoe and other live orders appear only on production admin.

## Sub-features

- `orders-dashboard-newest` shows the dashboard card titled `Newest first`.
- `orders-row-language` shows customer, items summary, payment label, date, and total on each open-order row.
- `orders-empty-or-preview` distinguishes a real empty queue from an unavailable preview, without inventing production rows.
- `orders-view-all` opens unfinished statuses sorted `-createdAt`.
- `orders-list-columns` uses Customer, Email, What they ordered, Status, Payment, Total, and the created date — not ID-first.
- `orders-payment-words` uses `Paid online`, `Pay at pickup`, `Venmo — verify`, or `Check payment`.
- `orders-zoe-live-only` treats missing Zoe on preview as correct isolation.

## How to get to it (user POV)

- From the dashboard, read the `Needs attention` / `Your work queue` card headed `Newest first`.
- Choose `View all N open orders` when that link is shown.
- Choose the Daily work card `Orders to handle`.
- Open `{PREVIEW}/admin/collections/orders` (full list) or the open-queue permalink with `sort=-createdAt`.
- Open one order to read sidebar `What they ordered` and `Payment`.

## Driving it with the browser

Preconditions:

- Signed in on the Ready preview with a preview admin. Dashboard heading is `What would you like to take care of?`.
- Doctor has passed. This tab is not production.
- You are not looking for Zoe Haase or production order #3 on this preview.

- **Dashboard card.** From `/admin`, find the article headed `Newest first`. Copy says new orders land at the top and that Requested, Confirmed, and Ready for pickup stay until finished.
- **Populated queue.** If rows exist, each link goes to `/admin/collections/orders/{id}` and shows a customer primary line (name when it is a real name, otherwise email or phone), an items line (`2× Chocolate chip` or `Open to see items`), a payment phrase, a date, a dollar total, and a status pill `Requested` / `Confirmed` / `Ready for pickup`. Newest created row is first.
- **Empty queue.** If the card says `You're all caught up. No orders need attention.`, that is a pass for preview data. Follow `View order history` only if you need the full list. Do not open production to "find orders."
- **Unavailable queue.** If it says `Order preview is temporarily unavailable.`, capture it and skip row-language proof. Use `Open all orders` only as a navigation check.
- **View all open orders.** When `View all N open orders` is present, click it in this tab. The URL includes `where[status][in][0]=processing`, `where[status][in][1]=confirmed`, `where[status][in][2]=ready`, and `sort=-createdAt`. The heading is `Orders`. Completed rows are not in this filtered list.
- **Daily work entry.** Return to `/admin`. In `section[aria-labelledby="daily-work-heading"]` click `Orders to handle` (`See who ordered, what to bake, and whether it is paid. Newest first.`). Land on `/admin/collections/orders` with heading `Orders`.
- **List language.** Default columns include `Customer`, `Email`, `What they ordered`, `Status`, `Payment`, `Total`. Row title is the customer, not `ID: 11`. Search is name, email, or phone — not technical field names. Default sort is newest first.
- **Open one order.** Open a preview row. Sidebar shows `What they ordered` (short bake list) and `Payment` near the customer. Stripe IDs stay off the default list. Detail items may be labeled `Cookies to bake`.
- **Payment words.** Assert one of `Paid online`, `Pay at pickup`, `Venmo — verify`, `Check payment`. Do not require a raw `manualPaymentMethod` or PaymentIntent as the baker-visible status.
- **Zoe check.** Scan visible names. If Zoe Haase is absent, record `orders-zoe-live-only: preview isolated`. If Zoe appears on this preview, stop and report a possible preview-DB-pointed-at-prod incident. Do not keep driving.
- **Proof.** Save `artifacts/verify-baked-with-blessings/baker-orders-queue/dashboard-newest-first.png` and `artifacts/verify-baked-with-blessings/baker-orders-queue/orders-list.png`. Include the preview host and the items/payment words, or the empty-queue sentence.

## Gotchas

- Preview DB ≠ prod DB. A real new paid order like production Zoe #3 ($14, paid online) will not appear here. The queue is still newest-first so the next preview order of that shape lands first.
- Dashboard pills say `Requested`; the edit field option is `Requested (new order)`. Assert the visible pill or list cell, not the stored `processing` value.
- `What they ordered` is a summary. `Open to see items` or `N items — open to see flavors` is valid when titles did not resolve. Open the order for the full breakdown.
- Amounts are stored in cents and shown as dollars (`700` → `$7.00`). Assert the formatted total.
- Do not sort the list by ID to "match CMS habits." Newest first is `-createdAt`.
- Stay in one tab. Opening production admin in another tab to compare Zoe contaminates the run.
