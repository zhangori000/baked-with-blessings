# Email Verification and Auth Hardening

## Why this is in backlog

This app should add email verification before production customer signup is considered ready.

Related security work should be bundled with it so auth hardening happens as one deliberate pass instead of piecemeal.

## Scope

- enable Payload email verification for customer signup
- configure a real email adapter in `payload.config.ts`
- verify forgot-password email delivery works end to end
- add signup bot protection
- configure auth lockout settings
- review CSRF and CORS for production domains

## Why it matters

- reduces fake or disposable account creation
- makes public signup more trustworthy
- is recommended by Payload when users are allowed to register new accounts
- email verification is not useful without actual email delivery configured

## Related notes

- `ai-instructions/learnings/2026-04-10/03-payload-auth-part-1-bootstrap-explained.md`
- `ai-instructions/learnings/2026-04-10/04-payload-auth-part-2-admins-vs-customers.md`
- `ai-instructions/learnings/2026-04-10/05-payload-auth-part-3-first-admin-across-local-dev-prod.md`
