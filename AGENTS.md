<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Durable Project Context

Project scaffold command used exactly:

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --add-ons neon,form,sentry,shadcn,tanstack-query,better-auth,drizzle
```

Follow-up TanStack Intent commands run from the generated project:

```bash
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

`intent install` created this file. `intent list` returned `No intent-enabled packages found.`

## Stack And Integrations

- Runtime framework: TanStack Start with React 19, Vite, and file-based TanStack Router.
- Package manager: bun. Use `bun install`, `bun run dev`, `bun run build`, and `bun run check`.
- Project toolchain: Biome via `biome.json` and `bun run check`.
- UI: Tailwind CSS v4, shadcn components, lucide icons, and a concise operational SaaS dashboard.
- Data fetching: TanStack Query calls a TanStack Start server function in `src/features/dashboard/model.ts`.
- Routing: nested app routes live under `src/routes/app*` for overview, billing, and settings.
- Tables and filters: TanStack Table plus TanStack Pacer debounced filtering.
- Forms: TanStack Form is used for the forecast planning workflow.
- Client state: TanStack Store keeps dashboard preferences and the latest forecast label.
- Local synced data model: TanStack DB local-only collection mirrors dashboard account signals.
- Long lists: TanStack Virtual renders the activity stream.
- Database: Neon Postgres connection through `DATABASE_URL` and Drizzle schema in `src/db/schema.ts`.
- Auth: Better Auth with email/password, TanStack Start cookies, and the Drizzle adapter.
- Monitoring: Sentry TanStack Start package and `instrument.server.mjs` are present; set `SENTRY_DSN` for real events.

## Environment Variables

Required for a real database-backed deployment:

- `DATABASE_URL`: Neon Postgres connection string for Drizzle and Better Auth.
- `DATABASE_URL_POOLER`: Neon pooled connection string, recommended for serverless deployment.
- `BETTER_AUTH_SECRET`: at least 32 characters. Generate with `bunx @better-auth/cli@latest secret`.
- `BETTER_AUTH_URL`: public app URL, for example `https://app.example.com`.

Monitoring:

- `SENTRY_DSN`: Sentry project DSN.
- `SENTRY_ENVIRONMENT`: `development`, `preview`, or `production`.

## Deployment Notes

- Portable deployment target is any Node-compatible TanStack Start host that can run `bun run build` and `bun run start`.
- For serverless hosts, prefer Neon pooled URLs and avoid long-lived local Postgres connections.
- Run `bun run db:generate` and `bun run db:migrate` after changing Drizzle schema.
- Better Auth schema is represented in Drizzle; if Better Auth plugins change, regenerate or verify auth tables before deployment.
- Sentry is optional in local development, but production should set `SENTRY_DSN` and source-map handling in the chosen host.

## Architecture Decisions

- Keep the dashboard data source compact and typed in one feature module while retaining real Start server function boundaries.
- Use static seed data for the dashboard demo so the app renders before Neon credentials exist.
- Keep billing-ready structure in schema and routes without integrating a payment processor yet.
- Use TanStack DB local-only collection for client-side operational signals, leaving server sync as a future extension.
- Keep generated demo routes available for reference, but make `/` and `/app` the primary SaaS surface.

## Known Gotchas

- The scaffold reported internal `npm install` and shadcn add failures. Dependencies were repaired with bun, and shadcn components were added with `npx -y shadcn@latest add --silent --yes button select input textarea slider switch label`.
- TanStack Intent currently reports no intent-enabled packages in this project.
- `DATABASE_URL` is required as soon as Better Auth or Drizzle routes hit the database.
- `bun add` may need filesystem permission for temp/cache writes in sandboxed environments.
- `bun.lock` is the authoritative lockfile; do not introduce npm, pnpm, or yarn lockfiles.

## Next Steps

- Wire real Neon queries into the dashboard server function once credentials are available.
- Add billing provider tables or webhooks around `subscriptions`.
- Add organization membership and route guards around `/app`.
- Configure Sentry release/source-map upload in the deployment provider.
- Add focused tests for route rendering, auth API health, and dashboard filtering.

## Agent skills

### Issue tracker

Issues tracked in GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.
