# 14 — Security

> CSP headers, CORS, CSRF, input sanitization, 2FA, secrets management.

## Content Security Policy

### `src/lib/security/csp.ts`

```ts
export function getCspHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV !== 'production'

  const csp = [
    "default-src 'self'",
    `script-src 'self'${isDev ? " 'unsafe-inline' 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`, // Tailwind needs inline styles
    "img-src 'self' data: blob: https:",
    `connect-src 'self'${isDev ? ' ws:' : ''} https://*.sentry.io https://api.stripe.com`,
    "font-src 'self'",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors 'none'`,
  ].join('; ')

  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

// Apply in __root.tsx or router middleware
```

### `src/routes/__root.tsx` (extended)

```ts
head: () => ({
  meta: [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { 'http-equiv': 'Content-Security-Policy', content: getCspPolicyString() },
  ],
  // ...
})
```

## CORS Configuration

### `src/lib/security/cors.ts`

```ts
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || process.env.APP_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin')

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    }
  }

  return {}
}

// Apply in API route handlers
export function handleCorsPreflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    })
  }
  return null
}
```

## CSRF Protection

Better Auth handles CSRF for auth routes. For API routes and form submissions:

```ts
// src/lib/security/csrf.ts
import { createHmac, randomBytes } from 'crypto'

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'x-csrf-token'

export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex')
  const hmac = createHmac('sha256', process.env.BETTER_AUTH_SECRET!)
    .update(token)
    .digest('hex')
  return `${token}.${hmac}`
}

export function validateCsrfToken(cookieToken: string, headerToken: string): boolean {
  const [token, hmac] = cookieToken.split('.')
  const expectedHmac = createHmac('sha256', process.env.BETTER_AUTH_SECRET!)
    .update(token)
    .digest('hex')

  return hmac === expectedHmac && token === headerToken
}

// Middleware: validate for state-changing requests (POST, PUT, PATCH, DELETE)
export function csrfMiddleware(request: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return

  const cookieToken = parseCookies(request.headers.get('cookie') || '')[CSRF_COOKIE]
  const headerToken = request.headers.get(CSRF_HEADER)

  if (!cookieToken || !headerToken || !validateCsrfToken(cookieToken, headerToken)) {
    throw new Error('CSRF validation failed')
  }
}
```

## Input Sanitization

```ts
// src/lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

// Strip HTML entirely for plain text fields
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}
```

## Two-Factor Authentication (2FA)

Better Auth `twoFactor` plugin is already specified in spec `02-auth.md`. Key additions:

```ts
// Enable in auth.ts
twoFactor({
  issuer: 'BaseStack',
  // OTP-based TOTP
  otpOptions: {
    sendOTP: async ({ user, otp }) => {
      await emailQueue.add('2fa-otp', {
        to: user.email,
        subject: 'Your BaseStack verification code',
        template: 'otp',
        data: { otp, name: user.name },
      })
    },
  },
})
```

## API Key Management

### `src/db/schema/api-keys.ts`

```ts
export const apiKey = pgTable('api_key', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),      // Only stored hashed
  keyPrefix: text('key_prefix').notNull(),   // First 8 chars for display
  scopes: jsonb('scopes').$type<string[]>().default([]),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

Key creation:
```ts
// Hash the API key before storing
import { createHash, randomBytes } from 'crypto'

export async function createApiKey(orgId: string, userId: string, name: string) {
  const rawKey = `bsk_${randomBytes(24).toString('hex')}` // "bsk_" prefix
  const hashedKey = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 12) // "bsk_a1b2c3d4"

  await db.insert(apiKey).values({
    id: uuid(),
    orgId,
    userId,
    name,
    key: hashedKey,
    keyPrefix,
    scopes: ['read', 'write'],
  })

  return { id, key: rawKey } // Return raw key ONCE — shown to user
}
```

## Rate Limiting (Expanded)

```ts
// Rate limit by IP, user, or org
rateLimitByIp: 100 req/min
rateLimitByUser: 500 req/min
rateLimitByOrg: 2000 req/min

// Strict limits for auth endpoints
rateLimitAuth: 5 req/min per IP

// API key limits
rateLimitApiKey: 1000 req/min per key
```

## Secrets Management

For production, use a secrets manager instead of env vars:

```ts
// src/lib/secrets.ts
// Production: use AWS Secrets Manager, GCP Secret Manager, or Doppler
// Development: use .env.local

export async function getSecret(name: string): Promise<string> {
  if (process.env.SECRETS_PROVIDER === 'aws') {
    const { SecretsManager } = await import('@aws-sdk/client-secrets-manager')
    const client = new SecretsManager({ region: process.env.AWS_REGION })
    const response = await client.getSecretValue({ SecretId: name })
    return response.SecretString!
  }

  return process.env[name]!
}
```

## Security Checklist

- [ ] Implement CSP headers in `__root.tsx`
- [ ] Add CORS middleware for API routes
- [ ] Add CSRF protection for form submissions
- [ ] Install and configure DOMPurify: `bun add isomorphic-dompurify`
- [ ] Create `src/lib/security/sanitize.ts`
- [ ] Create `src/lib/security/csrf.ts`
- [ ] Create `src/db/schema/api-keys.ts`
- [ ] Enable 2FA via Better Auth `twoFactor` plugin
- [ ] Hash API keys before storing
- [ ] Add rate limiting to all API routes
- [ ] Add `src/lib/secrets.ts` for prod secrets management
- [ ] Run security audit: `bunx npm audit` (or equivalent)
- [ ] Add security headers: HSTS, X-Content-Type-Options, etc.
- [ ] Configure cookie security (HttpOnly, Secure, SameSite)
- [ ] Add Snyk or Dependabot for vulnerability scanning
