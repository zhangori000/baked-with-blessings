# PR Review Template

This PR tightens the customer account flow after the `admins` / `customers` split and adds the first layer of Resend email groundwork.

The customer signup screen is now clearer about allowing an email address, a phone number, or both. The form styling was also reworked using Coinbase CDS TextInput patterns as reference so the inputs feel more deliberate and are easier to re-theme later once the final color direction is ready.

On the storefront side, the ecommerce provider wiring now points at the `customers` auth collection instead of the old `users` route. That removes the stale `/api/users/me` lookup and keeps storefront customer hydration aligned with the split auth model.

On the email side, this PR adds the official Payload Resend adapter package and wires Payload to use it when the required environment variables are present. After a successful customer signup, the app now attempts to send a placeholder welcome email if the customer provided an email address. That send is intentionally non-blocking, so signup still succeeds even if email delivery is not configured yet or the send fails.

This PR also adds the supporting env placeholders for Resend and captures the deferred product direction around email verification in the backlog. The result is not a finished production email system yet, but it gives the app the right structure for real welcome emails, forgot-password emails, and later verification work once the sending domain is available.
