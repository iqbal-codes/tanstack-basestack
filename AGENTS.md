<!-- intent-skills:start -->
## Skill Loading

Before work: run `npx @tanstack/intent@latest list` or use skills in context.
Match: load with `npx @tanstack/intent@latest load <package>#<skill>` and follow `SKILL.md`.
Monorepos: run from workspace root, prefer local skill for package being changed.
Multiple matches: use most specific local skill; load extra only when task spans packages.
<!-- intent-skills:end -->

## Durable Project Context

Scaffold command:

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --add-ons neon,form,sentry,shadcn,tanstack-query,better-auth,drizzle
```

Follow-up commands:

```bash
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

`intent install` created this file. `intent list` returned `No intent-enabled packages found.`

## Stack And Integrations

- Runtime: TanStack Start + React 19 + Vite + file-based TanStack Router
- Package manager: bun — use `bun install`, `bun run dev`, `bun run build`, `bun run check`
- Toolchain: Biome via `biome.json` and `bun run check`
- UI: Tailwind CSS v4, shadcn, lucide, SaaS dashboard
- Data fetching: TanStack Query calls Start server function in `src/features/dashboard/model.ts`
- Routing: nested routes under `src/routes/app*` for overview, billing, settings
- Tables/filters: TanStack Table + TanStack Pacer debounced filtering
- Forms: TanStack Form for forecast planning
- Client state: TanStack Store for dashboard prefs + forecast label
- Local sync: TanStack DB local-only collection mirrors dashboard account signals
- Long lists: TanStack Virtual for activity stream
- Database: Neon Postgres via `DATABASE_URL`, Drizzle schema in `src/db/schema.ts`
- Auth: Better Auth + email/password + Start cookies + Drizzle adapter
- Monitoring: Sentry TanStack Start package + `instrument.server.mjs`; set `SENTRY_DSN`

## Environment Variables

Required:

- `DATABASE_URL`: Neon Postgres connection string
- `DATABASE_URL_POOLER`: Neon pooled connection string (serverless)
- `BETTER_AUTH_SECRET`: 32+ chars — generate with `bunx @better-auth/cli@latest secret`
- `BETTER_AUTH_URL`: public app URL (e.g., `https://app.example.com`.).

Optional:

- `SENTRY_DSN`: Sentry project DSN
- `SENTRY_ENVIRONMENT`: `development`, `preview`, or `production`

## Deployment Notes

- Portable to any Node-compatible TanStack Start host running `bun run build` + `bun run start`
- Serverless: prefer Neon pooled URLs, avoid long-lived local Postgres connections
- After schema changes: run `bun run db:generate` + `bun run db:migrate`
- Better Auth schema in Drizzle — regenerate/verify auth tables if Better Auth plugins change
- Sentry optional locally; production needs `SENTRY_DSN` + source-map handling

## Architecture Decisions

- Dashboard data source: compact, typed, one feature module, real Start server function boundaries
- Use static seed data so app renders before Neon credentials exist
- Billing-ready schema/routes, no payment processor yet
- TanStack DB local-only for client-side signals; server sync is future extension
- Keep generated demo routes for reference; primary surface is `/` and `/app`

## Known Gotchas

- Scaffold reported `npm install` and shadcn failures — repaired with bun; shadcn added via `npx -y shadcn@latest add --silent --yes button select input textarea slider switch label`
- TanStack Intent reports no intent-enabled packages
- `DATABASE_URL` required when Better Auth or Drizzle routes hit DB
- `bun add` may need filesystem permission in sandboxed environments
- `bun.lock` is authoritative — do not add npm, pnpm, or yarn lockfiles

## Next Steps

- Wire real Neon queries into dashboard server function when credentials exist
- Add billing provider tables or webhooks around `subscriptions`
- Add org membership and route guards around `/app`
- Configure Sentry release/source-map upload in deployment provider
- Add tests for route rendering, auth API health, dashboard filtering

## Agent skills

### Issue tracker

Issues in GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

## Constraints

- **Always use TanStack Form + shadcn Field components** — never raw `useState` for form field state. Use `useForm` from `@tanstack/react-form`, wrap fields with `Field`/`FieldLabel`/`FieldInput`/`FieldError` from `#/components/ui/field`.
- **Always use nuqs for URL search params** — never raw `useSearchParams` or manual URL parsing. Import `useQueryState`/`parseAsString` etc. from `nuqs`.
- **Always use createServerFn for internal API requests** — never raw `fetch` for internal backend calls. Define server functions in feature modules with `createServerFn` from `@tanstack/react-start`.
- **Always use shadcn/ui primitives** — never raw HTML elements when a shadcn component exists. Use `Button` not `<button>`, `Input` not `<input>`, `Card` not `<div>`, etc. Import from `#/components/ui/*`.