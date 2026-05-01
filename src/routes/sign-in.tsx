import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthForm } from '#/features/auth/AuthForm'
import { getCurrentSession } from '#/lib/auth-session'

function sanitizeRedirect(value: unknown) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//')
  ) {
    return undefined
  }

  return value
}

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search) => ({
    redirect: sanitizeRedirect(search.redirect),
  }),
  beforeLoad: async ({ search }) => {
    const session = await getCurrentSession()

    if (session) {
      throw redirect({ to: search.redirect ?? '/onboarding' })
    }
  },
  component: SignInRoute,
})

function SignInRoute() {
  const search = Route.useSearch()

  return (
    <AuthForm mode="sign-in" redirectTo={search.redirect ?? '/onboarding'} />
  )
}
