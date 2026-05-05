export function extractSubdomain(host: string): string | null {
  if (!host) return null

  const hostname = host.replace(/:\d+$/, '')

  const parts = hostname.split('.')

  if (hostname === 'localhost' || hostname === 'pabriq.com') return null

  if (parts.length >= 3 && hostname.endsWith('.localhost')) {
    return parts.slice(0, parts.length - 2).join('.')
  }

  if (parts.length === 3) {
    return parts[0]
  }

  return null
}
