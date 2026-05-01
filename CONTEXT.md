# CONTEXT

## What this is

**Pabriq** — a multi-tenant MTO (Made-To-Order) SaaS platform built on **TanStack Start** (React 19, Vite, file-based router). Target: custom merchandise, printing, furniture, clothing, and any operation that produces to order.

## Ubiquitous vocabulary

| Term | Meaning |
|---|---|
| **Organization** | A tenant — an MTO business using Pabriq. Has its own subdomain (`{slug}.localhost:3000`), members, settings, and data. |
| **Owner** | Full-access org member. Can delete org, manage billing, configure everything. |
| **Admin** | Operations lead. Manages orders, products, customers, members, settings. Cannot delete org. |
| **Member** | Basic org member. Can view and create certain resources. Read-limited. |
| **Operator** | Shop floor worker. Sees production menu only. Can advance tasks through kanban stages. |
| **Customer** | External — places/completes orders via secure token link (no login). |
| **Subdomain** | The org identifier in the URL. `acme.pabriq.com` → resolves org by slug. |
| **Better Auth** | Auth layer. Manages users, sessions, orgs, members, invitations via Drizzle adapter. Organization plugin enabled. |
| **RLS** | Row-Level Security. `org_id` column on every business table. Filtered via Postgres `set_config('app.current_org_id', ...)`. |
| **Server function** | TanStack Start `createServerFn` — type-safe RPC, called from router or client. |
| **Application Component** | Project-wide reusable UI composition used across internal workspace and public flows. Built from shadcn/ui primitives and TanStack libraries; must not assume authentication, organization membership, or a specific route context. |
| **Application Data Table** | Application Component for workspace resource lists. Renders server-backed table/card views from feature-owned data, URL state, filters, permissions, and actions. |
| **Apex** | The root domain (`pabriq.com`, `localhost:3000`). Sign-in, sign-up, org management. No org context. |

## Architecture

```
src/
├── db/              # Drizzle schema (auth + org tables)
├── features/        # domain modules (auth/org, etc.)
├── routes/
│   ├── __root.tsx        root layout
│   ├── sign-in.tsx       /sign-in
│   ├── sign-up.tsx       /sign-up
│   ├── orgs/             /orgs, /orgs/new  — org picker/creation
│   ├── _org.tsx          pathless layout — org resolution via subdomain
│   └── _org/             org-scoped routes (dashboard, orders, etc.)
├── components/      # Shared UI (shadcn/ui wrappers)
├── lib/             # Auth client, RLS helpers, subdomain utils
└── messages/        # next-intl translation files
```

## Key decisions

- **Subdomain multi-tenancy**: orgs identified by subdomain (`{slug}.localhost:3000`). Middleware in `_org.tsx`'s `beforeLoad` resolves org from host header, validates membership, sets RLS context.
- **Better Auth org plugin**: handles org CRUD, member management, invitations, and RBAC via `createAccessControl()`.
- **RLS for data isolation**: `org_id` FK on all business tables. Policy filters by `current_setting('app.current_org_id')`.
- **Single-tenant mode available**: `VITE_ENABLE_ORGANIZATIONS=false` hides org switcher and creation, behaves like a white-label app. Underlying schema stays multi-tenant-ready.
- **i18n from day one**: All user-facing strings use `use-intl` / `next-intl`.
- **shadcn/ui only**: No emoji or icon libraries outside lucide-react.

## Current state

**Completed — Slice 1: Subdomain Auth + Organization Flow**
- Better Auth org plugin configured with owner/admin/member/operator roles
- Orgs picker and creation flow at apex domain
- Subdomain resolution in `_org` layout route
- RLS helpers for org-scoped queries
- Old `/admin` routes removed
- Route tree regenerated with new structure
- Biome check passing
- Session cookie shared across subdomains (`.localhost`)

**Next**: Wire real Neon queries into dashboard, add order intake flow, build core MTO features.
