import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { Database, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { useTranslations } from 'use-intl'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  adminActionCollection,
  adminSummary,
  adminUiStore,
  getAdminSummary,
} from '#/features/admin/model'

export const Route = createFileRoute('/admin/')({
  component: AdminOverviewRoute,
})

function AdminOverviewRoute() {
  const density = useStore(adminUiStore, (state) => state.density)
  const banner = useStore(adminUiStore, (state) => state.banner)
  const t = useTranslations('admin')
  const ts = useTranslations('adminSeed')
  const { data } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => getAdminSummary(),
    initialData: adminSummary,
  })
  const actions = adminActionCollection.toArray

  return (
    <main className="space-y-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('overview')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {banner}. Query, Store, and DB are wired into this protected page.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            adminUiStore.actions.setDensity(
              density === 'compact' ? 'comfortable' : 'compact',
            )
          }
        >
          <SlidersHorizontal />
          {density === 'compact' ? t('comfortable') : t('compact')}
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {data.metrics.map((metric, i) => {
          const keys = (
            [
              { label: 'protectedPages', detail: 'protectedPagesDetail' },
              { label: 'sessionSource', detail: 'sessionSourceDetail' },
              { label: 'clientState', detail: 'clientStateDetail' },
            ] as const
          )[i]
          return (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardDescription>{ts(keys.label)}</CardDescription>
                <CardTitle className="text-2xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {ts(keys.detail)}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              {t('adminUsers')}
            </CardTitle>
            <CardDescription>{t('adminUsersDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              {data.users.map((user) => (
                <div
                  key={user.id}
                  className={`grid gap-2 border-b px-4 last:border-b-0 md:grid-cols-[1fr_auto_auto] md:items-center ${
                    density === 'compact' ? 'py-2' : 'py-3'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant="secondary">{user.role}</Badge>
                  <Badge
                    variant={user.status === 'Active' ? 'default' : 'outline'}
                  >
                    {user.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              {t('localActions')}
            </CardTitle>
            <CardDescription>{t('localActionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.map((action) => (
              <div key={action.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{action.title}</p>
                  <Badge variant="outline">{action.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('owner')}: {action.owner}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
