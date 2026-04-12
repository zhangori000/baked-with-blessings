# 2026-04-10: Payload Auth Part 4, Local Bootstrap Script Practical Flow

## Table of contents

- [Why this Part 4 exists](#why-this-part-4-exists)
- [The exact local question](#the-exact-local-question)
- [What the script actually changes](#what-the-script-actually-changes)
- [What it does **not** do](#what-it-does-not-do)
- [What you set before running it](#what-you-set-before-running-it)
- [The practical local flow](#the-practical-local-flow)
- [What happens when you open `/admin`](#what-happens-when-you-open-admin)
- [Why it does not auto-log you in](#why-it-does-not-auto-log-you-in)
- [What exists in the database after the script runs](#what-exists-in-the-database-after-the-script-runs)
- [If you rerun the script locally](#if-you-rerun-the-script-locally)
- [The mental model to keep](#the-mental-model-to-keep)

## Why this Part 4 exists

Part 3 explains the safe first-admin strategy across local, dev, and prod. This Part 4 focuses only on the practical local developer experience, because that is the part that is easiest to picture incorrectly.

Related notes:

- [03-payload-auth-part-1-bootstrap-explained.md](./03-payload-auth-part-1-bootstrap-explained.md)
- [04-payload-auth-part-2-admins-vs-customers.md](./04-payload-auth-part-2-admins-vs-customers.md)
- [05-payload-auth-part-3-first-admin-across-local-dev-prod.md](./05-payload-auth-part-3-first-admin-across-local-dev-prod.md)

## The exact local question

The question is not just "can a script create an admin?" The real question is:

- after I run the script locally, what do I actually see and do next?

That is what this note answers.

## What the script actually changes

The bootstrap script creates a document in the `admins` collection if that collection is empty. That is all.

In plain English:

- it inserts the first admin record into the database

That record contains things like:

- email
- password
- name

The script is changing database state. It is not changing the browser state.

## What it does **not** do

The script does **not**:

- auto-run when you open the app
- auto-run when you visit `/admin`
- auto-log you in
- create a browser session for you
- skip the normal login screen

This is the most important clarification.

The script creates a valid admin account in the database. It does not create a logged-in browser session.

## What you set before running it

The exact variable names can be whatever you choose, but the example in Part 3 used:

- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_ADMIN_NAME`

In local development, that usually means:

1. your local database is running
2. your app is pointing at that local database
3. you export or define those bootstrap environment variables
4. then you run the script

Example command shape:

```bash
$env:BOOTSTRAP_ADMIN_EMAIL="you@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD="super-secret-password"
$env:BOOTSTRAP_ADMIN_NAME="Your Name"
pnpm exec tsx scripts/bootstrap-first-admin.ts
```

That is PowerShell syntax because your current environment is Windows PowerShell.

## The practical local flow

The practical flow should feel like this:

1. start your local Postgres and app environment
2. make sure the `admins` collection exists in your schema
3. set the bootstrap email/password/name variables
4. run the bootstrap script intentionally
5. the script checks whether `admins` already has a record
6. if `admins` is empty, it creates the first admin
7. the script exits
8. you open `http://localhost:3000/admin`
9. you log in with the email and password you just created

That is the intended mental model.

## What happens when you open `/admin`

After the script has created the first admin record, opening `/admin` should behave like a normal admin login flow.

What you should expect:

1. Payload sees that the app has an `admins` auth collection configured for the admin panel
2. Payload sees that you are not yet logged in in this browser
3. Payload shows you the admin login screen
4. you enter the email/password that the bootstrap script created
5. Payload authenticates you
6. Payload sets the login cookie/session
7. you land in the admin interface

So the answer is:

- no auto-login
- yes normal login page
- yes the admin account now exists, so you have valid credentials to use there

## Why it does not auto-log you in

Logging in is not just "having a user in the database."

Logging in also means:

- the server authenticated your credentials
- the browser received an auth cookie or session
- the current browser is now recognized as that user

The script only handles the first part of the story:

- create the user record

The browser login flow handles the second part:

- create the authenticated session

That is why the script does not auto-log you in.

## What exists in the database after the script runs

After a successful first run, the important thing is:

- the `admins` collection now has one admin record

From that point on:

- `/admin` has a real admin account it can authenticate against
- you can log in normally
- later, that admin can create more admins from inside the admin UI, assuming access rules allow it

## If you rerun the script locally

If the script is written the way Part 3 recommends, it should:

- check whether an admin already exists
- do nothing if one already exists

So rerunning it should not keep creating new "first admins."

That is what makes it safe and idempotent for local use too.

## The mental model to keep

Think of the script like this:

- it is a one-time account creator

Think of `/admin` like this:

- it is still the normal login page

So the full story is:

- run the script to create the first admin account
- then use `/admin` normally to log in as that admin
