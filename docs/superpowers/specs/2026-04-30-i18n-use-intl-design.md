# i18n with use-intl + TanStack Router Rewrite

## Summary

Add internationalization to this TanStack Start app using `use-intl` library and TanStack Router's built-in `rewrite` system. Default locale is English (no prefix). Indonesian gets `/id/` prefix in URLs. Admin routes bypass locale prefixes and read from cookie.

## Requirements

- English (default, no URL prefix) + Indonesian (prefix: `/id/...`)
- Routes: `/about` → English, `/id/about` → Indonesian
- Admin area (`/admin*`) has no locale prefix — locale from cookie
- Type-safe translation messages
- SSR-compatible, no hydration mismatches
- Locale persisted in cookie when user switches

## Architecture

```
src/
├── messages/
│   ├── en.ts              English translations (~48 strings)
│   ├── id.ts              Indonesian translations
│   └── index.ts           Registry + Messages type
├── lib/
│   ├── i18n.ts            Shared config (locales, cookie, ignored paths)
│   ├── i18n.server.ts     Server middleware (redirect /en/*, cookie sync)
│   └── i18n.client.ts     createIsomorphicFn locale detection + rewrite fns
├── router.tsx             Add rewrite.input / rewrite.output
├── routes/
│   ├── __root.tsx         Wrap IntlProvider, dynamic <html lang>
│   ├── _locale.tsx        NEW layout route /{-$locale} for locale validation
│   ├── index.tsx          useTranslations
│   ├── sign-in.tsx        useTranslations
│   ├── sign-up.tsx        useTranslations
│   └── admin.tsx          useTranslations (no locale prefix in URL)
├── features/
│   ├── auth/AuthForm.tsx  useTranslations
│   └── admin/model.ts     translate seed strings
└── components/
    ├── not-found.tsx      useTranslations
    ├── app-sidebar.tsx    useTranslations
    └── nav-user.tsx       useTranslations
```

## Message Files

Namespaced flat objects per locale:

```ts
// src/messages/en.ts
export const en = {
  auth: {
    signIn: "Sign in",
    signUp: "Create an account",
    email: "Email",
    password: "Password",
    name: "Name",
    signInTitle: "Sign in",
    signUpTitle: "Create an account",
    signInDesc: "Enter your email and password to continue to admin.",
    signUpDesc: "Use email and password to create the first admin session.",
    alreadyHaveAccount: "Already have an account?",
    needAccount: "Need an account?",
    createOne: "Create one",
    nameMin: "Name must be at least 2 characters",
    emailValid: "Enter a valid email address",
    passwordMin: "Password must be at least 8 characters",
    passwordDesc: "Minimum 8 characters.",
    authFailed: "Authentication failed",
  },
  admin: {
    console: "Admin Console",
    protected: "Protected by Better Auth",
    overview: "Overview",
    users: "Users",
    system: "System",
    logOut: "Log out",
    banner: "Banner label",
    internalNote: "Internal note",
    save: "Save",
    labelMin: "Label must be at least 3 characters",
    comfortable: "Comfortable",
    compact: "Compact",
    owner: "Owner",
    adminUsers: "Admin users",
    adminUsersDesc: "Static seed data fetched through TanStack Query.",
    localActions: "Local actions",
    localActionsDesc: "TanStack DB local-only collection.",
    overviewTitle: "Admin shell ready",
    overviewDesc: "Query, Store, and DB are wired into this protected page.",
    systemTitle: "System",
    systemDesc: "TanStack Form updates the admin banner in TanStack Store.",
    name: "Name",
    role: "Role",
    status: "Status",
  },
  common: {
    loading: "Loading",
    pageNotFound: "Page not found",
    pageNotFoundDesc: "The page you're looking for doesn't exist or may have been moved.",
    goHome: "Go home",
    workspaces: "Workspaces",
  },
  sidebar: {
    adminConsole: "Admin Console",
    protected: "Protected",
    overview: "Overview",
    users: "Users",
    system: "System",
    admin: "Admin",
  },
} as const
```

```ts
// src/messages/id.ts
import type { Messages } from './en'

export const id: Messages = {
  auth: {
    signIn: "Masuk",
    signUp: "Buat akun",
    email: "Email",
    password: "Kata sandi",
    name: "Nama",
    signInTitle: "Masuk",
    signUpTitle: "Buat akun",
    signInDesc: "Masukkan email dan kata sandi untuk melanjutkan ke admin.",
    signUpDesc: "Gunakan email dan kata sandi untuk membuat sesi admin pertama.",
    alreadyHaveAccount: "Sudah punya akun?",
    needAccount: "Butuh akun?",
    createOne: "Buat satu",
    nameMin: "Nama harus minimal 2 karakter",
    emailValid: "Masukkan alamat email yang valid",
    passwordMin: "Kata sandi harus minimal 8 karakter",
    passwordDesc: "Minimal 8 karakter.",
    authFailed: "Autentikasi gagal",
  },
  admin: { /* ... Indonesian translations ... */ },
  common: { /* ... */ },
  sidebar: { /* ... */ },
}
```

## Router Rewrite

```ts
// src/router.tsx
import { deLocalizeUrl, localizeUrl } from '#/lib/i18n.client'

const router = createTanStackRouter({
  routeTree,
  context,
  rewrite: {
    input: ({ url }) => deLocalizeUrl(url),
    output: ({ url }) => localizeUrl(url),
  },
  // existing config...
})
```

- `deLocalizeUrl` — strips `/id/` before router resolves the route
- `localizeUrl` — adds `/id/` when `<Link>` generates URLs and locale is `id`
- Both skip ignored paths (`/admin*`, `/api*`, `/rpc*`)

## Layout Route

```ts
// src/routes/_locale.tsx
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params }) => {
    if (params.locale && !['en', 'id'].includes(params.locale)) {
      throw notFound()
    }
  },
  component: () => <Outlet />,
})
```

The `-` prefix makes `{$locale}` optional. Matches both `/about` and `/id/about`.

## Server Middleware

```ts
// src/lib/i18n.server.ts
export function handleLocale(request: Request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Redirect /en/* → /* (default locale must not have prefix)
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    url.pathname = pathname.replace('/en', '') || '/'
    return { redirect: Response.redirect(url.toString(), 301) }
  }

  // Strip locale from ignored paths: /id/admin → /admin
  const locale = extractLocale(pathname)
  if (locale && isIgnoredPath(stripped(pathname, locale))) {
    url.pathname = stripped(pathname, locale)
    return { redirect: Response.redirect(url.toString(), 301) }
  }

  // Sync cookie when URL has explicit locale
  if (locale) {
    return { setCookie: `locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax` }
  }

  return {}
}
```

Integrated into the TanStack Start server entry point.

## Provider

```ts
// src/routes/__root.tsx
import { IntlProvider } from 'use-intl'
import { messages } from '#/messages'
import { getCurrentLocale } from '#/lib/i18n.client'

function RootDocument({ children }) {
  const locale = getCurrentLocale()
  return (
    <html lang={locale}>
      <body>
        <IntlProvider locale={locale} messages={messages[locale]}>
          {children}
        </IntlProvider>
      </body>
    </html>
  )
}
```

## Component Usage Pattern

```tsx
import { useTranslations } from 'use-intl'

function SignInRoute() {
  const t = useTranslations('auth')
  return <CardTitle>{t('signInTitle')}</CardTitle>
}
```

## Files Changed

| File | Change |
|---|---|
| `src/messages/en.ts` | NEW |
| `src/messages/id.ts` | NEW |
| `src/messages/index.ts` | NEW |
| `src/lib/i18n.ts` | NEW |
| `src/lib/i18n.server.ts` | NEW |
| `src/lib/i18n.client.ts` | NEW |
| `src/router.tsx` | EDIT: add rewrite |
| `src/routes/_locale.tsx` | NEW |
| `src/routes/__root.tsx` | EDIT: IntlProvider, html lang |
| `src/routes/sign-in.tsx` | EDIT: use translations |
| `src/routes/sign-up.tsx` | EDIT: use translations |
| `src/routes/index.tsx` | EDIT: use translations |
| `src/routes/admin.tsx` | EDIT: use translations |
| `src/routes/admin/index.tsx` | EDIT: use translations |
| `src/routes/admin/users.tsx` | EDIT: use translations |
| `src/routes/admin/system.tsx` | EDIT: use translations |
| `src/features/auth/AuthForm.tsx` | EDIT: use translations |
| `src/features/admin/model.ts` | EDIT: translate seed strings |
| `src/components/not-found.tsx` | EDIT: use translations |
| `src/components/app-sidebar.tsx` | EDIT: use translations |
| `src/components/nav-user.tsx` | EDIT: use translations |
| `package.json` | EDIT: add `use-intl` dependency |

## Out of Scope (First Pass)

- shadcn UI library a11y strings (`"Loading"`, `"Toggle Sidebar"`, pagination labels)
- Breadcrumb component strings
- Better Auth default email templates (not in app code)
