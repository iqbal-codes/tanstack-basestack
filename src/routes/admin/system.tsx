import { useForm } from '@tanstack/react-form'
import { createFileRoute } from '@tanstack/react-router'
import { Save } from 'lucide-react'
import { useTranslations } from 'use-intl'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { adminUiStore } from '#/features/admin/model'

export const Route = createFileRoute('/admin/system')({
  component: AdminSystemRoute,
})

function AdminSystemRoute() {
  const t = useTranslations('admin')
  const form = useForm({
    defaultValues: {
      label: 'Admin shell ready',
      note: 'Better Auth protects admin routes before render.',
    },
    onSubmit: ({ value }) => {
      adminUiStore.actions.setBanner(value.label)
    },
  })

  return (
    <main className="p-4 md:p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('systemTitle')}</CardTitle>
          <CardDescription>{t('systemDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <form.Field
                name="label"
                validators={{
                  onChange: ({ value }) =>
                    value.trim().length < 3 ? t('labelMin') : undefined,
                }}
              >
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>{t('banner')}</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    <FieldError>
                      {field.state.meta.errors[0]
                        ? String(field.state.meta.errors[0])
                        : null}
                    </FieldError>
                  </Field>
                )}
              </form.Field>
              <form.Field name="note">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t('internalNote')}
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
            <Button type="submit">
              <Save />
              {t('save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
