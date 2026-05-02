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
  FormGrid,
  FormRoot,
  FormSection,
  useAppForm,
} from '#/components/app/form'
import { PageContent } from '#/components/app/page-shell/page-content'
import { PageHeader } from '#/components/app/page-shell/page-header'
import type { UploadItem } from '#/features/assets/upload-machine'
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
      name: '',
      email: '',
      phone: '',
      notes: '',
      active: true,
      photoAssetId: null,
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
      </FormRoot>
    </PageContent>
  )
}
