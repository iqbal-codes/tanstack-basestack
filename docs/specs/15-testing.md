# 15 — Testing

> Vitest unit/integration tests, Playwright E2E tests, component tests with Testing Library.

## Test Infrastructure (Already Installed)

```
Vitest v4.1
@testing-library/react v16.3
@testing-library/dom v10.4
jsdom v28.1
```

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                  # Global test setup
│   ├── helpers.ts                # Shared test utilities
│   ├── unit/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── rbac/
│   │   │   ├── billing/
│   │   │   └── workflow/
│   │   └── lib/
│   │       ├── i18n.test.ts
│   │       └── utils.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── customers.test.ts
│   │   │   ├── orders.test.ts
│   │   │   └── auth.test.ts
│   │   └── db/
│   │       ├── schema.test.ts
│   │       └── rls.test.ts
│   └── components/
│       ├── auth-form.test.tsx
│       ├── notification-center.test.tsx
│       └── data-table.test.tsx
└── e2e/
    ├── auth.spec.ts
    ├── onboarding.spec.ts
    ├── orders.spec.ts
    └── billing.spec.ts
```

## `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    alias: {
      '#/': path.resolve(__dirname, './src/'),
      '@/': path.resolve(__dirname, './src/'),
    },
  },
})
```

## Test Setup

### `src/__tests__/setup.ts`

```ts
import '@testing-library/react'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { server } from './mocks/server'

// Start MSW server for API mocking
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// Mock environment variables
process.env.BETTER_AUTH_SECRET = 'test-secret-at-least-32-characters-long!'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.REDIS_URL = 'redis://localhost:6379'
```

### `src/__tests__/helpers.ts`

```ts
import { render, type RenderOptions } from '@testing-library/react'
import { IntlProvider } from 'use-intl'
import { TooltipProvider } from '#/components/ui/tooltip'
import { messages } from '#/messages'
import type { ReactElement } from 'react'

// Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <IntlProvider locale="en" messages={messages.en}>
        <TooltipProvider>{children}</TooltipProvider>
      </IntlProvider>
    ),
    ...options,
  })
}

// Mock server function
export function mockServerFn<T>(fn: () => Promise<T>, result: T) {
  return vi.fn().mockResolvedValue(result)
}

// Create test data factories
export function createTestOrg(overrides = {}) {
  return {
    id: 'org_test_001',
    name: 'Test Organization',
    slug: 'test-org',
    ...overrides,
  }
}

export function createTestCustomer(overrides = {}) {
  return {
    id: 'cust_test_001',
    orgId: 'org_test_001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    ...overrides,
  }
}
```

## Unit Test Examples

### `src/__tests__/unit/features/rbac/permissions.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { owner, admin, member, viewer, operator } from '#/features/rbac/permissions'

describe('RBAC Permissions', () => {
  describe('Owner role', () => {
    it('can perform all customer actions', () => {
      const perms = owner.statements
      expect(perms.customer).toEqual(['create', 'read', 'update', 'delete', 'export'])
    })

    it('can manage billing', () => {
      const perms = owner.statements
      expect(perms.billing).toEqual(['read', 'update', 'manage'])
    })
  })

  describe('Member role', () => {
    it('can only read and create customers', () => {
      const perms = member.statements
      expect(perms.customer).toEqual(['create', 'read'])
    })

    it('cannot delete orders', () => {
      const perms = member.statements
      expect(perms.order).not.toContain('delete')
    })

    it('has read-only access to settings', () => {
      const perms = member.statements
      expect(perms.settings).toEqual(['read'])
    })
  })

  describe('Viewer role', () => {
    it('has read-only access across all resources', () => {
      const perms = viewer.statements
      for (const [resource, actions] of Object.entries(perms)) {
        expect(actions).toEqual(['read'])
      }
    })
  })

  describe('Operator role', () => {
    it('can manage orders and shipments', () => {
      const perms = operator.statements
      expect(perms.order).toContain('create')
      expect(perms.order).toContain('update')
      expect(perms.shipment).toContain('fulfill')
    })
  })
})
```

### `src/__tests__/unit/features/workflow/order-machine.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { orderMachine } from '#/features/workflow/order-machine'

describe('Order State Machine', () => {
  it('starts in draft state', () => {
    const actor = createActor(orderMachine, {
      input: { orderId: '1', orderNumber: 'ORD-001', orgId: 'org1' },
    })
    actor.start()
    expect(actor.getSnapshot().value).toBe('draft')
    actor.stop()
  })

  it('transitions: draft → confirmed → processing → shipped → delivered', () => {
    const actor = createActor(orderMachine, {
      input: { orderId: '1', orderNumber: 'ORD-001', orgId: 'org1' },
    })
    actor.start()

    actor.send({ type: 'CONFIRM', updatedById: 'user1' })
    expect(actor.getSnapshot().value).toBe('confirmed')

    actor.send({ type: 'START_PROCESSING', updatedById: 'user1' })
    expect(actor.getSnapshot().value).toBe('processing')

    actor.send({ type: 'MARK_SHIPPED', updatedById: 'user1' })
    expect(actor.getSnapshot().value).toBe('shipped')

    actor.send({ type: 'MARK_DELIVERED', updatedById: 'user1' })
    expect(actor.getSnapshot().value).toBe('delivered')

    actor.stop()
  })

  it('supports on-hold and release', () => {
    const actor = createActor(orderMachine, {
      input: { orderId: '1', orderNumber: 'ORD-001', orgId: 'org1' },
    })
    actor.start()

    actor.send({ type: 'CONFIRM', updatedById: 'user1' })
    actor.send({ type: 'HOLD', updatedById: 'user1', reason: 'Payment pending' })
    expect(actor.getSnapshot().value).toBe('on_hold')

    actor.send({ type: 'RELEASE_HOLD', updatedById: 'user1' })
    expect(actor.getSnapshot().value).toBe('processing')

    actor.stop()
  })

  it('cannot ship from draft', () => {
    const actor = createActor(orderMachine, {
      input: { orderId: '1', orderNumber: 'ORD-001', orgId: 'org1' },
    })
    actor.start()

    // Should throw — invalid transition
    expect(() => {
      actor.send({ type: 'MARK_SHIPPED', updatedById: 'user1' })
    }).not.toThrow() // xstate silently ignores invalid transitions

    expect(actor.getSnapshot().value).toBe('draft') // Still in draft
    actor.stop()
  })
})
```

## Integration Test Example

### `src/__tests__/integration/db/rls.test.ts`

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '#/db/index'
import { customer } from '#/db/schema/customers'
import { setCurrentOrg, resetCurrentOrg } from '#/lib/rls'
import { v4 as uuid } from 'uuid'

describe('Row-Level Security', () => {
  const orgA = 'org_test_a'
  const orgB = 'org_test_b'

  beforeAll(async () => {
    // Seed test data
    await db.insert(customer).values([
      { id: 'cust_a1', orgId: orgA, firstName: 'Alice', email: 'alice@a.com' },
      { id: 'cust_b1', orgId: orgB, firstName: 'Bob', email: 'bob@b.com' },
    ])
  })

  it('only returns customers for the current org', async () => {
    await setCurrentOrg(orgA)
    const results = await db.select().from(customer)
    expect(results).toHaveLength(1)
    expect(results[0].firstName).toBe('Alice')

    await setCurrentOrg(orgB)
    const resultsB = await db.select().from(customer)
    expect(resultsB).toHaveLength(1)
    expect(resultsB[0].firstName).toBe('Bob')

    await resetCurrentOrg()
  })

  it('prevents inserting with wrong org_id', async () => {
    await setCurrentOrg(orgA)

    // This should fail because RLS policy requires org_id = current org
    // (depends on exact RLS policy implementation)
    try {
      await db.insert(customer).values({
        id: 'cust_a2', orgId: orgB, firstName: 'Eve', email: 'eve@b.com',
      })
    } catch {
      // Expected — RLS blocks
    }

    await resetCurrentOrg()
  })

  afterAll(async () => {
    await db.delete(customer).where(eq(customer.id, 'cust_a1'))
    await db.delete(customer).where(eq(customer.id, 'cust_b1'))
  })
})
```

## Component Test Example

### `src/__tests__/components/auth-form.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '#/__tests__/helpers'

// Mock auth client
vi.mock('#/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
  },
}))

import { AuthForm } from '#/features/auth/AuthForm'

describe('AuthForm', () => {
  it('renders sign-in form', () => {
    renderWithProviders(<AuthForm mode="sign-in" redirectTo="/admin" />)
    expect(screen.getByText('Sign in')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders sign-up form with name field', () => {
    renderWithProviders(<AuthForm mode="sign-up" redirectTo="/admin" />)
    expect(screen.getByText('Create an account')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  it('shows validation errors', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthForm mode="sign-in" redirectTo="/admin" />)

    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'invalid')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    })
  })
})
```

## E2E (Playwright)

### `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 2,
  workers: 1, // Sequential for DB tests
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bun run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
```

### `e2e/auth.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('redirects unauthenticated user to sign-in', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('sign in with valid credentials', async ({ page }) => {
    await page.goto('/sign-in')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/)
  })
})
```

## Test Coverage Goals

| Area | Target |
|------|--------|
| RBAC permissions | 100% (pure logic) |
| State machines | 100% (transitions) |
| Validation schemas | 100% (zod) |
| Server functions | 80% |
| UI components | 60% |
| E2E critical paths | 100% |

## Checklist

- [ ] Create `vitest.config.ts` at project root
- [ ] Create `src/__tests__/setup.ts` with global mocks
- [ ] Create `src/__tests__/helpers.ts` with render utilities
- [ ] Write unit tests for RBAC permissions
- [ ] Write unit tests for workflow state machines
- [ ] Write unit tests for validation schemas (zod)
- [ ] Write unit tests for utility functions (i18n, sanitization)
- [ ] Write integration tests for API routes
- [ ] Write integration tests for RLS policies
- [ ] Write component tests for AuthForm, NotificationCenter, DataTable
- [ ] Set up Playwright for E2E tests
- [ ] Write E2E tests for sign-up → sign-in → dashboard flow
- [ ] Write E2E tests for order creation flow
- [ ] Add test coverage reporting
- [ ] Add test script to CI pipeline
