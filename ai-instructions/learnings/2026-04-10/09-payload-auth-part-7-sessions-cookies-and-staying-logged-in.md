# 2026-04-10: Payload Auth Part 7, Sessions, Cookies, and Staying Logged In

## Table of contents

- [Why this note exists](#why-this-note-exists)
- [What `auth` means in a collection](#what-auth-means-in-a-collection)
- [What a session actually is](#what-a-session-actually-is)
- [What a server-side session record is](#what-a-server-side-session-record-is)
- [What a cookie is in this context](#what-a-cookie-is-in-this-context)
- [What `useSessions` means](#what-usesessions-means)
- [Why `customers_sessions` exists in this repo](#why-customers_sessions-exists-in-this-repo)
- [Why `admins_sessions` does not exist here](#why-admins_sessions-does-not-exist-here)
- [Will customers be forced to log in every 30 minutes](#will-customers-be-forced-to-log-in-every-30-minutes)
- [What your current repo is configured to do](#what-your-current-repo-is-configured-to-do)
- [What I would recommend for a cookie-ordering storefront](#what-i-would-recommend-for-a-cookie-ordering-storefront)
- [Official docs](#official-docs)

## Why this note exists

The phrase `customers_sessions` sounds technical and easy to misunderstand, especially if you are still learning what `auth`, cookies, sessions, and tokens even are. This note explains those ideas in plain language and answers the practical question behind your reaction, which is the one that matters most: if a customer just wants to come back later and order cookies again, are they going to be forced to keep logging in constantly? The short answer is no. A session table is not there to annoy the user. It is there so the system can remember, in a controlled and secure way, that the user is already logged in.

## What `auth` means in a collection

When a Payload collection has `auth`, that collection is no longer just a place to store ordinary documents. It becomes an account collection. That means the documents in that collection can represent people who log in, log out, reset passwords, and perform authenticated actions. In your repo, the `customers` collection has `auth`, which means customers are real login-capable accounts. The same is true for `admins`. So `auth` is basically the switch that says, "this collection is an identity system, not just content storage."

## What a session actually is

A session is the system's memory that a specific browser is already logged in as a specific user. If a customer logs in once, then clicks around the site, refreshes the page, comes back later in the day, and is still recognized without typing the password again, that remembered login state is the session. Without sessions or something equivalent, the user would need to prove who they are on every request, which would obviously be terrible for normal web use.

## What a server-side session record is

A server-side session record means the server stores that remembered login state in the database instead of trusting the browser alone. In your case, that record lives in the `customers_sessions` table. The session row is not a business record like an order or an address. It is login bookkeeping. It says, in effect, "there is an active logged-in session for this customer, and it expires at this time." That is what makes it "server-side": the server and database remain the source of truth about whether the login is still valid.

## What a cookie is in this context

A cookie in this context is a small piece of data the server gives the browser so the browser can identify itself again on later requests. Payload uses HTTP-only cookies for auth, which means the browser automatically includes them when talking to your site, but JavaScript in the page cannot read them directly. That is a good security property. The cookie is not the same thing as the whole user account, and it is not the same thing as the entire session record. It is more like a secure handle that lets the server look up the right authenticated state again.

## What `useSessions` means

`useSessions` decides whether Payload should keep that remembered login state in a dedicated sessions table. If `useSessions` is on, Payload stores server-side session records. If `useSessions` is off, Payload uses stateless JWT-based auth instead of maintaining a session table for that collection. So the presence of `customers_sessions` is not some special ecommerce feature. It is simply the result of "customer accounts use session-backed auth."

## Why `customers_sessions` exists in this repo

Your `customers` collection has `auth`, and it does not set `useSessions: false`. Payload's auth docs say `useSessions` is enabled by default. That means Payload automatically creates the `customers_sessions` table and uses it to remember logged-in customer browsers. So yes, it is auto-created by Payload. You did not manually design that table. Payload created it because the collection's auth mode called for it.

## Why `admins_sessions` does not exist here

Your `admins` collection is different. In [src/collections/Admins/index.ts](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/src/collections/Admins/index.ts), `useSessions` is explicitly set to `false`. That means the admin side is using stateless JWT-style auth rather than a DB-backed sessions table. So the difference is not that customers are "more important" than admins. The difference is simply that the two collections are using different auth storage strategies.

## Will customers be forced to log in every 30 minutes

No, not from the current config. A session table does not mean "short annoying logins." It just means the login state is stored on the server. The actual question of how long someone stays logged in is controlled by expiration settings, not by the mere existence of the sessions table. So `customers_sessions` existing does not imply a short timeout. It only implies that Payload is storing session state in the database.

## What your current repo is configured to do

Right now, both your `customers` and `admins` collections use `tokenExpiration: 1209600` in their auth config. Payload documents `tokenExpiration` in seconds, and says it controls how long to keep the user logged in, with JWTs and HTTP-only cookies expiring together. `1209600` seconds is 14 days. So your current repo is not configured for 30-minute customer logins. It is configured for roughly two weeks of remembered login state. For a storefront user who orders cookies now and comes back later this week, that is much more reasonable than forcing them to log in every day.

## What I would recommend for a cookie-ordering storefront

For storefront customers, I would not choose a super-short login window unless you have a special risk model that justifies it. Customers buying cookies, cafe items, or similar low-friction ecommerce products generally expect the site to remember them for a while. Fourteen days is already fairly normal. Thirty days would also be defensible if you want a friendlier returning-customer experience. I would usually keep admin auth stricter than customer auth, but for now your current `14 days` setup is already much closer to what users expect from a normal commerce site than the nightmare scenario you described of feeling forced to re-log into Crumbl all the time.

## Official docs

- [Authentication Overview](https://payloadcms.com/docs/authentication/overview)
- [Cookie Strategy](https://payloadcms.com/docs/authentication/cookies)
- [Authentication Operations](https://payloadcms.com/docs/authentication/operations/)
- [JWT Strategy](https://payloadcms.com/docs/authentication/jwt)
