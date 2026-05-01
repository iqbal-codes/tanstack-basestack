import { createFileRoute } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { useTranslations } from 'use-intl'
import { EmptyState } from '#/components/app/page-shell/empty-state'
import { PageContent } from '#/components/app/page-shell/page-content'
import { PageHeader } from '#/components/app/page-shell/page-header'

export const Route = createFileRoute('/_org/products/')({
  beforeLoad: () => ({
    breadcrumb: 'products',
    pageTitle: 'products',
  }),
  component: ProductsPage,
})

function ProductsPage() {
  const t = useTranslations('products')

  return (
    <PageContent>
      <PageHeader
        title={t('title')}
        primaryAction={{ label: t('createProduct'), href: '/products/new' }}
      />
      <EmptyState
        icon={Package}
        title={t('noProducts')}
        description={t('noProductsDesc')}
        action={{ label: t('createProduct'), href: '/products/new' }}
      />
    </PageContent>
  )
}
