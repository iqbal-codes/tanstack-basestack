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

function ProtectedLayout() {
  return <Outlet />
}

function buildProtectedRouter(initialEntry: string) {
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
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
        })
      }

      const orgs = await mockListUserOrgs()

      if (orgs.length === 0) {
        throw redirect({ to: '/onboarding' })
      }

      return { session, org: orgs[0] }
    },
    component: ProtectedLayout,
  })
  const orgIndexRoute = createRoute({
    getParentRoute: () => orgLayoutRoute,
    path: '/',
    component: () => <div>Dashboard Page</div>,
  })
  const orgNestedRoute = createRoute({
    getParentRoute: () => orgLayoutRoute,
    path: 'orders',
    component: () => <div>Orders Page</div>,
  })

  const routeTree = rootRoute.addChildren([
    signInRoute,
    onboardingRoute,
    orgLayoutRoute.addChildren([orgIndexRoute, orgNestedRoute]),
  ])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
}

function buildAuthPageRouter(
  initialEntry: string,
  path: '/sign-in' | '/sign-up',
) {
  const rootRoute = createRootRoute()
  const onboardingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/onboarding',
    component: () => <div>Onboarding Page</div>,
  })
  const authRoute = createRoute({
    getParentRoute: () => rootRoute,
    path,
    beforeLoad: async () => {
      const session = await mockGetCurrentSession()

      if (session) {
        throw redirect({ to: '/onboarding' })
      }
    },
    component: () =>
      path === '/sign-in' ? <div>Sign In Page</div> : <div>Sign Up Page</div>,
  })

  const routeTree = rootRoute.addChildren([onboardingRoute, authRoute])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
}

type TestRouter =
  | ReturnType<typeof buildProtectedRouter>
  | ReturnType<typeof buildAuthPageRouter>

async function renderRouter(router: TestRouter) {
  await act(async () => {
    render(<RouterProvider router={router} />)
  })
}

beforeEach(() => {
  mockGetCurrentSession.mockReset()
  mockListUserOrgs.mockReset()
})

describe('workspace route guards', () => {
  it('redirects unauthenticated users from / to sign-in', async () => {
    mockGetCurrentSession.mockResolvedValue(null)
    mockListUserOrgs.mockResolvedValue([])

    const router = buildProtectedRouter('/')

    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Sign In Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(router.state.location.href).toBe('/sign-in?redirect=%2F')
  })

  it('redirects unauthenticated users from nested workspace routes to sign-in', async () => {
    mockGetCurrentSession.mockResolvedValue(null)
    mockListUserOrgs.mockResolvedValue([])

    const router = buildProtectedRouter('/orders')

    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Sign In Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(router.state.location.href).toBe('/sign-in?redirect=%2Forders')
  })

  it('redirects authenticated users without an org to onboarding', async () => {
    mockGetCurrentSession.mockResolvedValue(createMockSession())
    mockListUserOrgs.mockResolvedValue([])

    const router = buildProtectedRouter('/')

    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Onboarding Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/onboarding')
  })

  it('renders the workspace for authenticated users with an org', async () => {
    mockGetCurrentSession.mockResolvedValue(createMockSession())
    mockListUserOrgs.mockResolvedValue([
      {
        id: 'org-1',
        name: 'My Workshop',
        slug: 'my-workshop',
        logo: null,
      },
    ])

    const router = buildProtectedRouter('/')

    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Dashboard Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('auth page guards', () => {
  it('renders sign-in for unauthenticated users', async () => {
    mockGetCurrentSession.mockResolvedValue(null)

    const router = buildAuthPageRouter('/sign-in', '/sign-in')

    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Sign In Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/sign-in')
  })

  it('renders sign-up for unauthenticated users', async () => {
    mockGetCurrentSession.mockResolvedValue(null)

    const router = buildAuthPageRouter('/sign-up', '/sign-up')

    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Sign Up Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/sign-up')
  })

  it('redirects authenticated users away from sign-in to onboarding', async () => {
    mockGetCurrentSession.mockResolvedValue(createMockSession())

    const router = buildAuthPageRouter('/sign-in', '/sign-in')

    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Onboarding Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/onboarding')
  })

  it('redirects authenticated users away from sign-up to onboarding', async () => {
    mockGetCurrentSession.mockResolvedValue(createMockSession())

    const router = buildAuthPageRouter('/sign-up', '/sign-up')

    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Onboarding Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/onboarding')
  })
})
