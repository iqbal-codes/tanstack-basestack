# Server Functions

> **Rules:** [`../rules/server-functions.md`](../rules/server-functions.md) — non-negotiables, checklists, common mistakes.

## Standard Pattern

```typescript
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

export const myFn = createServerFn({ method: 'GET' })
  .inputValidator((input: InputType) => input)
  .handler(async ({ data }): Promise<ReturnType> => {
    const { auth } = await import('#/lib/auth')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) return { ok: false, error: 'Not authenticated' }

    const { db } = await import('#/db/index')
    // business logic
  })
```

## Key Rules

- Dynamically import `auth` and `db` inside the handler (avoids bundling server code client-side)
- Always use `getRequestHeaders()` for header access
- Always use `.inputValidator()` for client input validation
- Always return an explicit return type from `.handler()`
- Always narrow `db.select()` to specific columns — prevents over-fetching
- NEVER use `LIKE '%term%'` without a `pg_trgm` GIN index

## Runtime Validation with Zod

Use Zod schemas inside `.inputValidator()` for mutation endpoints:

```typescript
import { z } from 'zod'

const createItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
})

export const createItemFn = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => createItemSchema.parse(input))
  .handler(async ({ data }): Promise<Item> => { ... })
```

## Column Narrowing

Always select only the columns you need:

```typescript
// ❌ Fetches ALL columns
const items = await db.select().from(table)

// ✅ Fetches only what's needed
const items = await db
  .select({ id: table.id, name: table.name, status: table.status })
  .from(table)
```

## Session Resolution

```typescript
import { getCurrentSession } from '#/lib/auth-session'
const session = await getCurrentSession()  // returns session object or null
```

## Server Logger Middleware

```typescript
import { serverLoggerMiddleware } from '#/lib/server-logger-middleware'

export const myFn = createServerFn({ method: 'GET' })
  .middleware([serverLoggerMiddleware])
  .handler(async ({ data }) => { ... })
```

Automatically logs duration and errors, sends errors to Sentry.

## Calling from Components/Loaders

```typescript
const result = await listItemsFn({ data: { search: 'foo' } })
```

## Rules

- MUST use `createServerFn` — never raw `fetch` for internal API calls
- MUST use `.inputValidator()` — never trust raw client input
- MUST use `.handler()` with explicit return type
