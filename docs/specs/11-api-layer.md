# 11 — API Layer

> Versioned REST API with OpenAPI docs, rate limiting, webhooks, and structured error responses.

## API Versioning

All API routes under `/api/v1/`:

```
src/routes/api/
├── auth/
│   └── $.ts                # Better Auth (no versioning)
├── v1/
│   ├── index.ts            # API health + OpenAPI spec
│   ├── customers.ts        # CRUD for contacts/companies
│   ├── orders.ts           # CRUD for orders
│   ├── products.ts         # CRUD for products
│   ├── inventory.ts        # Stock queries
│   ├── shipments.ts        # Shipment tracking
│   ├── invoices.ts         # Invoice CRUD
│   ├── webhooks.ts         # Webhook management
│   └── webhooks/
│       └── dispatch.ts     # Webhook event dispatch
└── webhooks/
    └── stripe.ts           # Stripe webhook receiver
```

## Structured Response Format

```ts
// src/features/api/response.ts

export type ApiResponse<T> = {
  success: true
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    cursor?: string
  }
}

export type ApiError = {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export function success<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return { success: true, data, meta }
}

export function error(
  code: string,
  message: string,
  details?: Record<string, string[]>,
): ApiError {
  return { success: false, error: { code, message, details } }
}
```

## Pagination

```ts
// src/features/api/pagination.ts
import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
})

export type PaginationParams = z.infer<typeof paginationSchema>

export async function paginateQuery<T>(
  query: any,
  params: PaginationParams,
) {
  const offset = (params.page - 1) * params.limit
  const result = await query.limit(params.limit).offset(offset)
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(query)

  return {
    data: result,
    meta: {
      page: params.page,
      limit: params.limit,
      total: Number(countResult[0]?.count ?? 0),
    },
  }
}
```

## Example API Route

### `src/routes/api/v1/customers.ts`

```ts
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { customer } from '#/db/schema/customers'
import { eq, ilike, and, or } from 'drizzle-orm'
import { success, error } from '#/features/api/response'
import { paginationSchema, paginateQuery } from '#/features/api/pagination'
import { requirePermission } from '#/features/rbac/guards'
import { getCurrentOrgId } from '#/lib/rls'
import { writeAuditLog } from '#/features/audit/logger'
import { v4 as uuid } from 'uuid'

// GET /api/v1/customers — List customers
export const listCustomers = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: z.infer<typeof paginationSchema> }) => {
    await requirePermission('customer', ['read'])
    const params = paginationSchema.parse(data)

    const query = db.select().from(customer)
      .where(eq(customer.orgId, getCurrentOrgId()))

    if (params.search) {
      query.where(
        or(
          ilike(customer.firstName, `%${params.search}%`),
          ilike(customer.lastName, `%${params.search}%`),
          ilike(customer.email, `%${params.search}%`),
        ),
      )
    }

    const result = await paginateQuery(query, params)
    return success(result.data, result.meta)
  })

// GET /api/v1/customers/:id — Get customer
export const getCustomer = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { id: string } }) => {
    await requirePermission('customer', ['read'])

    const result = await db.query.customer.findFirst({
      where: and(
        eq(customer.id, data.id),
        eq(customer.orgId, getCurrentOrgId()),
      ),
    })

    if (!result) return error('not_found', 'Customer not found')
    return success(result)
  })

// POST /api/v1/customers — Create customer
export const createCustomer = createServerFn({ method: 'POST' })
  .validator(z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    companyId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    await requirePermission('customer', ['create'])

    const [result] = await db.insert(customer).values({
      id: uuid(),
      orgId: getCurrentOrgId(),
      ...data,
    }).returning()

    await writeAuditLog({
      orgId: getCurrentOrgId(),
      action: 'create',
      resource: 'customer',
      resourceId: result.id,
      resourceName: `${data.firstName} ${data.lastName ?? ''}`.trim(),
      newValues: data,
    })

    return success(result)
  })

// PATCH /api/v1/customers/:id — Update customer
export const updateCustomer = createServerFn({ method: 'PATCH' })
  .validator(z.object({
    id: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    companyId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    await requirePermission('customer', ['update'])

    const old = await db.query.customer.findFirst({
      where: and(eq(customer.id, data.id), eq(customer.orgId, getCurrentOrgId())),
    })

    if (!old) return error('not_found', 'Customer not found')

    const [updated] = await db.update(customer)
      .set(data)
      .where(eq(customer.id, data.id))
      .returning()

    await writeAuditLog({
      orgId: getCurrentOrgId(),
      action: 'update',
      resource: 'customer',
      resourceId: data.id,
      resourceName: `${updated.firstName} ${updated.lastName ?? ''}`.trim(),
      oldValues: old,
      newValues: updated,
    })

    return success(updated)
  })

// DELETE /api/v1/customers/:id — Delete customer
export const deleteCustomer = createServerFn({ method: 'DELETE' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await requirePermission('customer', ['delete'])

    const old = await db.query.customer.findFirst({
      where: and(eq(customer.id, data.id), eq(customer.orgId, getCurrentOrgId())),
    })

    if (!old) return error('not_found', 'Customer not found')

    await db.delete(customer).where(eq(customer.id, data.id))

    await writeAuditLog({
      orgId: getCurrentOrgId(),
      action: 'delete',
      resource: 'customer',
      resourceId: data.id,
      resourceName: `${old.firstName} ${old.lastName ?? ''}`.trim(),
      oldValues: old,
    })

    return success({ deleted: true })
  })
```

## Rate Limiting

### `src/features/api/rate-limit.ts`

```ts
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
})

export async function checkRateLimit(identifier?: string) {
  const headers = getRequestHeaders()
  const ip = headers.get('x-forwarded-for') ?? '127.0.0.1'
  const id = identifier ?? ip

  const { success, limit, remaining, reset } = await ratelimit.limit(id)

  if (!success) {
    throw new Error(JSON.stringify({
      code: 'rate_limited',
      message: 'Too many requests',
      meta: { limit, remaining, reset },
    }))
  }
}

// Apply to route
// beforeLoad: async () => { await checkRateLimit() }
```

## OpenAPI Generation

```ts
// src/features/api/openapi.ts
// Use zod-to-openapi to generate spec from zod schemas

import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'

const registry = new OpenAPIRegistry()

// Register schemas and paths
registry.registerPath({
  method: 'get',
  path: '/api/v1/customers',
  summary: 'List customers',
  tags: ['Customers'],
  request: {
    query: paginationSchema,
  },
  responses: {
    200: {
      description: 'List of customers',
      content: { 'application/json': { schema: customerListResponse } },
    },
  },
})

const generator = new OpenApiGeneratorV3(registry.definitions)
export const openApiDoc = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'BaseStack API',
    version: '1.0.0',
    description: 'API for BaseStack ERP/CRM/OMS/LSM platform',
  },
  servers: [{ url: process.env.APP_URL! }],
})
```

## Webhook Management

### `src/features/webhooks/service.ts`

```ts
// src/db/schema/webhooks.ts
export const webhook = pgTable('webhook', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  events: jsonb('events').$type<string[]>().notNull(), // ['order.created', 'order.updated']
  isActive: boolean('is_active').default(true),
  lastCalledAt: timestamp('last_called_at'),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Register a webhook
export const registerWebhook = createServerFn({ method: 'POST' })
  .validator(z.object({
    url: z.string().url(),
    events: z.array(z.string()),
  }))
  .handler(async ({ data }) => {
    await requirePermission('webhook', ['create'])
    const secret = crypto.randomUUID()

    const [webhook] = await db.insert(webhooks).values({
      id: uuid(),
      orgId: getCurrentOrgId(),
      url: data.url,
      secret,
      events: data.events,
    }).returning()

    return success({ id: webhook.id, secret }) // secret only shown once
  })
```

## Authentication for API

API routes use Bearer token auth (API keys) in addition to session cookies:

```ts
// src/features/api/auth.ts
export async function authenticateApiRequest() {
  const headers = getRequestHeaders()
  const authHeader = headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.slice(7)
    // Validate API key from db
    const key = await db.query.apiKey.findFirst({
      where: and(eq(apiKey.key, apiKey), eq(apiKey.isActive, true)),
    })
    if (!key) throw new Error('Invalid API key')
    return { type: 'api_key' as const, orgId: key.orgId, scopes: key.scopes }
  }

  // Fall back to session cookie
  const session = await getCurrentSession()
  if (!session) throw new Error('Unauthorized')
  return { type: 'session' as const, session }
}
```

## Checklist

- [ ] Create `src/features/api/response.ts` with success/error helpers
- [ ] Create `src/features/api/pagination.ts` with paginateQuery
- [ ] Create `src/features/api/rate-limit.ts` with Upstash rate limiting
- [ ] Create `src/features/api/auth.ts` with Bearer token + session auth
- [ ] Create API routes under `src/routes/api/v1/`
- [ ] Generate OpenAPI spec with `zod-to-openapi`
- [ ] Serve OpenAPI spec at `/api/v1/openapi.json`
- [ ] Add API key management page in settings
- [ ] Create webhook management table + UI
- [ ] Add webhook dispatch to business events (order.*, invoice.*, etc.)
- [ ] Add rate limiting to API routes
- [ ] Run `db:generate` and `db:migrate`
