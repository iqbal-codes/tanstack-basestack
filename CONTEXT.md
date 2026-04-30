# CONTEXT

## What this is

A multi-tenant SaaS operations dashboard built on **TanStack Start** (React 19, Vite, file-based router). Organizations manage users, billing, and operational actions through a protected `/app` surface. Auth is email/password via **Better Auth** backed by **Neon Postgres** and **Drizzle ORM**.

## Ubiquitous vocabulary

| Term | Meaning |
|---|---|
| **Dashboard** | The `/app` surface — overview, billing, settings. Primary SaaS entry point after sign-in. |
| **Admin** | Protected `/admin` routes for user management, system health, and operational actions. |
| **Action** | A tracked operational task with status `Ready`, `Review`, or `Blocked`. Owned by a role. |
| **User** | An authenticated person with a role (`Owner`, `Admin`, `Operator`) and status (`Active`, `Invited`, `Suspended`). |
| **Better Auth** | The authentication layer. Manages `user`, `session`, `account`, and `verification` tables via Drizzle adapter. |
| **Server function** | A TanStack Start `createServerFn` — called from the client via TanStack Query. |
| **Store** | A TanStack Store holding client-side UI preferences (density, banner text). Not synced to server. |
| **Collection** | A TanStack DB local-only collection mirroring operational data (e.g., admin actions). Client-side only. |

## Architecture

```
src/
├── db/              # Drizzle schema (user, session, account, verification)
├── features/        # Feature modules (auth, admin) — server functions + types + stores
│   ├── auth/        # AuthForm component, sign-in/sign-up
│   └── admin/       # Admin model (types, seed data, server fn, store, collection)
├── routes/          # File-based TanStack Router routes
│   ├── index.tsx        # /
│   ├── sign-in.tsx      # /sign-in
│   ├── sign-up.tsx      # /sign-up
│   ├── admin.tsx        # /admin layout
│   └── admin/           # /admin/users, /admin/system
├── components/      # Shared UI (shadcn/ui wrappers)
├── integrations/    # TanStack Query provider wiring
├── lib/             # Auth client, i18n utils
└── messages/        # next-intl translation files
```

## Key decisions

- **Seed data over empty state**: The admin dashboard renders static seed data (`adminSummary`) so the UI works without database credentials.
- **Local-only TanStack DB**: Operational signals (admin actions) live in client-side collections. Server sync is a future extension.
- **Billing-ready, not billing-active**: `subscriptions` table structure exists in the planned schema but no payment processor is integrated.
- **i18n from day one**: All user-facing strings use `use-intl` / `next-intl`. Translation files in `src/messages/`.
- **shadcn/ui components only**: No emoji or icon libraries outside lucide-react (which shadcn ships).

## Boundaries

| Boundary | Tech |
|---|---|
| Data fetching | TanStack Query → TanStack Start server functions |
| Client state | TanStack Store (UI prefs) + TanStack DB (operational data) |
| Persistence | Neon Postgres via Drizzle (server), local-only DB collections (client) |
| Auth | Better Auth with Drizzle adapter, cookie-based sessions |
| Routing | TanStack Router, file-based, SSR query integration |
| Forms | TanStack Form (auth forms, forecast planning) |
| Monitoring | Sentry via `@sentry/tanstack-start` |
| Styling | Tailwind CSS v4 + shadcn/ui |

## Current state

The app runs with static seed data. Database tables are defined but not yet wired to real Neon queries. Auth flow (sign-in/sign-up) is functional. Admin routes are protected. Next steps: connect real Neon queries, add org membership guards, wire billing tables.
