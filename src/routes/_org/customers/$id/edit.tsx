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
import {
  type Customer,
  type CustomerInput,
  getCustomer,
} from '#/features/customers/model'

export const Route = createFileRoute('/_org/customers/$id/edit')({
  beforeLoad: () => ({
    breadcrumb: 'editCustomer',
    pageTitle: 'editCustomer',
  }),
  loader: async ({ context, params }) => {
    const ctx = context as { org: { id: string } }
    return await getCustomer({
      data: { id: params.id, orgId: ctx.org.id },
    })
  },
  component: EditCustomer,
})

function EditCustomer() {
  const navigate = useNavigate()
  const customer = Route.useLoaderData() as Customer | null
  const t = useTranslations('customers')

  const form = useAppForm({
    defaultValues: {
      name: customer?.name ?? '',
      businessName: customer?.businessName ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      notes: customer?.notes ?? '',
      active: customer?.active ?? true,
    } satisfies CustomerInput,
    onSubmit: async () => {
      navigate({ to: '/customers' })
    },
  })

  if (!customer) {
    return (
      <PageContent>
        <p>{t('noCustomers')}</p>
      </PageContent>
    )
  }

  return (
    <PageContent>
      <PageHeader
        title={t('editCustomer')}
        primaryAction={{
          label: t('save'),
          onClick: () => form.handleSubmit(),
        }}
      />
      <FormRoot form={form}>
        <FormSection title={t('editCustomer')}>
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
        <FormActions>
          <form.AppForm>
            <form.SubmitButton>{t('save')}</form.SubmitButton>
          </form.AppForm>
        </FormActions>
      </FormRoot>
    </PageContent>
  )
}
