# 2026-04-10: Payload Auth Part 5, Dev and Production Bootstrap on Vercel

## Table of contents

- [Why this Part 5 exists](#why-this-part-5-exists)
- [What Vercel is, in plain English](#what-vercel-is-in-plain-english)
- [How Preview and Production fit your app](#how-preview-and-production-fit-your-app)
- [How first-admin bootstrap fits into that model](#how-first-admin-bootstrap-fits-into-that-model)
- [What `vercel env run`, `vercel env pull`, and `vercel pull` actually mean](#what-vercel-env-run-vercel-env-pull-and-vercel-pull-actually-mean)
- [What I would do for your app](#what-i-would-do-for-your-app)
- [Practical command examples](#practical-command-examples)
- [Official docs](#official-docs)

## Why this Part 5 exists

Part 4 focused on local behavior. This Part 5 answers the next question: once this app is deployed somewhere real, especially on Vercel, how do you create the first admin safely without relying on a public web page, and how should you think about local, preview, and production as different places your app can live?

## What Vercel is, in plain English

Vercel is a hosting and deployment platform for web apps. In the most common setup, you connect your GitHub repository to Vercel, Vercel watches that repository, and when you push code it builds the app and creates a deployment. A deployment is a built, runnable version of your app with its own URL. Vercel then serves that deployment on its infrastructure so people on the internet can access it. Their docs explain that requests enter Vercel's global network through anycast routing and are handled across many locations, which is why people use Vercel for fast public sites without manually running their own Linux server, reverse proxy, and scaling setup. The important mental model is that Vercel is not "your laptop on the internet." It is a platform that takes your code, builds it, stores the build result as a deployment, and serves it to users.

For you, that means there are really two separate concerns. One concern is application code: your Next.js and Payload app. The other concern is operations: where that code runs, which environment variables it sees, and which database it talks to. Vercel handles a lot of the second part for you. That is why the same codebase can behave differently in local, preview, and production without you having three different apps.

## How Preview and Production fit your app

Vercel has a built-in environment model. The one that matters most for you right now is `Development`, `Preview`, and `Production`. `Development` is your local machine. `Preview` is the non-production cloud version, usually created from a branch push or pull request so you can test work before release. `Production` is the live public deployment people are supposed to use. So yes, the split you said you liked is real and standard on Vercel, and I agree it is a good fit for your app. In practice, your mental model should be: local is where you build and experiment, preview is where you test a cloud deployment before release, and production is the public real site.

What changes between those environments is usually not the code file itself. What changes is the environment context: which database URL is present, which secret keys are present, which domain is being used, whether you are okay with test data, and whether this environment is public-facing. That is why I kept saying "same script, different environment context." I was not trying to be vague. I meant that the bootstrap logic does not need to be rewritten three times. What changes is which environment variables and database that one script is pointed at.

## How first-admin bootstrap fits into that model

Your first-admin bootstrap should be treated as an intentional setup action, not as a page that just happens to be lying around on the public web. In local, that action creates the first admin in your local database. In preview, it creates the first admin in the preview database. In production, it creates the first admin in the production database. The shape of the action stays the same. The target changes.

That also answers the "is there a dev CLI and a production CLI?" question. No, not in the sense you were imagining. There is not one special Payload CLI for dev and a separate secret Payload CLI for production. There is also not one Vercel CLI for preview and another for production. It is the same tools, aimed at different environments. The command is not magical. What makes it local, preview, or production is the environment configuration around it.

This is also why Postman is usually the wrong tool for first-admin bootstrap. Postman is mainly for sending HTTP requests to an API endpoint. But the whole point of the private bootstrap-script approach is to avoid turning first-admin creation into a public or semi-public HTTP endpoint. If you create `/api/bootstrap-admin` and then hit it from Postman, you are back in the world of web-exposed bootstrap flows, which is the thing we have been trying to get away from.

## What `vercel env run`, `vercel env pull`, and `vercel pull` actually mean

This section is where the Vercel CLI starts making sense. First, `vercel env run` means: "run this command on my machine, but before you run it, inject the environment variables from my Vercel project for the environment I name." So if you run a bootstrap script with `vercel env run -e production -- ...`, the script is still executing on your machine or in CI, not on some mystery shell inside Vercel. The difference is that the script sees the production environment variables, such as the production database URL and Payload secret, so it behaves as if it were operating against production.

`vercel env pull` is different. That command downloads environment variables from Vercel into a local file, usually an `.env` file. In other words, instead of temporarily injecting variables for one command, it writes them down locally so other tools can use them afterward. That can be useful if you want your local shell or local tooling to keep using that environment for a while. `vercel pull` is related, but it is broader. It links and syncs local project settings from Vercel so local Vercel-aware workflows like `vercel build` and `vercel dev` know which project and environment they are dealing with. If `vercel env run` is the "inject env vars for one command" tool, then `vercel env pull` is the "download env vars into a file" tool, and `vercel pull` is the "sync the project to my local machine so Vercel CLI knows what this repo is connected to" tool.

The reason these commands matter for first-admin bootstrap is simple: your bootstrap script needs the right database connection and secrets. Without those, it does not know whether it is creating an admin in local, preview, or production. So the Vercel CLI is not the thing that creates the admin by itself. It is the thing that gives your normal Node/TypeScript bootstrap script the right environment to act on.

## What I would do for your app

Because you are early, I would keep this simple. I would treat your environments as `local`, `preview`, and `production`. I would keep one private bootstrap script in the repo. I would never expose first-admin creation through a public route. I would use separate environment variables and separate databases for preview and production. I would run the same script intentionally when a given environment needs its first admin, and I would make that script exit safely if an admin already exists so it can be rerun without damage.

For your Vercel setup, I would think about it this way. Local is where you personally develop. Preview is your cloud test environment. Production is the real public site. If preview needs an admin, you run the bootstrap script against preview. If production needs an admin, you run the same script against production. You are not clicking a public setup page. You are not using Postman. You are not creating a second code path. You are taking one private script and pointing it at the correct target.

## Practical command examples

If your repo is linked to Vercel, a clean preview bootstrap command would look like this:

```bash
vercel env run -e preview -- pnpm exec tsx scripts/bootstrap-first-admin.ts
```

A clean production bootstrap command would look like this:

```bash
vercel env run -e production -- pnpm exec tsx scripts/bootstrap-first-admin.ts
```

What those commands mean in plain English is: "run my bootstrap script, but give it the preview or production environment variables from Vercel first." The script itself is still your script. `pnpm exec tsx ...` is still the TypeScript runner we already discussed in Part 3. Vercel is just supplying the correct environment context.

If you prefer downloading the environment variables first, the flow can be more like this:

```bash
vercel env pull .env.preview.local --environment=preview
pnpm exec tsx scripts/bootstrap-first-admin.ts
```

or:

```bash
vercel env pull .env.production.local --environment=production
pnpm exec tsx scripts/bootstrap-first-admin.ts
```

That version is a bit more "manual" because now the environment variables exist locally in a file first. Some people like that because it feels more visible. Others prefer `vercel env run` because the variables are only injected for that one command. For your current stage, I would lean toward `vercel env run` because it is cleaner and harder to misuse.

## Official docs

- [How requests flow through Vercel](https://vercel.com/docs/getting-started-with-vercel/fundamental-concepts/infrastructure)
- [Deploying to Vercel](https://vercel.com/docs/platform/deployments)
- [Environment variables](https://vercel.com/docs/environment-variables)
- [Environments / custom environments](https://vercel.com/docs/deployments/custom-environments)
- [vercel env](https://vercel.com/docs/cli/env)
- [vercel pull](https://vercel.com/docs/cli/pull)
