# 01 — Multi-Tenancy

> Row-level security + organization plugin for tenant-isolated data access.

## Strategy

**Neon Postgres RLS** with `org_id` on every business table. Every query is automatically scoped to the current tenant via a Postgres session variable.

```
Query → set_config('app.current_org_id', $orgId) → RLS policy filters rows
```

## Database Changes

### `src/db/schema/core.ts` — Organization table (mirrors Better Auth org plugin)

```ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'), // JSON string
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at'),
})
```

### RLS Activation Helper (`src/lib/rls.ts`)

```ts
import { db } from '#/db/index'
import { sql } from 'drizzle-orm'

export async function setCurrentOrg(orgId: string) {
  await db.execute(sql`SELECT set_config('app.current_org_id', ${orgId}, true)`)
}

export async function resetCurrentOrg() {
  await db.execute(sql`SELECT set_config('app.current_org_id', '', true)`)
}

export function orgFilter(orgIdCol: string) {
  return sql`${sql.raw(orgIdCol)} = current_setting('app.current_org_id')`
}
```

### RLS Policy Migration

Every business table gets an RLS policy:

```sql
-- Enable RLS on all business tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see rows in their org
CREATE POLICY org_isolation ON customers
  FOR ALL
  USING (org_id = current_setting('app.current_org_id'))
  WITH CHECK (org_id = current_setting('app.current_org_id'));
```

### `org_id` column on every business table

```ts
// Every business schema file includes:
export const orgId = text('org_id').notNull().references(() => organization.id)
```

## Route Architecture

### Tenant-scoped route (`src/routes/app/$orgSlug.tsx`)

```ts
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentSession } from '#/lib/auth-session'
import { setCurrentOrg } from '#/lib/rls'
import { auth } from '#/lib/auth'

export const Route = createFileRoute('/app/$orgSlug')({
  beforeLoad: async ({ params }) => {
    const session = await getCurrentSession()
    if (!session) throw redirect({ to: '/sign-in' })

    // Verify org exists and user is a member
    const org = await auth.api.getFullOrganization({
      query: { organizationSlug: params.orgSlug },
      headers: new Headers(),
    })

    if (!org) throw redirect({ to: '/admin' })

    // Set RLS context for all downstream queries
    await setCurrentOrg(org.id)

    return { session, org }
  },
  component: OrgLayout,
})

function OrgLayout() {
  return (
    <SidebarProvider>
      <OrgSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### All tenant routes go under `$orgSlug/`:

```
src/routes/app/
├── $orgSlug.tsx              # Layout + org context + RLS
├── $orgSlug/
│   ├── index.tsx             # Org dashboard
│   ├── orders.tsx            # Orders list
│   ├── orders/
│   │   └── $orderId.tsx      # Order detail
│   ├── customers.tsx         # CRM contacts
│   ├── inventory.tsx         # LSM inventory
│   └── settings.tsx          # Org settings
```

## Server Function Pattern with RLS

```ts
// src/features/admin/model.ts
import { createServerFn } from '@tanstack/react-start'

export const getCustomers = createServerFn({ method: 'GET' })
  .handler(async () => {
    // RLS auto-filters by current_setting('app.current_org_id')
    return db.select().from(customers)
  })
```

## Better Auth Organization Plugin

The `organization` plugin from Better Auth handles:
- Creating organizations
- Inviting members
- Role assignment (owner, admin, member)
- Team sub-groups
- Active organization switching

We extend it with:
- RLS session variable set on org switch
- Custom permissions via `createAccessControl()`
- Organization-scoped `TeamSwitcher` component

## Team Switcher Replacement

Replace the hardcoded `TeamSwitcher` with a dynamic org switcher:

```tsx
// src/components/nav-org.tsx
import { authClient } from '#/lib/auth-client'

export function NavOrg() {
  const { data: orgs } = authClient.useListOrganizations()
  const { data: activeOrg } = authClient.useActiveOrganization()

  return (
    <OrgSwitcherDropdown
      orgs={orgs ?? []}
      activeOrg={activeOrg}
      onSwitch={(orgId) => authClient.organization.setActive({ organizationId: orgId })}
    />
  )
}
```

## Data Isolation Checklist

- [ ] `org_id` FK on all business tables
- [ ] RLS policies on all business tables
- [ ] `setCurrentOrg()` in `$orgSlug` route `beforeLoad`
- [ ] Server functions never accept raw `orgId` from client
- [ ] Org switcher sets active org + RLS context atomically
- [ ] API routes set RLS context from JWT or session
- [ ] Admin routes bypass RLS (use `resetCurrentOrg()`)
- [ ] Test suite verifies cross-tenant data isolation
