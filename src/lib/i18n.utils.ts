import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import {
  defaultLocale,
  extractLocaleFromPath,
  isIgnoredPath,
  parseLocaleCookie,
  stripLocale,
} from './i18n'

export function deLocalizeUrl(url: URL): URL {
  if (isIgnoredPath(url.pathname)) return url
  const newUrl = new URL(url)
  newUrl.pathname = stripLocale(url.pathname)
  return newUrl
}

export function localizeUrl(url: URL, currentLocale: string): URL {
  if (isIgnoredPath(url.pathname)) return url
  if (currentLocale === defaultLocale) return url
  const newUrl = new URL(url)
  newUrl.pathname = `/${currentLocale}${url.pathname === '/' ? '' : url.pathname}`
  return newUrl
}

export const getCurrentLocale = createIsomorphicFn()
  .server(() => {
    const request = getRequest()
    const url = new URL(request.url)
    if (isIgnoredPath(url.pathname)) {
      return parseLocaleCookie(request.headers.get('cookie')) ?? defaultLocale
    }
    return extractLocaleFromPath(url.pathname) ?? defaultLocale
  })
  .client(() => {
    const path = window.location.pathname
    if (isIgnoredPath(path)) {
      return parseLocaleCookie(document.cookie) ?? defaultLocale
    }
    return extractLocaleFromPath(path) ?? defaultLocale
  })
