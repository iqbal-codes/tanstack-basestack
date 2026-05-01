import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { IntlProvider, useTranslations } from 'use-intl'
import { TooltipProvider } from '#/components/ui/tooltip'
import { getCurrentLocale } from '#/lib/i18n.utils'
import { messages } from '#/messages'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: Outlet,
})

function TitleSetter() {
  const t = useTranslations('app')
  return <title>{t('title')}</title>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const locale = getCurrentLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body
        className="font-sans antialiased wrap-anywhere"
        suppressHydrationWarning
      >
        <IntlProvider locale={locale} messages={messages[locale ?? 'en']}>
          <TitleSetter />
          <TooltipProvider>{children}</TooltipProvider>
        </IntlProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
