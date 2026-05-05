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

const mockGetCurrentSession = vi.fn<() => Promise<MockSession | null>>()

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
  const protectedRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '/_protected',
    beforeLoad: async ({ location }) => {
      const session = await mockGetCurrentSession()

      if (!session) {
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
        })
      }

      return { session }
    },
    component: ProtectedLayout,
  })
  const dashboardRoute = createRoute({
    getParentRoute: () => protectedRoute,
    path: '/',
    component: () => <div>Dashboard Page</div>,
  })

  const routeTree = rootRoute.addChildren([
    signInRoute,
    protectedRoute.addChildren([dashboardRoute]),
  ])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
}

function buildAuthPageRouter(path: '/sign-in' | '/sign-up') {
  const rootRoute = createRootRoute()
  const authRoute = createRoute({
    getParentRoute: () => rootRoute,
    path,
    beforeLoad: async () => {
      const session = await mockGetCurrentSession()

      if (session) {
        throw redirect({ to: '/' })
      }
    },
    component: () =>
      path === '/sign-in' ? <div>Sign In Page</div> : <div>Sign Up Page</div>,
  })

  const routeTree = rootRoute.addChildren([authRoute])

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
}

async function renderRouter(router: ReturnType<typeof buildProtectedRouter>) {
  await act(async () => {
    render(<RouterProvider router={router} />)
  })
}

beforeEach(() => {
  mockGetCurrentSession.mockReset()
})

describe('protected route guards', () => {
  it('redirects unauthenticated users from / to sign-in', async () => {
    mockGetCurrentSession.mockResolvedValue(null)

    const router = buildProtectedRouter('/')

    await router.load()
    await renderRouter(router)

    expect(await screen.findByText('Sign In Page')).toBeDefined()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(router.state.location.href).toBe('/sign-in?redirect=%2F')
  })

  it('renders dashboard for authenticated users', async () => {
    mockGetCurrentSession.mockResolvedValue({
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
    })

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

    const router = buildAuthPageRouter('/sign-in')

    await router.load()

    expect(router.state.location.pathname).toBe('/sign-in')
  })

  it('renders sign-up for unauthenticated users', async () => {
    mockGetCurrentSession.mockResolvedValue(null)

    const router = buildAuthPageRouter('/sign-up')

    await router.load()

    expect(router.state.location.pathname).toBe('/sign-up')
  })
})
