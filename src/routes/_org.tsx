import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { Breadcrumbs } from '#/components/app/page-shell/breadcrumbs'
import { AppSidebar } from '#/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { listUserOrgs } from '#/features/auth/org'
import { getCurrentSession } from '#/lib/auth-session'

export const Route = createFileRoute('/_org')({
  beforeLoad: async ({ location }) => {
    const session = await getCurrentSession()
    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    const orgs = await listUserOrgs()
    if (!orgs || orgs.length === 0) {
      throw redirect({ to: '/onboarding' })
    }

    return { session, org: orgs[0] }
  },
  component: OrgLayout,
})

function OrgLayout() {
  const { session, org } = Route.useRouteContext()
  const user = {
    name: session.user.name || session.user.email,
    email: session.user.email,
    avatar: session.user.image || '',
  }

  const matches = useRouterState({ select: (s) => s.matches })
  const leafMatch = matches.filter((m) => m.routeId !== '__root__').at(-1)
  const pageTitle = (leafMatch?.context as unknown as Record<string, unknown>)
    ?.pageTitle as string | undefined

  return (
    <SidebarProvider>
      <AppSidebar user={user} org={org} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2 md:gap-0">
            <SidebarTrigger />
            <Breadcrumbs />
          </div>
          <div className="md:hidden ml-auto flex items-center gap-2">
            <span className="text-sm font-medium truncate max-w-32">
              {pageTitle}
            </span>
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
