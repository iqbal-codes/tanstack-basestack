# Auth

> **Rules:** [`../rules/auth.md`](../rules/auth.md) — non-negotiables, checklists, common mistakes.

## Server-Side (`src/lib/auth.ts`)

Better Auth with:
- Drizzle adapter (Postgres)
- Email/password authentication
- `tanstackStartCookies()` plugin

## Client-Side (`src/lib/auth-client.ts`)

```typescript
import { authClient } from '#/lib/auth-client'

const { data } = await authClient.signIn.email({ email, password })
const { data } = await authClient.signUp.email({ email, password, name })
await authClient.signOut()
```

## Session Check (`src/lib/auth-session.ts`)

```typescript
import { getCurrentSession } from '#/lib/auth-session'
const session = await getCurrentSession()
// Returns { session: {...}, user: { id, name, email, image } } | null
```

## Route Guard Pattern

```typescript
// _protected.tsx beforeLoad
const session = await getCurrentSession()
if (!session) throw redirect({ to: '/sign-in', search: { redirect: location.href } })
return { session }
```

## Key Rules

- Use `getCurrentSession` for route guards
- Use `authClient` for client-side operations
- Sanitize `redirect` search params in auth routes (prevent open redirect)
