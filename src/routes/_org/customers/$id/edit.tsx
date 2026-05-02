import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslations } from 'use-intl'
import {
  createR2UploaderAdapter,
  getAcceptedMimeTypes,
  getMaxBytes,
  PhotoGridUpload,
  useUploadMachine,
} from '#/components/app/asset-upload'
import {
  FormActions,
  FormGrid,
  FormRoot,
  FormSection,
  useAppForm,
} from '#/components/app/form'
import { PageContent } from '#/components/app/page-shell/page-content'
import { PageHeader } from '#/components/app/page-shell/page-header'
import type { UploadItem } from '#/features/assets/upload-machine'
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
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [_uploadedPhotoAssetId, setUploadedPhotoAssetId] = useState<
    string | null
  >(null)

  const photoAdapter = createR2UploaderAdapter({
    ownerType: 'customer',
    usage: 'profile',
  })

  const photoMachine = useUploadMachine(uploadItems, {
    adapter: photoAdapter,
    onUploadComplete: (assetId) => setUploadedPhotoAssetId(assetId),
    onUploadError: () => {},
  })

  const form = useAppForm({
    defaultValues: {
      name: customer?.name ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      notes: customer?.notes ?? '',
      active: customer?.active ?? true,
      photoAssetId: customer?.photoAssetId ?? null,
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
            <form.AppField name="email">
              {(field) => <field.EmailField label={t('email')} />}
            </form.AppField>
            <form.AppField name="phone">
              {(field) => <field.PhoneField label={t('phone')} />}
            </form.AppField>
            <form.AppField name="notes">
              {(field) => <field.TextareaField label={t('notes')} />}
            </form.AppField>
            <div className="col-span-full">
              <p className="text-sm font-medium">{t('photo')}</p>
              <div className="mt-1">
                <PhotoGridUpload
                  items={photoMachine.items}
                  onItemsChange={(items) => setUploadItems(items)}
                  config={{
                    ownerType: 'customer',
                    usage: 'profile',
                    maxFiles: 1,
                  }}
                  adapter={photoAdapter}
                  acceptedMimeTypes={getAcceptedMimeTypes('profile')}
                  maxBytes={getMaxBytes('profile')}
                  onUploadComplete={(assetId) =>
                    setUploadedPhotoAssetId(assetId)
                  }
                />
              </div>
            </div>
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
