# 00 — BaseStack Overview & Architecture

> Agnostic production-ready SaaS boilerplate for ERP, CRM, OMS, LMS, and any multi-tenant business application.

## Project Rename

| Old                                     | New              |
| --------------------------------------- | ---------------- |
| `package.json#name` → `my-tanstack-app` | `@basestack/app` |
| `appName` in auth.ts → `LedgerPilot`    | `BaseStack`      |

## Architecture Layers

```
┌──────────────────────────────────────────────────────────┐
│                    TanStack Start (Vite 8)                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ File Router  │  │ Server Fns   │  │ SSR + Streaming │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  React 19 + Tailwind CSS v4 + shadcn/ui (new-york/zinc) │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Query    │ │ Form     │ │ Table    │ │ Virtual    │  │
│  │ (server  │ │ (type-   │ │ (head-   │ │ (large     │  │
│  │  state)  │ │  safe)   │ │  less)   │ │  lists)    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Store    │ │ DB       │ │ Pacer    │ │ Ranger     │  │
│  │ (client  │ │ (client- │ │ (debounce│ │ (sliders)  │  │
│  │  state)  │ │  side)   │ │ throttle)│ │            │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
├──────────────────────────────────────────────────────────┤
│              Business Logic Layer (src/features/)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ auth     │ │ tenants  │ │ billing  │ │ workflow   │  │
│  │ (Better  │ │ (org +   │ │ (Stripe  │ │ (xstate    │  │
│  │  Auth)   │ │  RLS)    │ │  subs)   │ │  machines) │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ audit    │ │ notifica-│ │ files    │ │ api        │  │
│  │ (change  │ │ tions    │ │ (S3/R2)  │ │ (REST      │  │
│  │  log)    │ │ (in-app  │ │          │ │  v1)       │  │
│  │          │ │ +email)  │ │          │ │            │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
├──────────────────────────────────────────────────────────┤
│              Data Layer (src/db/)                         │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Drizzle ORM + Neon Postgres (pooled)              │    │
│  │ ┌─────────┐ ┌──────────┐ ┌───────────────────┐   │    │
│  │ │ RLS     │ │ Migrations│ │ PGlite fallback   │   │    │
│  │ │ policies│ │ (drizzle- │ │ (offline dev)     │   │    │
│  │ │ per org │ │  kit)     │ │                   │   │    │
│  │ └─────────┘ └──────────┘ └───────────────────┘   │    │
│  └──────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────┤
│              Infrastructure                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Docker   │ │ GitHub   │ │ Redis    │ │ S3/R2      │  │
│  │ (multi-  │ │ Actions  │ │ (bullmq  │ │ (file      │  │
│  │  stage)  │ │ CI/CD    │ │  queue)  │ │  storage)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Sentry   │ │ Pino     │ │ OpenTele-│ │ Resend     │  │
│  │ (errors) │ │ (logs)   │ │ metry    │ │ (email)    │  │
│  │          │ │          │ │ (traces) │ │            │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Directory Conventions

```
src/
├── components/          # Shared UI components
│   ├── app-sidebar.tsx
│   ├── breadcrumbs.tsx        # (new) auto breadcrumbs
│   ├── command-palette.tsx    # (new) cmd+k search
│   ├── data-table/            # (new) reusable TanStack Table
│   ├── nav-main.tsx
│   ├── nav-org.tsx            # (new) org switcher
│   ├── nav-user.tsx
│   ├── not-found.tsx
│   └── ui/                    # shadcn/ui (never edit)
├── db/
│   ├── index.ts               # DB connection + RLS helpers
│   ├── schema/
│   │   ├── auth.ts            # Better Auth tables
│   │   ├── core.ts            # org, user, membership
│   │   ├── billing.ts         # plans, subscriptions, invoices
│   │   ├── audit.ts           # audit_log
│   │   ├── notifications.ts   # in-app notifications
│   │   ├── customers.ts       # CRM contacts/companies
│   │   ├── orders.ts          # OMS orders
│   │   └── inventory.ts       # LSM inventory
│   ├── seed.ts                # PGlite DDL
│   └── migrations/            # drizzle-kit output
├── features/
│   ├── auth/                  # Auth forms, session helpers
│   ├── tenants/               # Org CRUD, member management
│   ├── rbac/                  # Permissions, access control
│   ├── billing/               # Plans, Stripe webhooks
│   ├── audit/                 # Audit log queries + UI
│   ├── notifications/         # Notification center
│   ├── files/                 # Upload presigned URLs
│   ├── workflow/              # State machines
│   ├── api/                   # REST API handlers
│   └── admin/                 # Dashboard (already exists)
├── lib/
│   ├── auth.ts                # Better Auth server config
│   ├── auth-client.ts         # Better Auth client
│   ├── auth-session.ts        # getCurrentSession server fn
│   ├── i18n.ts                # Locale helpers
│   ├── i18n.utils.ts          # URL localization
│   ├── rls.ts                 # (new) RLS helpers
│   ├── queue.ts               # (new) bullmq connection
│   ├── email.ts               # (new) react.email sender
│   ├── storage.ts             # (new) S3 client
│   ├── logger.ts              # (new) Pino logger
│   └── utils.ts               # cn() shadcn helper
├── messages/                  # use-intl translations
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   ├── admin.tsx
│   ├── admin/
│   ├── app/                   # (new) tenant-scoped routes
│   │   ├── $orgSlug.tsx       # org layout + RLS guard
│   │   └── $orgSlug/
│   └── api/
│       ├── auth/$.ts
│       └── v1/                # (new) versioned REST API
├── router.tsx
└── styles.css
```

## Tech Stack Summary

| Layer    | Choice                                  | Version |
| -------- | --------------------------------------- | ------- |
| Runtime  | TanStack Start + React 19 + Vite 8      | latest  |
| Language | TypeScript                              | 6.0     |
| Auth     | Better Auth                             | 1.5+    |
| Database | Neon Postgres (pooled)                  | —       |
| ORM      | Drizzle ORM                             | 0.45+   |
| UI       | shadcn/ui new-york + Tailwind v4        | latest  |
| Forms    | TanStack Form + react-hook-form + zod 4 | latest  |
| Tables   | TanStack Table                          | 8.21+   |
| Charts   | Recharts                                | 3.8     |
| i18n     | use-intl                                | 4.11    |
| Queue    | bullmq + Redis                          | latest  |
| Email    | Resend + react.email                    | latest  |
| Storage  | S3-compatible (Neon/R2/MinIO)           | —       |
| Workflow | xstate                                  | 5.x     |
| Logging  | Pino                                    | latest  |
| Tracing  | OpenTelemetry                           | latest  |
| Errors   | Sentry                                  | 10.42+  |
| CI/CD    | GitHub Actions + Docker                 | —       |
| Package  | bun                                     | 1.3+    |

## Environment Variables (expanded)

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_URL_POOLER=postgresql://...

# Auth
BETTER_AUTH_SECRET=<32+ chars>
BETTER_AUTH_URL=https://app.example.com

# Redis (bullmq)
REDIS_URL=redis://localhost:6379

# Email (Resend)
RESEND_API_KEY=re_...

# Storage (S3-compatible)
STORAGE_ENDPOINT=https://xxx.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
STORAGE_BUCKET=basestack
STORAGE_PUBLIC_URL=https://cdn.example.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...

# Sentry
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production

# Feature Flags
FLAGS_JSON='{"beta.search":false,"beta.ai-assistant":false}'

# App
APP_NAME=BaseStack
APP_URL=https://app.example.com
```

## Implementation Order

These specs are ordered by dependency. Each builds on the previous.

| #   | Spec                        | Depends On | Est. Days |
| --- | --------------------------- | ---------- | --------- |
| 01  | Multi-tenancy               | —          | 2         |
| 02  | Auth (org + access plugins) | 01         | 1         |
| 03  | RBAC + permissions          | 02         | 1         |
| 04  | Schema (business tables)    | 01         | 2         |
| 05  | Billing (Stripe)            | 01, 04     | 3         |
| 06  | Background jobs + queue     | —          | 2         |
| 07  | File storage                | 06         | 1         |
| 08  | Notifications               | 06         | 2         |
| 09  | Audit logging               | 01, 04     | 1         |
| 10  | Workflow engine             | 01         | 2         |
| 11  | API layer                   | 02, 03, 04 | 2         |
| 12  | Observability               | —          | 1         |
| 13  | DevOps (Docker, CI/CD)      | —          | 1         |
| 14  | Security                    | 02         | 1         |
| 15  | Testing                     | —          | 2         |
| 16  | UI components               | —          | 2         |

**Total: ~26 days for a full production SaaS boilerplate.**

## Conventions

- All imports use `#/` prefix (`#/db/schema`, `#/lib/auth`, etc.)
- Server functions use `createServerFn({ method: 'GET' | 'POST' })`
- Route `beforeLoad` handles auth + org + permission checks
- No `console.log` — use Pino logger
- All user-facing text goes through `use-intl`
- Biome for lint/format; no ESLint or Prettier
- `bun` only — no npm/pnpm/yarn
