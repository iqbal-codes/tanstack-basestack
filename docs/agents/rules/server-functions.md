# Server Functions Rules

> **Reference:** [`../boilerplate/server-functions.md`](../boilerplate/server-functions.md) — standard pattern, logger middleware.

## Purpose

Controls how server-side business logic is exposed to the client, enforcing the use of `createServerFn` for all internal API calls.

## When To Read This

- Adding any server-side operation: CRUD, session resolution, file upload.
- Reviewing a PR for unauthorized raw `fetch` calls to internal endpoints.
- Debugging "Not authenticated" errors at server boundaries.

## Current Project Pattern

All internal backend operations use `createServerFn` from `@tanstack/react-start`. Server functions are defined in feature modules.

Server function pattern with input validation:

```ts
export const createFn = createServerFn({ method: 'POST' })
  .inputValidator((input: InputType) => input)
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    // ...
  })
```

Server function call from a route loader or client:

```ts
const result = await listFn({ data: { search: deps.q } })
```

**Session resolution:** `src/lib/auth-session.ts:5-11` provides a reusable `getCurrentSession` server function used by route guards and server functions.

## Non-Negotiable Rules

- MUST use `createServerFn` for all internal API requests. MUST NOT use raw `fetch` to call internal backend logic.
- MUST validate input with `.inputValidator()` — never trust raw client input. For mutation endpoints, use a Zod schema inside `.inputValidator()` for runtime validation.
- MUST use `.handler()` with an explicit return type — never leave the return type as inferred `Promise<any>`.
- MUST use `getRequestHeaders()` from `@tanstack/react-start/server` when calling Better Auth or resolving headers.
- MUST narrow column selection in `db.select()` — use `db.select({ col1: table.col1, col2: table.col2 })` instead of `db.select()` to avoid fetching unused columns.
- MUST NOT use `LIKE '%term%'` or `ILIKE '%term%'` without a corresponding `pg_trgm` GIN index to prevent sequential scans.

## Allowed Exceptions

- `src/routes/api/auth/$.ts` is the only file allowed to re-export a handler that isn't a `createServerFn` — it is the Better Auth API handler and must use `auth.handler(request)` directly.
- External API calls (third-party services) may use raw `fetch` if they are not internal backend logic.

## Implementation Checklist

1. Place the server function in the relevant feature module (e.g. `src/features/<name>/model.ts` or `server.ts`).
2. Export the function with `createServerFn({ method: 'GET' | 'POST' })`.
3. Add `.inputValidator()` for any function that accepts client input.
4. Add `.handler()` with an explicit return type.
5. Resolve authentication via `auth.api.getSession({ headers: getRequestHeaders() })`.
6. Narrow column selection in every `db.select()` to only the fields you need.
7. Check search queries: `%term%` patterns need `pg_trgm` + GIN index; prefix-only `term%` can use B-tree.

## Verification

```
bun run typecheck
bun run build
```

Build catches server-function-level errors (e.g. missing exports, invalid handler shapes) that `tsc --noEmit` might not.

## Common Mistakes To Avoid

- Using raw `fetch('/api/...')` in a component or loader instead of calling a `createServerFn`.
- Skipping `.inputValidator()` and accessing `data` directly without validation.
- Calling `auth.api.getSession` without importing `#/lib/auth` dynamically inside the handler (avoids bundling the entire auth instance for server-only code).
- Forgetting to use `getRequestHeaders()` and instead trying to access headers directly from a request object that isn't available in a `createServerFn`.
- Using `db.select()` without narrowing columns — fetches all table columns even when only a subset is needed.
- Using `LIKE '%term%'` without a `pg_trgm` GIN index — causes sequential scans at scale.
