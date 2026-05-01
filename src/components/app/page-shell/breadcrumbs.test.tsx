import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Breadcrumbs } from './breadcrumbs'

async function renderBreadcrumbs(
  routes: { path: string; breadcrumb: string }[],
) {
  const rootRoute = createRootRoute()

  const children = routes.map((r) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: r.path,
      beforeLoad: () => ({ breadcrumb: r.breadcrumb }),
    }),
  )

  const routeTree = rootRoute.addChildren(children)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [routes[routes.length - 1].path],
    }),
  })

  await router.load()

  render(
    <RouterProvider router={router} defaultComponent={() => <Breadcrumbs />} />,
  )
}

describe('Breadcrumbs', () => {
  it('renders nothing for root-only match', async () => {
    const rootRoute = createRootRoute()
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()

    const { container } = render(
      <RouterProvider
        router={router}
        defaultComponent={() => <Breadcrumbs />}
      />,
    )
    expect(container.textContent).toBe('')
  })

  it('renders a single breadcrumb for a dashboard route', async () => {
    await renderBreadcrumbs([{ path: '/', breadcrumb: 'Dashboard' }])
    expect(screen.getByText('Dashboard')).toBeDefined()
  })

  it('renders the last crumb as the current page', async () => {
    await renderBreadcrumbs([
      { path: '/', breadcrumb: 'Dashboard' },
      { path: '/orders', breadcrumb: 'Orders' },
    ])
    expect(screen.getByText('Orders')).toBeDefined()
  })
})
