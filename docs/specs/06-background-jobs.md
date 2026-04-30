# 06 — Background Jobs & Queue

> bullmq (Redis-backed) for email sending, PDF generation, webhook dispatch, and scheduled tasks.

## Architecture

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐
│  BaseStack   │────▶│  Redis   │────▶│  bullmq     │
│  App Server  │     │  Queue   │     │  Workers     │
│  (producer)  │     │          │     │  (consumer)  │
└─────────────┘     └──────────┘     └─────────────┘
       │                                    │
       │                                    ▼
       │                            ┌─────────────┐
       └────────────────────────────│  Resend     │
                                    │  S3/R2      │
                                    │  Webhooks   │
                                    └─────────────┘
```

## Queue Setup

### `src/lib/queue.ts`

```ts
import { Queue, Worker, QueueScheduler } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'

const connection: ConnectionOptions = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
}

// Queue names
export const Queues = {
  EMAIL: 'email',
  PDF: 'pdf-generation',
  WEBHOOK: 'webhook-dispatch',
  EXPORT: 'data-export',
  CLEANUP: 'cleanup',
} as const

// Producers (used in app server)
export const emailQueue = new Queue(Queues.EMAIL, { connection })
export const pdfQueue = new Queue(Queues.PDF, { connection })
export const webhookQueue = new Queue(Queues.WEBHOOK, { connection })
export const exportQueue = new Queue(Queues.EXPORT, { connection })
export const cleanupQueue = new Queue(Queues.CLEANUP, { connection })
```

### Job Type Definitions

```ts
// src/features/jobs/types.ts

// Email job
export type EmailJob = {
  to: string | string[]
  subject: string
  template: string
  data: Record<string, unknown>
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

// PDF generation job
export type PdfJob = {
  template: string
  data: Record<string, unknown>
  filename: string
  storeInBucket?: boolean
  metadata?: Record<string, unknown>
}

// Webhook dispatch job
export type WebhookJob = {
  url: string
  event: string
  payload: Record<string, unknown>
  secret: string
  retries?: number
  orgId: string
}

// Data export job
export type ExportJob = {
  type: 'csv' | 'excel'
  query: string        // resource type: 'orders', 'customers', etc.
  filters: Record<string, unknown>
  columns: string[]
  orgId: string
  userId: string
}

// Cleanup job
export type CleanupJob = {
  type: 'expired_trials' | 'old_sessions' | 'stale_invitations'
  olderThanDays: number
}
```

## Workers

### `src/workers/email.worker.ts`

```ts
import { Worker } from 'bullmq'
import { connection, Queues } from '#/lib/queue'
import type { EmailJob } from '#/features/jobs/types'
import { Resend } from 'resend'
import { render } from '@react-email/components'

const resend = new Resend(process.env.RESEND_API_KEY!)

const worker = new Worker<EmailJob>(
  Queues.EMAIL,
  async (job) => {
    const { to, subject, template, data, attachments } = job.data

    // Dynamically import React Email template
    const EmailTemplate = (await import(`#/emails/${template}`)).default
    const html = await render(EmailTemplate(data))

    await resend.emails.send({
      from: `${process.env.APP_NAME} <noreply@${new URL(process.env.APP_URL!).hostname}>`,
      to,
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === 'string'
          ? Buffer.from(a.content, 'utf-8')
          : a.content,
      })),
    })
  },
  { connection, concurrency: 5 },
)

// Graceful shutdown
process.on('SIGTERM', () => worker.close())
```

### `src/workers/pdf.worker.ts`

```ts
import { Worker } from 'bullmq'
import { connection, Queues } from '#/lib/queue'
import type { PdfJob } from '#/features/jobs/types'
import { putObject } from '#/lib/storage'
// import puppeteer from 'puppeteer'  // or use @react-pdf/renderer

const worker = new Worker<PdfJob>(
  Queues.PDF,
  async (job) => {
    const { template, data, filename, storeInBucket } = job.data

    // Generate PDF using puppeteer or @react-pdf/renderer
    const pdfBuffer = await generatePdf(template, data)

    if (storeInBucket) {
      await putObject(`pdfs/${filename}`, pdfBuffer, 'application/pdf')
    }

    return { filename, size: pdfBuffer.length }
  },
  { connection, concurrency: 3 },
)

process.on('SIGTERM', () => worker.close())
```

### `src/workers/webhook.worker.ts`

```ts
import { Worker } from 'bullmq'
import { connection, Queues } from '#/lib/queue'
import type { WebhookJob } from '#/features/jobs/types'
import { createHmac } from 'crypto'

const worker = new Worker<WebhookJob>(
  Queues.WEBHOOK,
  async (job) => {
    const { url, event, payload, secret, retries = 3 } = job.data

    const body = JSON.stringify({ event, payload, timestamp: Date.now() })
    const signature = createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
      },
      body,
    })

    if (!response.ok && job.attemptsMade < retries) {
      throw new Error(`Webhook failed: ${response.status}`)
    }

    return { status: response.status }
  },
  {
    connection,
    concurrency: 10,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
)

process.on('SIGTERM', () => worker.close())
```

## Usage in App Code

### Enqueue email

```ts
import { emailQueue } from '#/lib/queue'

await emailQueue.add('welcome-email', {
  to: 'user@example.com',
  subject: 'Welcome to BaseStack',
  template: 'welcome',
  data: { name: 'John', orgName: 'Acme Corp' },
})
```

### Enqueue PDF (e.g., invoice generation)

```ts
import { pdfQueue } from '#/lib/queue'

await pdfQueue.add('generate-invoice', {
  template: 'invoice',
  data: { invoiceId: 'inv_123', orgId: 'org_456' },
  filename: 'inv_123.pdf',
  storeInBucket: true,
})
```

### Enqueue webhook

```ts
import { webhookQueue } from '#/lib/queue'

await webhookQueue.add('order-created', {
  url: 'https://partner.example.com/webhooks',
  event: 'order.created',
  payload: { orderId: 'ord_123', status: 'confirmed' },
  secret: 'whsec_...',
  orgId: 'org_456',
})
```

### Enqueue export

```ts
import { exportQueue } from '#/lib/queue'

await exportQueue.add('export-orders', {
  type: 'csv',
  query: 'orders',
  filters: { status: 'delivered', dateRange: 'last-30-days' },
  columns: ['orderNumber', 'customerName', 'total', 'status', 'createdAt'],
  orgId: 'org_456',
  userId: 'user_789',
})
```

## Scheduled Jobs (Cron)

### `src/workers/scheduler.ts`

```ts
import { QueueScheduler } from 'bullmq'
import { emailQueue, cleanupQueue } from '#/lib/queue'

// Schedule daily cleanup
export async function scheduleCleanup() {
  await cleanupQueue.add(
    'expired-trials',
    { type: 'expired_trials', olderThanDays: 14 },
    { repeat: { pattern: '0 2 * * *' } }, // 2 AM daily
  )

  await cleanupQueue.add(
    'old-sessions',
    { type: 'old_sessions', olderThanDays: 30 },
    { repeat: { pattern: '0 3 * * *' } },
  )
}

// Schedule subscription renewal reminders
export async function scheduleRenewalReminders() {
  // Check subscriptions ending within 3 days
  // Enqueue reminder emails
}
```

## Docker Compose Addition

```yaml
# docker-compose.yml (partial)
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  worker:
    build: .
    command: bun run src/workers/index.ts
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379
      # ... other env vars

volumes:
  redis_data:
```

## Checklist

- [ ] Install `bullmq` and `ioredis`: `bun add bullmq ioredis`
- [ ] Install `resend` and `@react-email/components`: `bun add resend @react-email/components`
- [ ] Create `src/lib/queue.ts` with queue producers
- [ ] Create `src/features/jobs/types.ts` with job type definitions
- [ ] Create `src/workers/email.worker.ts`
- [ ] Create `src/workers/pdf.worker.ts`
- [ ] Create `src/workers/webhook.worker.ts`
- [ ] Create `src/workers/scheduler.ts` with cron jobs
- [ ] Create `src/workers/index.ts` that starts all workers
- [ ] Add Redis to Docker Compose
- [ ] Add worker service to Docker Compose
- [ ] Add `bun run worker` script to package.json
- [ ] Create `src/emails/` directory with React Email templates
- [ ] Test queue locally with `bun run dev` + `bun run worker`
- [ ] Set up Redis in production (Upstash, Railway, etc.)
