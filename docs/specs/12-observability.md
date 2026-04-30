# 12 — Observability

> Structured logging (Pino), distributed tracing (OpenTelemetry), error monitoring (Sentry), and performance metrics.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Pino        │────▶│  stdout/    │────▶│  Log drain    │
│  (JSON logs) │     │  file/OTLP  │     │  (Better Stack│
│              │     │             │     │   Datadog,    │
│              │     │             │     │   Grafana)    │
└─────────────┘     └─────────────┘     └──────────────┘

┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  OpenTele-  │────▶│  OTLP       │────▶│  OTel Collector│
│  metry SDK  │     │  Exporter   │     │  → Jaeger/   │
│             │     │             │     │    Grafana    │
└─────────────┘     └─────────────┘     └──────────────┘

┌─────────────┐     ┌─────────────┐
│  Sentry     │────▶│  Sentry.io  │
│  (errors)   │     │  Dashboard  │
└─────────────┘     └─────────────┘
```

## Structured Logging (Pino)

### `src/lib/logger.ts`

```ts
import pino from 'pino'
import { getCurrentSession } from '#/lib/auth-session'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      '*.password',
      '*.accessToken',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
})

// Child logger with request context
export async function createRequestLogger() {
  const session = await getCurrentSession().catch(() => null)

  return logger.child({
    userId: session?.user.id,
    userEmail: session?.user.email,
    sessionId: session?.session.id,
  })
}
```

### Usage

```ts
import { logger, createRequestLogger } from '#/lib/logger'

// Simple log
logger.info({ event: 'server_started', port: 3000 })

// Request-scoped log
const log = await createRequestLogger()
log.info({ event: 'order_created', orderId: 'ord_123', amount: 99.99 })
log.error({ event: 'payment_failed', orderId: 'ord_123', error: new Error('Card declined') })
log.warn({ event: 'rate_limit_approaching', remaining: 5 })
```

## OpenTelemetry Tracing

### `src/lib/tracing.ts`

```ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'basestack',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.SENTRY_ENVIRONMENT ?? 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: {},
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
    }),
    new PinoInstrumentation(),
  ],
})

// Start the SDK
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  sdk.start()
}

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
})
```

### Custom Span Helper

```ts
import { trace, SpanStatusCode } from '@opentelemetry/api'

const tracer = trace.getTracer('basestack')

export async function withSpan<T>(
  name: string,
  fn: (span: import('@opentelemetry/api').Span) => Promise<T>,
  attributes?: Record<string, string>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) span.setAttributes(attributes)
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  })
}

// Usage in server function
export const getOrders = createServerFn({ method: 'GET' })
  .handler(async () => {
    return withSpan('getOrders', async (span) => {
      span.setAttribute('org.id', getCurrentOrgId())
      const orders = await db.select().from(order)
      span.setAttribute('result.count', orders.length)
      return orders
    })
  })
```

## Sentry (Existing, Extended)

The project already has Sentry set up via `instrument.server.mjs`. Extend it:

### `src/lib/sentry.ts`

```ts
import * as Sentry from '@sentry/tanstackstart-react'

// Capture custom events
export function captureBusinessEvent(
  event: string,
  data: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info',
) {
  Sentry.captureMessage(event, {
    level,
    tags: {
      event_type: event,
      org_id: data.orgId as string,
    },
    extra: data,
  })
}

// Set user context
export function setSentryUser(session: { user: { id: string; email: string }; session: { id: string } }) {
  Sentry.setUser({
    id: session.user.id,
    email: session.user.email,
  })
}

// Set org context
export function setSentryOrg(org: { id: string; name: string }) {
  Sentry.setTag('org_id', org.id)
  Sentry.setContext('organization', { id: org.id, name: org.name })
}
```

## Health Check Endpoint

### `src/routes/api/health.ts`

```ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'

export const healthCheck = createServerFn({ method: 'GET' })
  .handler(async () => {
    const checks: Record<string, 'ok' | 'error'> = {}

    // Database
    try {
      await db.execute('SELECT 1')
      checks.database = 'ok'
    } catch {
      checks.database = 'error'
    }

    // Redis (check if configured)
    if (process.env.REDIS_URL) {
      try {
        const Redis = (await import('ioredis')).default
        const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true })
        await redis.connect()
        await redis.ping()
        await redis.quit()
        checks.redis = 'ok'
      } catch {
        checks.redis = 'error'
      }
    }

    const allOk = Object.values(checks).every((v) => v === 'ok')

    return {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
      checks,
    }
  })
```

## Checklist

- [ ] Install Pino: `bun add pino`
- [ ] Create `src/lib/logger.ts` with Pino setup + request context
- [ ] Replace all `console.log` with `logger.info/warn/error`
- [ ] Install OpenTelemetry packages: `bun add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/instrumentation-pino`
- [ ] Create `src/lib/tracing.ts` with OpenTelemetry setup
- [ ] Create `src/lib/sentry.ts` with custom events + context helpers
- [ ] Create health check endpoint at `/api/health`
- [ ] Add request logging middleware to routes
- [ ] Set up log drain (Better Stack, Datadog, Grafana Cloud, etc.)
- [ ] Set up OTLP collector for traces (if self-hosted) or use vendor
- [ ] Configure log levels per environment (debug in dev, info in prod)
- [ ] Add slow query logging (queries > 500ms)
- [ ] Add Sentry transactions for server functions
