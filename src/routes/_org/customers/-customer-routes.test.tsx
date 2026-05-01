import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  redirect,
} from '@tanstack/react-router'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type CustomerRow = {
  id: string
  name: string
  businessName: string | null
  email: string | null
  phone: string | null
  active: boolean
}

type MockSession = {
  session: {
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: string
    refreshTokenExpiresAt: string
    clientId: string
    userId: string
    scopes: string
  }
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

type MockOrg = {
  id: string
  name: string
  slug: string
  logo: string | null
}

function createMockSession(): MockSession {
  return {
    session: {
      accessToken: 'test-token',
      refreshToken: 'test-refresh-token',
      accessTokenExpiresAt: '2026-01-01T00:00:00.000Z',
      refreshTokenExpiresAt: '2026-01-01T00:00:00.000Z',
      clientId: 'test-client',
      userId: 'user-1',
      scopes: '',
    },
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
    },
  }
}

const mockGetCurrentSession = vi.fn<() => Promise<MockSession | null>>()
const mockListUserOrgs = vi.fn<() => Promise<Array<MockOrg>>>()
const mockListCustomers =
  vi.fn<() => Promise<{ rows: CustomerRow[]; totalRows: number }>>()

function ProtectedLayout() {
  return <Outlet />
}

function buildCustomerRouter(initialEntry: string) {
  const rootRoute = createRootRoute()
  const signInRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sign-in',
    component: () => <div>Sign In Page</div>,
  })
  const onboardingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/onboarding',
    component: () => <div>Onboarding Page</div>,
  })
  const orgLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '_org',
    beforeLoad: async ({ location }) => {
      const session = await mockGetCurrentSession()
      if (!session) {
        throw redirect({ to: '/sign-in', search: { redirect: location.href } })
      }
      const orgs = await mockListUserOrgs()
      if (orgs.length === 0) {
        throw redirect({ to: '/onboarding' })
      }
      return { session, org: orgs[0] }
    },
    component: ProtectedLayout,
  })
  const dashboardRoute = createRoute({
    getParentRoute: () => orgLayoutRoute,
    path: '/',
    component: () => <div>Dashboard Page</div>,
  })
  const customersRoute = createRoute({
    getParentRoute: () => orgLayoutRoute,
    path: 'customers',
    beforeLoad: () => ({
      breadcrumb: 'customers',
      pageTitle: 'customers',
    }),
    loader: async () => {
      return await mockListCustomers()
    },
    component: () => {
      const data = customersRoute.useLoaderData() as {
        rows: CustomerRow[]
        totalRows: number
      }
      return (
        <div>
          <h1>Customers List</h1>
          <div data-testid="customer-count">{data.totalRows}</div>
          {data.rows.map((c) => (
            <div key={c.id} data-testid="customer-row">
              {c.name}
            </div>
          ))}
        </div>
      )
    },
  })

  const routeTree = rootRoute.addChildren([
    signInRoute,
    onboardingRoute,
    orgLayoutRoute.addChildren([dashboardRoute, customersRoute]),
  ])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
}

async function renderRouter(router: ReturnType<typeof buildCustomerRouter>) {
  await act(async () => {
    render(<RouterProvider router={router} />)
  })
}

beforeEach(() => {
  mockGetCurrentSession.mockReset()
  mockListUserOrgs.mockReset()
  mockListCustomers.mockReset()
})

function setupAuthenticated() {
  mockGetCurrentSession.mockResolvedValue(createMockSession())
  mockListUserOrgs.mockResolvedValue([
    { id: 'org-1', name: 'My Workshop', slug: 'my-workshop', logo: null },
  ])
}

describe('customer list route', () => {
  it('renders customer list page for authenticated users with org', async () => {
    setupAuthenticated()
    mockListCustomers.mockResolvedValue({
      rows: [
        {
          id: 'c1',
          name: 'Acme Corp',
          businessName: null,
          email: 'acme@test.com',
          phone: '08123456789',
          active: true,
        },
      ],
      totalRows: 1,
    })

    const router = buildCustomerRouter('/customers')
    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Customers List')).toBeDefined()
    expect(await screen.findByText('Acme Corp')).toBeDefined()
    expect(screen.getByTestId('customer-count').textContent).toBe('1')
  })

  it('redirects unauthenticated users from /customers to sign-in', async () => {
    mockGetCurrentSession.mockResolvedValue(null)
    mockListUserOrgs.mockResolvedValue([])

    const router = buildCustomerRouter('/customers')
    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Sign In Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/sign-in')
  })
})
