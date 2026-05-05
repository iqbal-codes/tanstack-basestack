---
name: server-logic
description: Server function patterns, feature module blueprint, and routing — createServerFn, session resolution, logger middleware, feature model/server/hooks, route guards, URL params. Use when writing server functions, route loaders, feature modules, or adding routes.
---

# Server Logic

## Non-Negotiables

- MUST use `createServerFn` for all internal API — never raw `fetch`.
- MUST use `.inputValidator()` — type-only pass-through for GET, Zod schema for mutations.
- MUST use `.handler()` with explicit return type — never inferred `Promise<any>`.
- MUST use `getRequestHeaders()` from `@tanstack/react-start/server` for header access.
- MUST dynamically import `auth` and `db` inside handler — not at module level.
- MUST narrow `db.select()` to specific columns.

## createServerFn Pattern

```typescript
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'

export const createItemFn = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => createItemSchema.parse(input))
  .handler(async ({ data }): Promise<Item> => {
    const { auth } = await import('#/lib/auth')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthenticated')

    const { db } = await import('#/db/index')
    // business logic
  })
```

## Session Resolution

```typescript
import { getCurrentSession } from '#/lib/auth-session'
const session = await getCurrentSession() // { session, user } | null
```

## Server Logger Middleware

```typescript
import { serverLoggerMiddleware } from '#/lib/server-logger-middleware'

export const myFn = createServerFn({ method: 'GET' })
  .middleware([serverLoggerMiddleware])
  .handler(async ({ data }) => { /* auto-logged, errors sent to Sentry */ })
```

## Feature Module Blueprint

```
src/features/<name>/
├── model.ts    # Pure logic + DB queries
├── server.ts   # createServerFn wrappers
├── hooks.ts    # TanStack Query hooks
```

### hooks.ts pattern
```typescript
import { queryKeys } from '#/lib/query-keys'

export function useItemsList(filters: ListFilters) {
  return useSuspenseQuery({
    queryKey: queryKeys.items.list(filters),
    queryFn: () => listItemsFn({ data: filters }),
  })
}

export function useCreateItem() {
  return useMutation({
    mutationFn: (input: CreateInput) => createItemFn({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.items.all }),
  })
}
```

### Query Key Factory (`#/lib/query-keys`)
```typescript
export const queryKeys = {
  assets: {
    all: ['assets'] as const,
    signedUrl: (assetId) => [...queryKeys.assets.all, 'signed-url', assetId] as const,
  },
  // add your feature keys here
}
```

## Routing

### Root Layout (`__root.tsx`) Provider Stack
IntlProvider > QueryClientProvider > ThemeProvider > TooltipProvider > NuqsAdapter > Outlet > Toaster > DevTools.

### Protected Layout Guard (`_protected.tsx beforeLoad`)
```typescript
const session = await getCurrentSession()
if (!session) throw redirect({ to: '/sign-in', search: { redirect: location.href } })
return { session }
```

### Auth Routes
```typescript
export const Route = createFileRoute('/sign-in')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async () => {
    const session = await getCurrentSession()
    if (session) throw redirect({ to: search.redirect ?? '/' })
  },
})
```

### URL Search Params (nuqs)
```tsx
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'
const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
```

### Route Context for Page Metadata
```typescript
export const Route = createFileRoute('/_protected/entity')({
  beforeLoad: () => ({
    breadcrumb: 'entityName',        // key for useTranslations('breadcrumb')
    pageTitle: 'entityName',          // key for mobile header
    primaryAction: { label: 'createEntity', href: '/entity/new' },
  }),
})
```

### Route Structure
| Route | File | Description |
|---|---|---|
| `/sign-in`, `/sign-up` | sign-in.tsx | Auth with redirect validation |
| `/_protected` | _protected.tsx | Protected layout with sidebar |
| `/_protected/entity/` | list | Entity list with search params |
| `/_protected/entity/new` | create | Entity create form |
| `/_protected/entity/$id/` | detail | Entity detail |
| `/_protected/entity/$id/edit` | edit | Entity edit form |
| `/api/auth/$` | API handler | Better Auth handler |

## References

See `docs/agents/rules/server-functions.md` for detailed non-negotiables.
