# Feature Module Blueprint

> **Rules:** [`../rules/server-functions.md`](../rules/server-functions.md) — createServerFn requirements.

Every feature follows a consistent structure:

```
src/features/<name>/
├── model.ts       # Pure business logic + DB queries
├── server.ts      # createServerFn wrappers
├── hooks.ts       # TanStack Query hooks
├── components/    # (optional) Reusable form fields / UI
└── pages/         # (optional) Route-level page components
```

## model.ts

```typescript
import { db } from '#/db/index'

export async function listItems() {
  return db.select().from(itemsTable)
}
```

## server.ts

```typescript
export const listItemsFn = createServerFn({ method: 'GET' })
  .inputValidator((input: { search?: string }) => input)
  .handler(async ({ data }): Promise<Item[]> => {
    const { auth } = await import('#/lib/auth')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Not authenticated')
    return listItems(data.search)
  })
```

## hooks.ts

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

## Query Key Factory (`src/lib/query-keys.ts`)

```typescript
export const queryKeys = {
  assets: {
    all: ['assets'] as const,
    signedUrl: (assetId) => [...queryKeys.assets.all, 'signed-url', assetId] as const,
  },
  // add your feature keys here
}
```

## Route Context Pattern

```typescript
export const Route = createFileRoute('/_protected/entity')({
  beforeLoad: () => ({
    breadcrumb: 'entityName',
    pageTitle: 'entityName',
    primaryAction: { label: 'createEntity', href: '/entity/new' },
  }),
})
```
