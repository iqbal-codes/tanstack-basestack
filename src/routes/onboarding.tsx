import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import { useAppForm } from '#/components/app/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { createOrganization, listUserOrgs } from '#/features/auth/org'
import { getCurrentSession } from '#/lib/auth-session'

const ERROR_MAP: Record<string, string> = {
  name_invalid: 'nameInvalid',
  creation_failed: 'creationFailed',
  name_taken: 'taken',
}

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const session = await getCurrentSession()
    if (!session) {
      throw redirect({ to: '/sign-in', search: { redirect: undefined } })
    }
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const t = useTranslations('org')
  const ct = useTranslations('common')
  const navigate = useNavigate()
  const { data: orgs, isLoading } = useQuery({
    queryKey: ['user-orgs'],
    queryFn: () => listUserOrgs(),
  })

  useEffect(() => {
    if (orgs && orgs.length > 0) {
      navigate({ to: '/' })
    }
  }, [orgs, navigate])

  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useAppForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      setSubmitError(null)

      const result = await createOrganization({ data: { name: value.name } })

      if (!result.ok) {
        const key = ERROR_MAP[result.error as keyof typeof ERROR_MAP]
        setSubmitError(key ? t(key) : t('creationFailed'))
        return
      }

      navigate({ to: '/' })
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{ct('loading')}</p>
      </div>
    )
  }

  if (orgs && orgs.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('redirecting')}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('welcome')}</CardTitle>
          <CardDescription>{t('createDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <form.AppField
              name="name"
              validators={{
                onChange: ({ value }) =>
                  value.trim().length < 2 ? t('nameMin') : undefined,
              }}
            >
              {(field) => (
                <field.TextField
                  label={t('name')}
                  placeholder={t('namePlaceholder')}
                />
              )}
            </form.AppField>

            {submitError && (
              <form.AppForm>
                <form.FormError message={submitError} />
              </form.AppForm>
            )}

            <form.AppForm>
              <form.SubmitButton className="mt-6 w-full">
                {t('create')}
              </form.SubmitButton>
            </form.AppForm>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
