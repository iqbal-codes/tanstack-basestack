import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useTranslations } from 'use-intl'
import { AppSidebar } from '#/components/app-sidebar'
import { Separator } from '#/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { getCurrentSession } from '#/lib/auth-session'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    const session = await getCurrentSession()

    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    return { session }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { session } = Route.useRouteContext()
  const t = useTranslations('admin')
  const user = {
    name: session.user.name || session.user.email,
    email: session.user.email,
    avatar: session.user.image || '',
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{t('console')}</p>
            <p className="truncate text-xs text-muted-foreground">
              {t('protected')}
            </p>
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
