import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslations } from 'use-intl'
import { useAppForm } from '#/components/app/form/form-context'
import {
  FormGrid,
  FormRoot,
  FormSection,
} from '#/components/app/form/form-layout'
import { PageContent } from '#/components/app/page-shell/page-content'
import { PageHeader } from '#/components/app/page-shell/page-header'
import { createProductFn } from '#/features/products/server'

export const Route = createFileRoute('/_org/products/new')({
  beforeLoad: () => ({
    breadcrumb: 'newProduct',
    pageTitle: 'newProduct',
  }),
  component: NewProductPage,
})

function NewProductPage() {
  const t = useTranslations('products')
  const navigate = useNavigate()

  const form = useAppForm({
    defaultValues: {
      name: '',
      description: '',
      productionNotes: '',
    },
    onSubmit: async ({ value }) => {
      await createProductFn({ data: value })
      navigate({ to: '/products' })
    },
  })

  return (
    <PageContent>
      <PageHeader title={t('createTitle')} />
      <FormRoot form={form}>
        <FormSection title={t('name')}>
          <FormGrid>
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label={t('name')}
                  placeholder={t('namePlaceholder')}
                />
              )}
            </form.AppField>
            <form.AppField name="description">
              {(field) => (
                <field.TextareaField
                  label={t('description')}
                  placeholder={t('descriptionPlaceholder')}
                />
              )}
            </form.AppField>
          </FormGrid>
        </FormSection>

        <FormSection title={t('productionNotes')}>
          <FormGrid>
            <form.AppField name="productionNotes">
              {(field) => (
                <field.TextareaField
                  label={t('productionNotes')}
                  placeholder={t('productionNotesPlaceholder')}
                />
              )}
            </form.AppField>
          </FormGrid>
        </FormSection>

        <form.AppForm>
          <form.SubmitButton>{t('createProduct')}</form.SubmitButton>
        </form.AppForm>
      </FormRoot>
    </PageContent>
  )
}
