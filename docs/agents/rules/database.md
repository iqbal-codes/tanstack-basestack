# Database Rules

> **Reference:** [`../boilerplate/database.md`](../boilerplate/database.md) — schema conventions, Drizzle query examples.

## Purpose

Controls database access patterns, schema management, query construction, and tenant isolation.

## When To Read This

- Adding or modifying a database table.
- Writing a new server function that queries the database.
- Adding a Drizzle migration.
- Reviewing a PR for database query patterns.

## Current Project Pattern

**ORM:** Drizzle ORM v0.45 with PostgreSQL dialect.

**Schema:** `src/db/schema.ts` — all table definitions using `pgTable` from `drizzle-orm/pg-core`. Auth tables (`user`, `session`, `account`, `verification`) plus generic `assets` and `assetVariants` tables.

**Database connection:** `src/db/index.ts` — connects to Postgres via `pg` Pool using the `DATABASE_URL` environment variable. `DATABASE_URL` is required in all environments.

**Migrations:** `drizzle-kit` with config at `drizzle.config.ts`. Migrations live in `drizzle/`. Scripts:
- `bun run db:generate` — generate migrations from schema changes.
- `bun run db:migrate` — apply migrations.
- `bun run db:push` — push schema directly (useful for development).
- `bun run db:studio` — open Drizzle Studio.

**Query patterns:** All queries go through the imported `db` instance. Queries use Drizzle's query builder with conditions, joins, and ordering.

## Non-Negotiable Rules

- MUST import `db` from `#/db/index` for all database access.
- MUST NOT use a raw `pg` Pool or `drizzle-orm/node-postgres` directly outside `src/db/index.ts`.
- MUST use Drizzle's query builder (`db.select()`, `db.insert()`, `db.update()`, `db.delete()`) — MUST NOT use raw SQL strings.
- MUST use `crypto.randomUUID()` for new record IDs.
- MUST NOT drop tables or alter schema except through Drizzle migrations.
- MUST narrow column selection in `db.select()` — use `db.select({ col1: table.col1, col2: table.col2 })` instead of `db.select()` to avoid fetching unused columns.
- MUST NOT use `LIKE '%term%'` or `ILIKE '%term%'` without a corresponding `pg_trgm` GIN index to prevent sequential scans.

## Implementation Checklist

1. Define the table in `src/db/schema.ts` using `pgTable`.
2. Add your own tenant column (e.g. `orgId`) if multi-tenancy is needed.
3. Run `bun run db:generate` to create the migration.
4. Write server functions that query the database.

## Verification

```
bun run typecheck
bun run db:generate   # verify migration is created
```

## Common Mistakes To Avoid

- Using a raw SQL string in a server function instead of Drizzle query builder.
- Importing `db` from a path other than `#/db/index`.
- Running `db:push` in production instead of using migrations.
