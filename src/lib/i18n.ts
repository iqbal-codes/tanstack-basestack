import { defaultLocale, type Locale, supportedLocales } from '#/messages'

export type { Locale }
export { defaultLocale, supportedLocales }

export const LOCALE_COOKIE = 'locale'

export function isIgnoredPath(pathname: string): boolean {
  return /^\/admin(?:\/|$)/.test(pathname) || /^\/api(?:\/|$)/.test(pathname)
}

export function extractLocaleFromPath(pathname: string): Locale | null {
  const match = /^\/([a-z]{2})(?:\/|$)/.exec(pathname)
  const locale = match?.[1]
  if (!locale) return null
  if (locale === defaultLocale) return null
  return supportedLocales.includes(locale as Locale) ? (locale as Locale) : null
}

export function stripLocale(pathname: string): string {
  const locale = extractLocaleFromPath(pathname)
  if (!locale) return pathname
  return pathname.replace(`/${locale}`, '') || '/'
}

export function parseLocaleCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`))
  return match?.[1] ?? null
}
