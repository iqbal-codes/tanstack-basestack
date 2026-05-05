# Auth Rules

> **Reference:** [`../boilerplate/auth.md`](../boilerplate/auth.md) — code examples, session/guard patterns.

## Purpose

Controls authentication, session management, and route guards for protected routes.

## When To Read This

- Adding or modifying authentication flows (sign-in, sign-up).
- Adding route guards to new protected routes.
- Debugging session resolution issues.
- Reviewing a PR that touches `src/lib/auth.ts`, `src/lib/auth-session.ts`, or `src/lib/auth-client.ts`.

## Current Project Pattern

**Auth library:** Better Auth v1.5 configured in `src/lib/auth.ts`:
- Drizzle adapter with provider `pg` and schema from `src/db/schema.ts`.
- Email/password authentication enabled.
- Plugins: `tanstackStartCookies()`.
- API handler: `src/routes/api/auth/$.ts` exposes both GET and POST to `auth.handler(request)`.

**Client auth:** `src/lib/auth-client.ts` exports `authClient` created via `createAuthClient()` from `better-auth/react`. Used in `src/features/auth/AuthForm.tsx` for `signUp.email()` and `signIn.email()`.

**Session resolution:** `src/lib/auth-session.ts` exports `getCurrentSession` server function. Route guards use this to determine if a session exists before rendering protected routes.

**Route guards:**
- `src/routes/_protected.tsx:20-30` — `beforeLoad` checks session; redirects to `/sign-in` (with `redirect` param) if not authenticated.
- `src/routes/sign-in.tsx:21-27` — `beforeLoad` redirects authenticated users to `search.redirect ?? '/'`.
- `src/routes/sign-up.tsx` — same pattern as sign-in.
- `src/routes/sign-in.tsx:5-15` — `validateSearch` sanitizes the `redirect` param to prevent open redirect attacks.

## Non-Negotiable Rules

- MUST use `getCurrentSession` from `#/lib/auth-session` for session checks in route guards.
- MUST use `authClient` from `#/lib/auth-client` for client-side auth operations.
- MUST NOT call `betterAuth` directly in client code — use `authClient`.
- MUST sanitize the `redirect` search param in auth routes (see `src/routes/sign-in.tsx:5-15`).
- MUST NOT cache or store the session client-side outside of what Better Auth manages.
- Route guards in `_protected` layout MUST redirect unauthenticated users to `/sign-in` with the current `location.href` as the redirect target.

## Allowed Exceptions

- `src/routes/api/auth/$.ts` — raw `auth.handler(request)` is required for the Better Auth API catch-all route.
- The `session` type in `src/routes/__root.tsx:22` uses `Record<string, unknown>` because Better Auth's session shape is dynamic — this is the established router context boundary.

## Implementation Checklist

1. Add `beforeLoad` to any new protected route that redirects to `/sign-in` if no session.
2. Use `getCurrentSession()` in `beforeLoad` for session checks.
3. Sanitize any redirect param with the same pattern as `src/routes/sign-in.tsx:5-15`.

## Verification

```
bun run typecheck
bun run test
```

Route guard tests: `src/routes/-route-guards.test.tsx` validates the auth guard patterns.

Manual check: visit a protected route while not authenticated — must redirect to `/sign-in?redirect=...`.

## Common Mistakes To Avoid

- Importing `auth` from `#/lib/auth` in client components — use `authClient` for client-side calls.
- Forgetting to sanitize the `redirect` search param, opening an open-redirect vulnerability.
- Checking `session` directly without using `getCurrentSession()` in `beforeLoad`.
