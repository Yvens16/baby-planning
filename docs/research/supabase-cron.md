# How do Supabase cron jobs run an unattended due-check?

Ticket: [How do Supabase cron jobs run an unattended due-check?](https://github.com/Yvens16/baby-planning/issues/2)

Question: the scheduler is Supabase cron, not GitHub Actions. What is the current first-party mechanism, what can it invoke, what is the minimum interval, how do secrets work, and what differs between local CLI/Docker and a hosted project? We need a due-check every few minutes that finds due Reminders and requests Delivery, with no machine of our own.

## Answer

The first-party mechanism is **Supabase Cron**: a Postgres module whose engine is the `pg_cron` extension. There is no separate “scheduled Edge Functions” scheduler. A job is a row in `cron.job`. It runs SQL (a snippet, a function, or a procedure) on the database’s own clock. To reach an Edge Function or any HTTP endpoint, that SQL calls `pg_net` (`net.http_post`). The hosted project is the worker. No GitHub Actions runner and no machine of ours is required.

Minimum interval is **1 second** on Postgres 15.1.1.61 or later (`N seconds`, 1–59). Standard five-field cron (`* * * * *`) is every minute. A due-check every few minutes is `*/5 * * * *` (or `* * * * *`).

Secrets used *from SQL* (the URL and `apikey` that `pg_net` sends) belong in **Vault** and are read at call time from `vault.decrypted_secrets`. Secrets used *inside* an Edge Function (Twilio, and so on) are a different store: Edge Function environment variables (`supabase secrets set` hosted; `supabase/functions/.env` locally).

Local CLI/Docker can enable the same extensions and run the same SQL. The Dashboard Cron UI, hosted Vault root-key management, and the function URL (`https://<ref>.supabase.co` vs `http://host.docker.internal:54321`) differ.

## Mechanism: Supabase Cron = pg_cron, not a second scheduler

Supabase Cron is “a Postgres Module that simplifies scheduling recurring Jobs with cron syntax and monitoring Job runs inside Postgres.” Jobs are created via SQL or **Integrations → Cron** in the Dashboard. Under the hood it uses `pg_cron`. That extension creates a `cron` schema; jobs live in `cron.job`; each run is recorded in `cron.job_run_details`. ([Supabase Cron](https://supabase.com/docs/guides/cron); install: [Install](https://supabase.com/docs/guides/cron/install); product page: [Supabase Cron module](https://supabase.com/modules/cron))

Enable it:

```sql
create extension pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
```

Dashboard path: Integrations → Cron Postgres Module → enable `pg_cron`. Dropping the extension permanently deletes all jobs. ([Install](https://supabase.com/docs/guides/cron/install))

`pg_cron` itself is a background worker that tracks jobs in `cron.job` and then opens a connection (or a background worker) to run the command. It can run multiple jobs in parallel, but only one instance of a given job at a time; a second fire queues until the first finishes. ([citusdata/pg_cron README](https://github.com/citusdata/pg_cron/blob/main/README.md))

**Scheduling Edge Functions is the same engine.** The functions guide is titled “Schedule Edge Functions with pg_cron.” It states that the hosted platform supports `pg_cron`, and that combining it with `pg_net` “allows us to invoke Edge Functions periodically.” There is no other first-party timer. ([Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions))

The extension page for `pg_cron` redirects to the Cron module docs. ([pg_cron extension stub](https://supabase.com/docs/guides/database/extensions/pg_cron))

Supabase lists `pg_cron` in `shared_preload_libraries` of the official Postgres image, together with `pg_net` and `supabase_vault`. ([supabase/postgres `postgresql.conf.j2`](https://github.com/supabase/postgres/blob/21338c84/ansible/files/postgresql_config/postgresql.conf.j2))

## What a job can invoke

Official Cron docs: every job can “run SQL snippets or database functions with zero network latency or make an HTTP request, such as invoking a Supabase Edge Function.” Recommended: no more than 8 jobs concurrent; each job no more than 10 minutes. ([Supabase Cron](https://supabase.com/docs/guides/cron))

The Dashboard create form and the module page name four targets: SQL snippet, database function, HTTP request, Supabase Edge Function. ([Cron quickstart](https://supabase.com/docs/guides/cron/quickstart); [Supabase Cron module](https://supabase.com/modules/cron))

Documented SQL shapes ([Cron quickstart](https://supabase.com/docs/guides/cron/quickstart)):

| Target | Example schedule command |
| --- | --- |
| SQL snippet | `$$ delete from events where event_time < now() - interval '1 week' $$` |
| Database function | `'SELECT hello_world()'` |
| Stored procedure | `'CALL my_procedure()'` |
| Edge Function / HTTP | `net.http_post(url := '.../functions/v1/function-name', ...)` — requires `pg_net` |

`pg_net` queues an async HTTP request; the request does not start until the transaction commits. `net.http_post` is JSON-only. Default timeout is 2000 ms (examples often pass 5000). Responses live in `net._http_response` for 6 hours by default. The Data API does not expose the `net` schema. ([pg_net](https://supabase.com/docs/guides/database/extensions/pg_net))

Job names are case-sensitive and cannot be edited. A second `cron.schedule` with the same name overwrites (upserts) the first. Unscheduling deletes the row from `cron.job` but leaves `cron.job_run_details`. That history table is not cleaned automatically. ([Cron quickstart](https://supabase.com/docs/guides/cron/quickstart); same cleanup warning in [citusdata/pg_cron README](https://github.com/citusdata/pg_cron/blob/main/README.md))

## Minimum interval

| Claim | Source |
| --- | --- |
| Jobs “can run anywhere from every second to once a year” | [Supabase Cron](https://supabase.com/docs/guides/cron) |
| Minimum interval: 1 second; sub-minute via `[1-59] seconds` (e.g. `'30 seconds'`) | [Supabase Cron module](https://supabase.com/modules/cron); [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart) |
| Seconds schedules require **Postgres 15.1.1.61 or later** | [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart) |
| Upstream: `'10 seconds'` / `'30 seconds'`; “you cannot use seconds with the other time units”; `* * * * *` = every minute; `*/5 * * * *` = every 5 minutes | [citusdata/pg_cron README](https://github.com/citusdata/pg_cron/blob/main/README.md) |
| Seconds interval added in pg_cron v1.5.0 | [pg_cron CHANGELOG](https://github.com/citusdata/pg_cron/blob/main/CHANGELOG.md) |

The older `pg_net` page still says pg_cron schedules HTTP “with up to a minute precision.” That is the five-field cron floor, not the current Cron-module seconds syntax. Prefer the Cron quickstart + pg_cron README for interval. ([pg_net](https://supabase.com/docs/guides/database/extensions/pg_net))

Five-field cron in the official chart is minute / hour / day-of-month / month / day-of-week. Examples of wall-clock jobs are labeled **GMT** (`'30 3 * * 6'`, `'0 3 * * *'`). ([Cron quickstart](https://supabase.com/docs/guides/cron/quickstart)) Upstream default `cron.timezone` is `GMT`. ([citusdata/pg_cron README](https://github.com/citusdata/pg_cron/blob/main/README.md)) Hosted databases default to UTC; changing `timezone` is possible but not recommended. ([Database configuration](https://supabase.com/docs/guides/database/postgres/configuration))

A due-check every few minutes does not need seconds: `'*/5 * * * *'` is the documented every-5-minutes form.

## Secrets

Two stores. Do not mix them.

### 1. Vault — keys the *database* must send (cron / `pg_net`)

Vault is a Postgres extension plus Dashboard UI. Secrets are stored encrypted on disk and decrypted only through `vault.decrypted_secrets`. Use `vault.create_secret(value)` or `vault.create_secret(value, unique_name, description)`. Restrict who can read the decrypted view. ([Vault](https://supabase.com/docs/guides/database/vault))

The functions guide’s first step for a scheduled Edge Function is to put `project_url` and `publishable_key` in Vault, then read them in the cron command so they are not plaintext in `cron.job`:

```sql
select vault.create_secret('https://project-ref.supabase.co', 'project_url');
select vault.create_secret('YOUR_SUPABASE_PUBLISHABLE_KEY', 'publishable_key');
```

```sql
select cron.schedule(
  'invoke-function-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/function-name',
    headers := jsonb_build_object(
      'Content-type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
    ),
    body := concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
```

([Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions))

**New API keys (publishable / secret):** they are not JWTs. `pg_net` / Database Webhooks / cron must send the secret key on the **`apikey` header**, not `Authorization: Bearer`. Do not hardcode a secret key in SQL; store it in Vault and select it at call time. The platform `verify_jwt` check only understands legacy JWT keys; functions called this way set `verify_jwt = false` and authorize in code (or via `@supabase/server` `auth: 'secret'`). ([Migrating to publishable and secret API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys); [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth))

Hosted Vault encryption: each project has a root key managed by Supabase, kept out of the database. Pause/restore and in-place PITR keep the same key. Restore-to-new-project and Branching copy it. A manual `pg_dump` / `pg_restore` into a new project does **not**; that project gets a new key and cannot decrypt copied secrets unless the old hex root key is copied via the pgsodium Management API. ([Vault](https://supabase.com/docs/guides/database/vault))

### 2. Edge Function environment — keys the *function* uses (Twilio, etc.)

Default hosted/local function env includes `SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_JWKS` (plus legacy `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`). Custom secrets are `Deno.env.get(...)`.

- **Local:** `supabase/functions/.env` is loaded on `supabase start`, or pass `--env-file` to `supabase functions serve`.
- **Hosted:** Dashboard Edge Function Secrets, or `supabase secrets set KEY=value` / `supabase secrets set --env-file .env`. Secrets are live without a redeploy.

([Environment Variables](https://supabase.com/docs/guides/functions/secrets))

Service-to-service callers (cron, workers, `pg_net`) send a **secret** key on `apikey`. Disable `verify_jwt` and use `auth: 'secret'` (or `auth: 'secret:<name>'` for one named key). That yields `ctx.supabaseAdmin` (bypasses RLS) — the shape a due-check that reads all Families’ due Reminders needs. ([Securing Edge Functions](https://supabase.com/docs/guides/functions/auth))

The schedule-functions example still stores a **publishable** key. That matches `auth: 'publishable'`. A due-check that must see every due Reminder should prefer a **secret** key in Vault and `auth: 'secret'`.

## Local CLI / Docker vs hosted project

| | Hosted project | Local CLI / Docker |
| --- | --- | --- |
| Worker | Hosted Postgres. `pg_cron` runs inside the project. No machine of ours. ([Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions); [Supabase Cron](https://supabase.com/docs/guides/cron)) | `supabase start` runs the stack in Docker. Same image preloads `pg_cron`, `pg_net`, `supabase_vault`. ([CLI getting started](https://supabase.com/docs/guides/local-development/cli/getting-started); [supabase/postgres `postgresql.conf.j2`](https://github.com/supabase/postgres/blob/21338c84/ansible/files/postgresql_config/postgresql.conf.j2)) |
| Enable Cron | Dashboard Integrations → Cron, or the SQL above. ([Install](https://supabase.com/docs/guides/cron/install)) | Same SQL. `pg_cron` **must** be created in `pg_catalog`, not `extensions`. ([Install](https://supabase.com/docs/guides/cron/install); confirmed on local CLI in [supabase/supabase#28261](https://github.com/supabase/supabase/issues/28261)) |
| Job UI | Integrations → Cron: create, edit, activate, history. ([Supabase Cron](https://supabase.com/docs/guides/cron); [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart)) | Local Studio is on the stack (`http://127.0.0.1:54323`). Jobs are still rows you manage with SQL / migrations; the hosted Integrations Cron screen is a hosted-project URL. ([CLI getting started](https://supabase.com/docs/guides/local-development/cli/getting-started); [module dashboard path](https://supabase.com/modules/cron)) |
| Edge Function URL | `https://<project-ref>.supabase.co/functions/v1/<name>` after `supabase functions deploy`. ([Functions quickstart](https://supabase.com/docs/guides/functions/quickstart)) | From the host: `http://127.0.0.1:54321/functions/v1/<name>`. From **inside** the Postgres container, `localhost` is the container: use `http://host.docker.internal:54321/functions/v1/<name>`. ([Functions quickstart](https://supabase.com/docs/guides/functions/quickstart); [Database Webhooks — local development](https://supabase.com/docs/guides/database/webhooks)) |
| Function secrets | Dashboard or `supabase secrets set`. ([Environment Variables](https://supabase.com/docs/guides/functions/secrets)) | `supabase/functions/.env` or `--env-file`. Local CLI also accepts singular `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`. ([Environment Variables](https://supabase.com/docs/guides/functions/secrets); [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth)) |
| Vault keys | Per-project root key, Management API, Branching/restore rules above. ([Vault](https://supabase.com/docs/guides/database/vault)) | Same SQL API if `supabase_vault` is loaded (it is in the image preload list). Hosted root-key / pgsodium Management API is a hosted-project concern. |

`cron.database_name` defaults to `postgres`. Jobs must be created in that database. Self-hosted custom `POSTGRES_DB` has hit this; the default local/hosted database name is `postgres`. ([citusdata/pg_cron README](https://github.com/citusdata/pg_cron/blob/main/README.md); [supabase/supabase#42413](https://github.com/supabase/supabase/issues/42413))

The functions guide’s sentence “The hosted Supabase Platform supports the `pg_cron` extension” is about the **hosted** product. Local support is the same extension in the CLI Postgres image, enabled with SQL, not a second product. ([Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions))

## Implication for the due-check

Unattended due-check, no machine of ours:

1. On the **hosted** project, enable `pg_cron` (and `pg_net` if the job HTTP-POSTs).
2. Put the job in a migration: `cron.schedule('due-check', '*/5 * * * *', ...)`. Five minutes is the documented `*/5` form; one minute is `* * * * *`. Seconds are available if something later needs them.
3. Two first-party shapes, both valid:
   - **SQL only:** `SELECT find_due_and_request_delivery()` (or `CALL ...`). Lowest latency; Delivery HTTP would still need `pg_net` from that function.
   - **Edge Function:** cron → `net.http_post` to `/functions/v1/<due-check>` with Vault-stored URL + **secret** `apikey`; function uses `auth: 'secret'`, `verify_jwt = false`, reads due Reminders with `ctx.supabaseAdmin`, requests Delivery (Twilio lives in function env secrets).
4. Do not put the secret key in the job command text. Vault for SQL-side keys; `supabase secrets set` for function-side keys.
5. Local: same migration, but the function URL must be the Docker-reachable host (`host.docker.internal:54321`), and function secrets come from `.env`. Hosted cron calling `https://<ref>.supabase.co/functions/v1/...` is the production path.

`pg_net` is fire-and-forget from the job’s point of view (request id, then poll `net._http_response`). Failed Delivery staying due and retrying is application state, not a Cron feature.

## Sources

- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart)
- [Cron install](https://supabase.com/docs/guides/cron/install)
- [Supabase Cron module](https://supabase.com/modules/cron)
- [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [pg_cron extension stub](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net)
- [Vault](https://supabase.com/docs/guides/database/vault)
- [Environment Variables (Edge Functions)](https://supabase.com/docs/guides/functions/secrets)
- [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Migrating to publishable and secret API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)
- [Functions quickstart](https://supabase.com/docs/guides/functions/quickstart)
- [Database Webhooks (local URL)](https://supabase.com/docs/guides/database/webhooks)
- [CLI getting started](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Database configuration (timezone)](https://supabase.com/docs/guides/database/postgres/configuration)
- [citusdata/pg_cron README](https://github.com/citusdata/pg_cron/blob/main/README.md)
- [pg_cron CHANGELOG](https://github.com/citusdata/pg_cron/blob/main/CHANGELOG.md)
- [supabase/postgres `postgresql.conf.j2` (preload list)](https://github.com/supabase/postgres/blob/21338c84/ansible/files/postgresql_config/postgresql.conf.j2)
- [supabase/supabase#28261](https://github.com/supabase/supabase/issues/28261) (local `pg_catalog` schema)
- [supabase/supabase#42413](https://github.com/supabase/supabase/issues/42413) (`cron.database_name`)
