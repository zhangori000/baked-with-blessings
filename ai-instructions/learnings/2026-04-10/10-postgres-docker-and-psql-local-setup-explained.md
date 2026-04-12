# Postgres, Docker, and psql in This Repo

## Table of Contents

1. What `postgres:16-alpine` means
2. What `pnpm db:up` means
3. What `docker exec` means
4. What `psql -U ... -d ...` means
5. What this repo is doing right now
6. Are customers signing up with phone numbers right now?

## What `postgres:16-alpine` means

When you see `postgres:16-alpine` in [docker-compose.yml](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/docker-compose.yml), that is the Docker image name. `postgres` is the official PostgreSQL image, `16` is the PostgreSQL major version, and `alpine` means the image is built on Alpine Linux, which is a very small Linux distribution commonly used to keep containers lightweight. A `container` is a running instance of that image. So the plain-English meaning is: "run PostgreSQL version 16 inside a lightweight isolated environment on my machine." Docker is not a second database vendor here. Docker is just the thing running Postgres for you locally.

In this repo, the running database container is named `baked-with-blessings-postgres`. That name also comes from [docker-compose.yml](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/docker-compose.yml). The database inside that container is named `baked_with_blessings`, the database user is `postgres`, and the password is `postgres`. The port mapping `5432:5432` means your Windows machine exposes the Postgres service on port `5432`, and Docker forwards that traffic into the container's own Postgres port `5432`. So when Payload connects to `127.0.0.1:5432`, it is really talking to the Postgres process inside that Docker container.

## What `pnpm db:up` means

`pnpm db:up` is not a built-in pnpm command. It is a package script that this repo defines in [package.json](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/package.json). In the `scripts` section, `db:up` is defined as `docker compose up -d`. That means when you type `pnpm db:up`, pnpm looks in `package.json`, finds the command text for `db:up`, and runs it for you. So `pnpm db:up` is just a shortcut. It expands to "ask Docker Compose to start the services from `docker-compose.yml` in detached mode."

The `-d` flag means `detached`. Detached mode means the container keeps running in the background after the command returns. If you did not use `-d`, your terminal would stay attached to the container logs and look busy until you stopped it. That is why `pnpm db:up` is a useful local-dev command. It boots the database and then gives your terminal back. The matching script `pnpm db:down` runs `docker compose down`, which stops the containers, and `pnpm db:logs` runs `docker compose logs -f postgres`, which follows the Postgres logs in real time.

## What `docker exec` means

`docker exec` means "run a command inside an already-running container." It does not create a new container. It goes into the running one and launches a process there. So when you run a command like `docker exec baked-with-blessings-postgres ...`, you are saying: "inside the existing Postgres container, run the following command." That is useful because the Postgres client tools such as `psql` are already installed inside the Postgres container, even if they are not installed globally on your Windows machine.

You asked about `-t`, and the common pattern is actually `-it`. These are two separate flags. `-i` means "keep standard input open," which is what lets you interact with the process after it starts. `-t` means "allocate a terminal," which makes the shell experience behave like a real terminal session. When you use both together as `-it`, you get an interactive terminal inside the container. That is what you want for manually typing SQL commands. If you are just running a one-off query with `-c "select ..."` and do not need to interact, you can often omit `-it`.

## What `psql -U ... -d ...` means

`psql` is PostgreSQL's command-line client. It is the program that lets you open a SQL shell, list tables, inspect rows, and run queries manually. So in the command `psql -U postgres -d baked_with_blessings`, `psql` is the actual database client program. The flag `-U postgres` means "connect as the database user named `postgres`." The flag `-d baked_with_blessings` means "connect to the database named `baked_with_blessings`." So that full command means: "open the Postgres command-line shell, log in as the `postgres` database user, and connect to the `baked_with_blessings` database."

Once you are inside `psql`, commands like `\dt` are Postgres shell meta-commands, not normal SQL. `\dt` lists tables. A normal SQL query would look like `select id, email, name from admins;`. If you do not want to enter the shell interactively, you can run a one-off query from your normal terminal like this: `docker exec baked-with-blessings-postgres psql -U postgres -d baked_with_blessings -c "select id, email, name from admins;"`. In that form, the `-c` flag means "run this command text and exit."

## What this repo is doing right now

Right now, your app is using local Docker Postgres, not Neon. Payload is configured in [src/payload.config.ts](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/src/payload.config.ts) to use `@payloadcms/db-postgres`, and it reads the connection string from `DATABASE_URL`. In local development, that URL points at the Docker Postgres instance on `127.0.0.1:5432`. So the actual chain is: your Next/Payload app starts, Payload reads `DATABASE_URL`, that URL points to local Postgres, Docker is hosting that Postgres process, and your data is stored in the Docker volume named `postgres-data`. That is why your app works locally without Neon. Neon would be the likely managed Postgres choice later if you deploy this to Vercel and want a hosted database instead of a local container.

As of now, your `admins` table contains your real admin account, and the leftover test customers have been deleted. The customer-side auth and ecommerce records are physically stored in the real `customers` table now, not the legacy `users` table. So the current architecture is clean: `admins` for admin auth, `customers` for storefront auth and ecommerce, and `customers_sessions` for customer login sessions.

## Are customers signing up with phone numbers right now?

No. In the current codebase, customer signup is email-and-password only. You can see that in [CreateAccountForm](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/src/components/forms/CreateAccountForm/index.tsx), where the public create-account form only sends `email`, `password`, and `passwordConfirm` to `/api/customers`. The [Customers collection](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/src/collections/Customers/index.ts) also does not define a `phone` field on the customer document itself.

Phone numbers do exist elsewhere in the repo, but in a different role. Address forms collect phone numbers for billing or shipping addresses, and the ecommerce plugin has groundwork for a future guest-checkout contact method that can derive `email` or `phone` from those addresses. That is not the same thing as "customers can register with a phone number." So the accurate answer is: phone exists in address and checkout-related data, but phone-based account registration is not implemented right now.
