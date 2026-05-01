import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslations } from 'use-intl'
import {
  FormActions,
  FormGrid,
  FormRoot,
  FormSection,
  useAppForm,
} from '#/components/app/form'
import { PageContent } from '#/components/app/page-shell/page-content'
import { PageHeader } from '#/components/app/page-shell/page-header'
import type { CustomerInput } from '#/features/customers/model'

export const Route = createFileRoute('/_org/customers/new')({
  beforeLoad: () => ({
    breadcrumb: 'createCustomer',
    pageTitle: 'createCustomer',
  }),
  component: CreateCustomer,
})

function CreateCustomer() {
  const navigate = useNavigate()
  const t = useTranslations('customers')

  const form = useAppForm({
    defaultValues: {
      name: '',
      businessName: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      active: true,
    } satisfies CustomerInput,
    onSubmit: async () => {
      navigate({ to: '/customers' })
    },
  })

  return (
    <PageContent>
      <PageHeader
        title={t('createCustomer')}
        primaryAction={{
          label: t('save'),
          onClick: () => form.handleSubmit(),
        }}
      />
      <FormRoot form={form}>
        <FormSection title={t('createCustomer')}>
          <FormGrid>
            <form.AppField name="name">
              {(field) => <field.TextField label={t('name')} />}
            </form.AppField>
            <form.AppField name="businessName">
              {(field) => (
                <field.TextField label={t('businessName')} optional />
              )}
            </form.AppField>
            <form.AppField name="email">
              {(field) => <field.EmailField label={t('email')} />}
            </form.AppField>
            <form.AppField name="phone">
              {(field) => <field.PhoneField label={t('phone')} />}
            </form.AppField>
            <form.AppField name="address">
              {(field) => <field.TextareaField label={t('address')} />}
            </form.AppField>
            <form.AppField name="notes">
              {(field) => <field.TextareaField label={t('notes')} />}
            </form.AppField>
          </FormGrid>
        </FormSection>
      </FormRoot>
    </PageContent>
  )
}
