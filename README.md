# TanStack BaseStack

Opinionated SaaS boilerplate built on [TanStack Start](https://tanstack.com/start) (React 19, Vite, file-based router) with auth, database, and monitoring pre-configured.

## Quick Start

```bash
bun install
cp .env.example .env.local   # fill in your credentials
bun run dev                   # http://localhost:3000
```

## Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start + React 19 |
| Router | TanStack Router (file-based) |
| Auth | Better Auth (email/password) |
| Database | Neon Postgres + Drizzle ORM |
| UI | Tailwind CSS v4 + shadcn/ui |
| Forms | TanStack Form |
| Data fetching | TanStack Query + server functions |
| Client state | TanStack Store + TanStack DB |
| Monitoring | Sentry |
| i18n | use-intl |
| Lint/format | Biome |

## Commands

```bash
bun install          # install dependencies
bun run dev          # start dev server (port 3000)
bun run build        # production build
bun run check        # lint + format check
bun run test         # run tests

# Database
bun run db:generate  # generate drizzle migrations
bun run db:migrate   # apply migrations
bun run db:push      # push schema directly
bun run db:studio    # open drizzle studio
```

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `DATABASE_URL_POOLER` | No | Neon pooled connection (serverless) |
| `BETTER_AUTH_SECRET` | Yes | 32+ char secret (`bunx @better-auth/cli@latest secret`) |
| `BETTER_AUTH_URL` | Yes | App URL (default: `http://localhost:3000`) |
| `SENTRY_DSN` | No | Sentry project DSN |
| `SENTRY_ENVIRONMENT` | No | `development`, `preview`, or `production` |

Neon Launchpad can provision temporary credentials during development.

## Routes

| Path | Description |
|---|---|
| `/` | Redirects to `/admin` |
| `/sign-in` | Sign in form |
| `/sign-up` | Sign up form |
| `/admin` | Protected layout with sidebar |
| `/admin/` | Overview (seed data) |
| `/admin/users` | User management |
| `/admin/system` | System health |

## Project Structure

```
src/
├── db/schema.ts           # Drizzle schema (auth tables)
├── features/
│   ├── auth/AuthForm.tsx  # Sign-in / sign-up form
│   └── admin/model.ts     # Types, seed data, server fn, store, DB collection
├── routes/                # File-based routes
├── components/            # Shared UI (shadcn)
├── lib/                   # Auth client, i18n utils
└── messages/              # use-intl translation files
```

The admin dashboard renders static seed data out of the box — no database credentials needed for local preview. Connect Neon Postgres to enable full persistence.

## See Also

- `AGENTS.md` — project context, architecture decisions, gotchas
- `CONTEXT.md` — domain language and architectural boundaries
- `docs/agents/` — agent skill configuration
