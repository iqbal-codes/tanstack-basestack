# 09 — Audit Logging

> Immutable audit trail capturing WHO did WHAT to WHICH resource and WHEN.

## Database Table

### `src/db/schema/audit.ts`

```ts
import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { organization } from './core'

export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  userId: text('user_id'),                     // Who (null for system actions)
  userEmail: text('user_email'),               // Snapshot for deleted users
  action: text('action').notNull(),            // 'create', 'update', 'delete', 'read', 'export', 'login', etc.
  resource: text('resource').notNull(),        // 'customer', 'order', 'invoice', 'shipment', 'user', etc.
  resourceId: text('resource_id'),             // ID of the affected resource
  resourceName: text('resource_name'),         // Human-readable name (snapshot)
  oldValues: jsonb('old_values').$type<Record<string, unknown>>(),  // Before state
  newValues: jsonb('new_values').$type<Record<string, unknown>>(),  // After state
  diff: jsonb('diff').$type<Record<string, unknown>>(),             // Computed delta
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  sessionId: text('session_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

## Audit Logger

### `src/features/audit/logger.ts`

```ts
import { db } from '#/db/index'
import { auditLog } from '#/db/schema/audit'
import { v4 as uuid } from 'uuid'

type AuditInput = {
  orgId: string
  userId?: string
  userEmail?: string
  action: string
  resource: string
  resourceId?: string
  resourceName?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  metadata?: Record<string, unknown>
}

export async function writeAuditLog(input: AuditInput) {
  // Compute diff if both old and new values exist
  const diff = input.oldValues && input.newValues
    ? computeDiff(input.oldValues, input.newValues)
    : undefined

  await db.insert(auditLog).values({
    id: uuid(),
    orgId: input.orgId,
    userId: input.userId,
    userEmail: input.userEmail,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    resourceName: input.resourceName,
    oldValues: input.oldValues ?? null,
    newValues: input.newValues ?? null,
    diff: diff ?? null,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    sessionId: input.sessionId,
    metadata: input.metadata ?? {},
  })
}

function computeDiff(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {}
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])

  for (const key of allKeys) {
    const oldVal = JSON.stringify(oldValues[key])
    const newVal = JSON.stringify(newValues[key])
    if (oldVal !== newVal) {
      diff[key] = { from: oldValues[key], to: newValues[key] }
    }
  }

  return diff
}

// Get current request context
export function getRequestContext() {
  // From TanStack Start getRequest()
  const request = getRequest()
  return {
    ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  }
}
```

## Audit Middleware

### `src/features/audit/middleware.ts`

```ts
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { writeAuditLog, getRequestContext } from './logger'
import { getCurrentSession } from '#/lib/auth-session'
import { getCurrentOrgId } from '#/lib/rls'

// Decorator/wrapper for server functions that need audit
export function withAudit<TArgs, TResult>(
  resource: string,
  action: string,
  fn: (args: TArgs) => Promise<TResult>,
  getResourceName?: (result: TResult) => string,
) {
  return async (args: TArgs): Promise<TResult> => {
    const startTime = Date.now()
    const session = await getCurrentSession()
    const context = getRequestContext()

    try {
      const result = await fn(args)

      // Log successful action
      await writeAuditLog({
        orgId: getCurrentOrgId(),
        userId: session?.user.id,
        userEmail: session?.user.email,
        action,
        resource,
        resourceId: (result as any)?.id,
        resourceName: getResourceName?.(result),
        newValues: args as any,
        ...context,
        sessionId: session?.session.id,
        metadata: { durationMs: Date.now() - startTime },
      })

      return result
    } catch (error) {
      // Log failed action
      await writeAuditLog({
        orgId: getCurrentOrgId(),
        userId: session?.user.id,
        userEmail: session?.user.email,
        action: `${action}_failed`,
        resource,
        ...context,
        sessionId: session?.session.id,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          durationMs: Date.now() - startTime,
        },
      })

      throw error
    }
  }
}
```

## Usage in Server Functions

```ts
// src/features/customers/api.ts
import { writeAuditLog } from '#/features/audit/logger'

export const createCustomer = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string(), email: z.string().email() }))
  .handler(async ({ data }) => {
    await requirePermission('customer', ['create'])
    const session = await getCurrentSession()

    const customer = await db.insert(customers).values({
      ...data,
      orgId: getCurrentOrgId(),
    }).returning()

    // Explicit audit log
    await writeAuditLog({
      orgId: getCurrentOrgId(),
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'create',
      resource: 'customer',
      resourceId: customer[0].id,
      resourceName: data.name,
      newValues: data,
    })

    return customer[0]
  })

export const updateCustomer = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string(), name: z.string().optional(), email: z.string().email().optional() }))
  .handler(async ({ data }) => {
    await requirePermission('customer', ['update'])
    const session = await getCurrentSession()

    // Get old values first
    const old = await db.query.customers.findFirst({
      where: eq(customers.id, data.id),
    })

    const updated = await db.update(customers)
      .set({ ...data })
      .where(eq(customers.id, data.id))
      .returning()

    // Log with diff
    await writeAuditLog({
      orgId: getCurrentOrgId(),
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'update',
      resource: 'customer',
      resourceId: data.id,
      resourceName: updated[0].name,
      oldValues: old ? filterSensitiveFields(old) : undefined,
      newValues: filterSensitiveFields(updated[0]),
    })

    return updated[0]
  })
```

## Audit Log Viewer

### `src/routes/app/$orgSlug/settings/audit-log.tsx`

```tsx
// Settings > Audit Log page
// Shows:
// - Filterable table (by user, action, resource, date range)
// - Export to CSV
// - Detail view showing old → new diff
```

## Data Retention

```ts
// src/workers/cleanup.worker.ts — scheduled cleanup
async function cleanupOldAuditLogs() {
  const retentionDays = 365 // Configurable
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)

  await db.delete(auditLog)
    .where(lt(auditLog.createdAt, cutoff))
}
```

## Privacy & Compliance

- Exclude PII from audit logs (passwords, tokens, SSNs)
- Provide data export for compliance (SOC 2, ISO 27001)
- Immutable logs (no UPDATE/DELETE from app code, only retention cleanup)
- Consider a separate write-only database user for audit inserts

## Sensitive Field Filter

```ts
const SENSITIVE_FIELDS = ['password', 'accessToken', 'refreshToken', 'secret', 'apiKey']

function filterSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  const filtered = { ...obj }
  for (const field of SENSITIVE_FIELDS) {
    delete (filtered as any)[field]
  }
  return filtered
}
```

## Checklist

- [ ] Create `src/db/schema/audit.ts` with audit_log table
- [ ] Create `src/features/audit/logger.ts` with writeAuditLog + diff computation
- [ ] Create `src/features/audit/middleware.ts` with withAudit decorator
- [ ] Add audit logging to all critical server functions
- [ ] Create audit log viewer page in settings
- [ ] Add audit log export (CSV)
- [ ] Add retention cleanup to scheduled jobs
- [ ] Add sensitive field filtering
- [ ] Add audit log entry for sign-in/sign-out events
- [ ] Add audit log entry for permission changes
- [ ] Run `db:generate` and `db:migrate`
