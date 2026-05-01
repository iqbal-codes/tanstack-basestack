Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 5. Project Context

- Runtime: TanStack Start + React 19 + Vite + file-based TanStack Router.
- Package manager: Bun only.
- Tooling: Biome via `bun run check`, TypeScript via `bun run typecheck`.
- UI: Tailwind CSS v4 + shadcn/ui + lucide.
- Forms: TanStack Form.
- URL state: nuqs.
- Server boundary: TanStack Start `createServerFn`.
- Database: Neon Postgres + Drizzle.
- Auth: Better Auth + Drizzle adapter.
- Monitoring: Sentry optional locally, required in production when configured.

## 6. Agent skills

### Issue tracker

Issues in GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

## 7. Context Loading

Before coding or reviewing, load only the docs relevant to the task:

- TypeScript/types → `docs/agents/rules/typescript.md`
- UI/components/forms → `docs/agents/rules/ui.md`
- i18n/translations → `docs/agents/rules/i18n.md`
- Data fetching/server functions → `docs/agents/rules/server-functions.md`
- Database/schema/migrations → `docs/agents/rules/database.md`
- Auth/session/guards → `docs/agents/rules/auth.md`
- Deployment/env/Sentry → `docs/agents/rules/deployment.md`
- Issues/triage/domain docs → `docs/agents/*.md`

If a required doc does not exist, proceed using this file and mention the missing doc in the final report.

## 8. Non-Negotiable Project Rules

- Use Bun only: `bun install`, `bun run dev`, `bun run build`, `bun run check`, `bun run typecheck`.
- `bun.lock` is authoritative. Do not add npm, pnpm, or yarn lockfiles.
- Run `bun run check` and `bun run typecheck` before committing or final handoff.
- Run `bun run build` when changes touch routing, server functions, auth, database, or deployment behavior.
- Do not guess library APIs. If unsure, check official docs, Context7, or existing project patterns first.
- Do not use raw internal `fetch`; use `createServerFn`.
- Do not use raw `useSearchParams`; use nuqs.
- Do not hardcode user-facing text; use `use-intl` and update message files.
