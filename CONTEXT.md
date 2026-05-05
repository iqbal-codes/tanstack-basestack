# CONTEXT

## What this is

A **TanStack Start boilerplate** (React 19, Vite, file-based router) with auth, database, i18n, and full component system pre-configured. Use as a starting point for any new SaaS/internal tool project.

## Ubiquitous vocabulary

| Term | Meaning |
|---|---|
| **Better Auth** | Auth layer. Email/password authentication via Drizzle adapter. |
| **Server function** | TanStack Start `createServerFn` — type-safe RPC, called from router or client. |
| **Application Component** | Project-wide reusable UI composition built from shadcn/ui primitives and TanStack libraries. |
| **Application Data Table** | Application Component for resource lists. Renders server-backed table/card views from feature-owned data, URL state, and filters. |
| **Asset** | Uploaded media or document owned by a business entity. |
| **Asset Usage** | Business intent of an Asset: `logo`, `profile`, `gallery`, or `attachment`. |
| **Asset Variant** | A delivery form of an Asset (`preview`, `full`, `original`) selected based on use. |

## Architecture

```
src/
├── db/              # Drizzle schema (auth + assets tables)
├── features/        # domain modules (auth, assets)
├── routes/
│   ├── __root.tsx        root layout
│   ├── sign-in.tsx       /sign-in
│   ├── sign-up.tsx       /sign-up
│   ├── _protected.tsx    pathless layout — session guard
│   └── _protected/       authenticated routes (dashboard, etc.)
├── components/      # Shared UI (shadcn/ui wrappers)
├── lib/             # Auth client, i18n, logger, R2 storage
└── messages/        # use-intl translation files (en/id)
```

## Key decisions

- **Email/password auth only**: Better Auth with Drizzle adapter. No organization plugin, no RBAC.
- **No tenant model**: Add your own (org, workspace, etc.) via `orgId` columns when needed.
- **i18n from day one**: All user-facing strings use `use-intl` / `next-intl`.
- **shadcn/ui only**: No emoji or icon libraries outside lucide-react.
- **File upload system**: R2-based asset upload with signed URLs, variants, and usage limits.
- **Asset types are agnostic**: `ownerType` and `usage` are strings — define your own conventions.

## Current state

**Clean boilerplate** with auth (sign-in/sign-up), protected layout, asset upload system, form system, data table, and full shadcn/ui component library. No business features — add your own.
