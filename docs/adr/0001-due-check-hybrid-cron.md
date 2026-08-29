# Due-check: hybrid SQL query + Edge Function worker on a 5-minute cron

Ticket: [How does the due-check run: SQL in pg_cron or an Edge Function, and on what interval?](https://github.com/Yvens16/baby-planning/issues/13)

Hosted `pg_cron` fires every five minutes (`*/5 * * * *`) and `pg_net` POSTs to a `due-check` Edge Function. The function finds due Reminders via a SQL view or RPC, then orchestrates Delivery (Twilio) in TypeScript. Twilio credentials stay in Edge Function env; Vault holds the project URL and secret `apikey` for cron → function auth (`verify_jwt = false`, admin client bypassing RLS for the cross-Family job).

**Considered options:** SQL-only (cron runs PL/pgSQL and calls Twilio from SQL/`pg_net`) was rejected — Twilio Utility templates, error taxonomy, retry semantics, and TDD for send are poor fits for PL/pgSQL. Pure Edge Function with the due query in TypeScript was viable; SQL for the due query keeps the “what is due?” predicate testable and close to the data.

**Consequences:** Two deployables (migration scheduling cron + Edge Function). Two secret stores (Vault for cron/`pg_net`, function env for Twilio). Due query uses `due <= now() AND delivered_at IS NULL` (past Due at create sends on next tick; successful Delivery sets `delivered_at`).
