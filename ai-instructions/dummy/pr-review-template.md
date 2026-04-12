# PR Review Template

## Title

Polish customer auth flow and add Resend email groundwork

## Summary

This PR tightens the customer auth experience after the `admins` / `customers` split and adds the first layer of email infrastructure without making email delivery a hard dependency yet.

The main product-facing change is the signup flow. The create-account screen is clearer about allowing email, phone, or both, and the styling was reworked using Coinbase CDS TextInput patterns as reference so the form feels more intentional and is easier to theme later. The storefront provider wiring was also corrected so ecommerce customer hydration points at `customers` instead of the old `users` route.

On the email side, this PR adds the official Payload Resend adapter package and wires Payload to use it when the required env vars are present. Successful customer signup now attempts to send a non-blocking placeholder welcome email. If Resend is not configured yet, the app still works and Payload falls back to its existing no-adapter behavior.

## Included Changes

- clarifies the create-account flow for email, phone, or both
- adds a dedicated CSS module for the signup form so theme tokens can be swapped later
- adds Coinbase CDS input-design notes under `ai-instructions/design-stuff`
- fixes storefront ecommerce provider hydration to use the `customers` auth collection
- adds conditional Resend adapter configuration in Payload
- adds a reusable welcome-email helper
- sends a welcome email after successful customer signup when an email address is present
- updates `.env.example` with Resend configuration placeholders
- records the deferred email-verification direction in backlog notes

## Testing

- tested customer phone signup with Twilio Verify
- tested customer login after phone-based signup
- verified the storefront no longer calls `/api/users/me`
- ran `pnpm.cmd exec tsc --noEmit`

## Notes

Real email delivery still depends on Resend domain verification and env setup:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`

Until that is configured, welcome-email delivery should be treated as groundwork rather than a finished production email system.
