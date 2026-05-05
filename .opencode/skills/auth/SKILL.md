---
name: auth
description: Authentication system — Better Auth setup, client/server patterns, session resolution, route guards. Use when implementing sign-in/sign-up, adding route guards, or reviewing auth flows.
---

# Auth

## Non-Negotiables

- MUST use `getCurrentSession` from `#/lib/auth-session` for session checks in route guards.
- MUST use `authClient` from `#/lib/auth-client` for client-side auth (sign-in/sign-up/sign-out).
- MUST NOT call `betterAuth` directly in client code — use `authClient`.
- MUST sanitize `redirect` search param in auth routes (prevent open redirect).
- MUST NOT cache or store session client-side outside Better Auth's management.

## Server-Side (`#/lib/auth.ts`)

Better Auth configured with:
- Drizzle adapter (Postgres), email/password
- `tanstackStartCookies()` plugin

## Client-Side (`#/lib/auth-client.ts`)

```typescript
import { authClient } from '#/lib/auth-client'

const { data } = await authClient.signIn.email({ email, password })
const { data } = await authClient.signUp.email({ email, password, name })
const { error } = await authClient.signOut()
```

## Session Check

```typescript
import { getCurrentSession } from '#/lib/auth-session'
const session = await getCurrentSession()
// Returns { session: {...}, user: { id, name, email, image } } | null
```

## Route Guard Patterns

### Protected Layout Guard (`_protected.tsx beforeLoad`)
```typescript
const session = await getCurrentSession()
if (!session) throw redirect({ to: '/sign-in', search: { redirect: location.href } })
return { session }
```

### Auth Routes (redirect authenticated users away)
```typescript
export const Route = createFileRoute('/sign-in')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async ({ search }) => {
    const session = await getCurrentSession()
    if (session) throw redirect({ to: search.redirect ?? '/' })
  },
})
```

## References

See `docs/agents/rules/auth.md` for detailed non-negotiables, checklists, and common mistakes.
