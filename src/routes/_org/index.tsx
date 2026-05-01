import { createFileRoute } from '@tanstack/react-router'
import { useTranslations } from 'use-intl'
import { PageContent } from '#/components/app/page-shell/page-content'
import { PageHeader } from '#/components/app/page-shell/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

export const Route = createFileRoute('/_org/')({
  beforeLoad: () => ({
    breadcrumb: 'Dashboard',
    pageTitle: 'Dashboard',
  }),
  component: OrgDashboard,
})

function OrgDashboard() {
  const t = useTranslations('dashboard')

  return (
    <PageContent>
      <PageHeader title={t('activeOrders')} />
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('activeOrders')}</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('activeOrdersDesc')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('products')}</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('productsDesc')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('invoices')}</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('invoicesDesc')}
          </CardContent>
        </Card>
      </section>
    </PageContent>
  )
}
