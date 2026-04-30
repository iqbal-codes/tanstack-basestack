# 03 — RBAC & Permissions

> Fine-grained, type-safe access control using Better Auth's `createAccessControl()`.

## Resource Definitions

These are the agnostic resources any ERP/CRM/OMS/LSM app needs:

```ts
// src/features/rbac/permissions.ts
import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements, adminAc, ownerAc, memberAc } from 'better-auth/plugins/organization/access'

export const statement = {
  ...defaultStatements,

  // Customers / Contacts
  customer: ['create', 'read', 'update', 'delete', 'export'],

  // Companies / Accounts
  company: ['create', 'read', 'update', 'delete', 'export'],

  // Orders
  order: ['create', 'read', 'update', 'delete', 'approve', 'cancel', 'export'],

  // Inventory
  inventory: ['create', 'read', 'update', 'delete', 'adjust', 'export'],

  // Shipments
  shipment: ['create', 'read', 'update', 'delete', 'track', 'fulfill'],

  // Invoices
  invoice: ['create', 'read', 'update', 'delete', 'send', 'void', 'export'],

  // Products / Items
  product: ['create', 'read', 'update', 'delete'],

  // Reports
  report: ['create', 'read', 'export', 'schedule'],

  // Settings
  settings: ['read', 'update'],

  // Billing
  billing: ['read', 'update', 'manage'],

  // Members / Users
  member: ['create', 'read', 'update', 'delete', 'invite'],

  // Integrations
  integration: ['create', 'read', 'update', 'delete'],

  // Webhooks
  webhook: ['create', 'read', 'update', 'delete'],
} as const

export const ac = createAccessControl(statement)

// Role: Owner — full access to everything
export const owner = ac.newRole({
  ...ownerAc.statements,
  customer: ['create', 'read', 'update', 'delete', 'export'],
  company: ['create', 'read', 'update', 'delete', 'export'],
  order: ['create', 'read', 'update', 'delete', 'approve', 'cancel', 'export'],
  inventory: ['create', 'read', 'update', 'delete', 'adjust', 'export'],
  shipment: ['create', 'read', 'update', 'delete', 'track', 'fulfill'],
  invoice: ['create', 'read', 'update', 'delete', 'send', 'void', 'export'],
  product: ['create', 'read', 'update', 'delete'],
  report: ['create', 'read', 'export', 'schedule'],
  settings: ['read', 'update'],
  billing: ['read', 'update', 'manage'],
  member: ['create', 'read', 'update', 'delete', 'invite'],
  integration: ['create', 'read', 'update', 'delete'],
  webhook: ['create', 'read', 'update', 'delete'],
})

// Role: Admin — full access except billing management and org deletion
export const admin = ac.newRole({
  ...adminAc.statements,
  customer: ['create', 'read', 'update', 'delete', 'export'],
  company: ['create', 'read', 'update', 'delete', 'export'],
  order: ['create', 'read', 'update', 'delete', 'approve', 'cancel', 'export'],
  inventory: ['create', 'read', 'update', 'delete', 'adjust', 'export'],
  shipment: ['create', 'read', 'update', 'delete', 'track', 'fulfill'],
  invoice: ['create', 'read', 'update', 'delete', 'send', 'void', 'export'],
  product: ['create', 'read', 'update', 'delete'],
  report: ['create', 'read', 'export', 'schedule'],
  settings: ['read', 'update'],
  member: ['create', 'read', 'update', 'delete', 'invite'],
  integration: ['read'],
  webhook: ['read'],
})

// Role: Member — read + limited create
export const member = ac.newRole({
  ...memberAc.statements,
  customer: ['create', 'read'],
  company: ['read'],
  order: ['create', 'read'],
  inventory: ['read'],
  shipment: ['read', 'track'],
  invoice: ['read'],
  product: ['read'],
  report: ['read'],
  settings: ['read'],
})

// Custom: Operator (for OMS/LSM workflows)
export const operator = ac.newRole({
  customer: ['read'],
  order: ['create', 'read', 'update'],
  inventory: ['read', 'adjust'],
  shipment: ['create', 'read', 'update', 'track', 'fulfill'],
})

// Custom: Viewer (read-only for auditors/clients)
export const viewer = ac.newRole({
  customer: ['read'],
  company: ['read'],
  order: ['read'],
  inventory: ['read'],
  shipment: ['read'],
  invoice: ['read'],
  product: ['read'],
  report: ['read'],
  settings: ['read'],
})
```

## Permission Check Helpers

### Server-side (route guards, server functions)

```ts
// src/features/rbac/guards.ts
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'
import type { statement } from './permissions'

type Resource = keyof typeof statement
type Action<T extends Resource> = (typeof statement)[T][number]

export async function hasPermission<R extends Resource>(
  resource: R,
  actions: Action<R>[],
) {
  const result = await auth.api.hasPermission({
    headers: getRequestHeaders(),
    body: {
      permission: { [resource]: actions },
    },
  })
  return result.data?.success ?? false
}

export async function requirePermission<R extends Resource>(
  resource: R,
  actions: Action<R>[],
) {
  const allowed = await hasPermission(resource, actions)
  if (!allowed) {
    throw new Error(`Permission denied: ${resource}.${actions.join(',')}`)
  }
}
```

### Client-side (show/hide UI elements)

```ts
// src/features/rbac/use-permission.ts
import { authClient } from '#/lib/auth-client'
import { useQuery } from '@tanstack/react-query'
import type { statement } from './permissions'

type Resource = keyof typeof statement
type Action<T extends Resource> = (typeof statement)[T][number]

export function usePermission() {
  return {
    can: async <R extends Resource>(resource: R, action: Action<R>) => {
      return authClient.organization.hasPermission({
        permission: { [resource]: [action] },
      })
    },
    checkRole: <R extends Resource>(role: string, resource: R, action: Action<R>) => {
      return authClient.organization.checkRolePermission({
        role,
        permission: { [resource]: [action] },
      })
    },
  }
}
```

### React component for conditional rendering

```tsx
// src/components/permission-gate.tsx
import { authClient } from '#/lib/auth-client'
import type { statement } from '#/features/rbac/permissions'

type Resource = keyof typeof statement
type Action<T extends Resource> = (typeof statement)[T][number]

// Static check (optimistic, no network call)
export function Can({
  resource,
  action,
  role,
  children,
  fallback = null,
}: {
  resource: Resource
  action: Action<Resource>
  role: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const allowed = authClient.organization.checkRolePermission({
    role,
    permission: { [resource]: [action] },
  })

  if (!allowed.data) return fallback
  return <>{children}</>
}

// Async check (calls API)
export function CanAsync({
  resource,
  action,
  children,
  fallback = null,
}: {
  resource: Resource
  action: Action<Resource>
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  // Implement with useQuery calling auth.api.hasPermission
}
```

## Usage Examples

### Route guard

```ts
// src/routes/app/$orgSlug/orders.tsx
beforeLoad: async () => {
  const session = await getCurrentSession()
  if (!session) throw redirect({ to: '/sign-in' })
  await requirePermission('order', ['read'])
  return { session }
}
```

### UI gate

```tsx
<Can resource="order" action="delete" role={userRole}>
  <Button variant="destructive">Delete Order</Button>
</Can>
```

### Server function

```ts
export const deleteCustomer = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await requirePermission('customer', ['delete'])
    await db.delete(customers).where(eq(customers.id, data.id))
  })
```

## Checklist

- [ ] Create `src/features/rbac/permissions.ts` with all resource definitions
- [ ] Create `src/features/rbac/guards.ts` with `hasPermission` and `requirePermission`
- [ ] Create `src/features/rbac/use-permission.ts` with client hooks
- [ ] Create `src/components/permission-gate.tsx` with `Can` and `CanAsync`
- [ ] Pass `ac` and `roles` to both server and client organization plugins
- [ ] Add `requirePermission` to all protected server functions
- [ ] Add `beforeLoad` permission checks to all tenant routes
- [ ] Wrap UI actions in `<Can>` components
- [ ] Test: owner can do everything, member is limited, viewer is read-only
