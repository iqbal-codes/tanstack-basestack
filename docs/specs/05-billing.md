# 05 — Billing & Subscriptions

> Stripe integration for plans, subscriptions, usage-based billing, and invoices.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  BaseStack   │────▶│ Stripe API   │────▶│ Stripe      │
│  App         │     │ (checkout,   │     │ (payments,  │
│              │◀────│  billing,    │◀────│  invoices,  │
│              │     │  webhooks)   │     │  subs)      │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Database Tables

### `src/db/schema/billing.ts`

```ts
import { pgTable, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { organization } from './core'

// Subscription plans (mirrors Stripe but cached locally for fast reads)
export const plan = pgTable('plan', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),             // 'Basic', 'Pro', 'Enterprise'
  stripePriceId: text('stripe_price_id').notNull(),
  stripeProductId: text('stripe_product_id').notNull(),
  description: text('description'),
  features: jsonb('features').$type<string[]>().default([]),
  priceAmount: text('price_amount'),         // in cents, e.g. "2900"
  priceCurrency: text('price_currency').default('usd'),
  priceInterval: text('price_interval'),     // 'month', 'year'
  isActive: boolean('is_active').default(true),
  sortOrder: text('sort_order').default('0'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
})

// Organization subscription
export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  planId: text('plan_id').references(() => plan.id),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  status: text('status').notNull(),
  // 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'
  trialEndsAt: timestamp('trial_ends_at'),
  currentPeriodStartsAt: timestamp('current_period_starts_at'),
  currentPeriodEndsAt: timestamp('current_period_ends_at'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Webhook event log (idempotency)
export const stripeEvent = pgTable('stripe_event', {
  id: text('id').primaryKey(),              // Stripe event ID (idempotent)
  type: text('type').notNull(),
  data: jsonb('data').notNull(),
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

## Stripe Integration

### `src/features/billing/stripe.ts`

```ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil', // latest stable
  httpClient: Stripe.createFetchHttpClient(),
})

// Create checkout session
export async function createCheckoutSession(params: {
  orgId: string
  planId: string
  customerEmail: string
  successUrl: string
  cancelUrl: string
}) {
  const plan = await db.query.plan.findFirst({
    where: eq(tables.plan.id, params.planId),
  })

  if (!plan) throw new Error('Plan not found')

  // Get or create Stripe customer
  let sub = await db.query.subscription.findFirst({
    where: eq(tables.subscription.orgId, params.orgId),
  })

  let customerId = sub?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: params.customerEmail,
      metadata: { orgId: params.orgId },
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { orgId: params.orgId, planId: params.planId },
  })

  return { url: session.url! }
}

// Create billing portal session
export async function createPortalSession(params: {
  orgId: string
  returnUrl: string
}) {
  const sub = await db.query.subscription.findFirst({
    where: eq(tables.subscription.orgId, params.orgId),
  })

  if (!sub?.stripeCustomerId) throw new Error('No Stripe customer')

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: params.returnUrl,
  })

  return { url: portal.url }
}
```

## Webhook Handler

### `src/routes/api/webhooks/stripe.ts`

```ts
import { createFileRoute } from '@tanstack/react-router'
import { stripe } from '#/features/billing/stripe'
import { db } from '#/db/index'
import { stripeEvent, subscription, plan as planTable } from '#/db/schema/billing'

export const Route = createFileRoute('/api/webhooks/stripe')({
  // Handle POST manually in server function style
})

// Server function (registered via TanStack Start API)
export const stripeWebhook = createServerFn({ method: 'POST' })
  .handler(async () => {
    const request = getRequest()
    const signature = request.headers.get('stripe-signature')!
    const body = await request.text()

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      )
    } catch {
      throw new Error('Invalid signature')
    }

    // Idempotency check
    const existing = await db.query.stripeEvent.findFirst({
      where: eq(stripeEvent.id, event.id),
    })
    if (existing?.processed) return { received: true }

    // Store event
    await db.insert(stripeEvent).values({
      id: event.id,
      type: event.type,
      data: event.data as any,
    })

    // Process event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object
        await handleSubscriptionUpdated(sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await handleSubscriptionDeleted(sub)
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object
        await handleInvoicePaid(invoice)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await handleInvoiceFailed(invoice)
        break
      }
    }

    // Mark as processed
    await db.update(stripeEvent)
      .set({ processed: true, processedAt: new Date() })
      .where(eq(stripeEvent.id, event.id))

    return { received: true }
  })
```

## Plan Definitions (Static Seed)

```ts
// src/features/billing/plans.ts
export const defaultPlans = [
  {
    id: 'plan_basic',
    name: 'Basic',
    stripePriceId: process.env.STRIPE_PRICE_BASIC!,
    stripeProductId: 'prod_basic',
    description: 'For small teams getting started',
    features: [
      'Up to 5 users',
      '1,000 orders/month',
      'Email support',
      'Basic reporting',
    ],
    priceAmount: '2900',
    priceInterval: 'month',
    sortOrder: '1',
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    stripePriceId: process.env.STRIPE_PRICE_PRO!,
    stripeProductId: 'prod_pro',
    description: 'For growing businesses',
    features: [
      'Up to 25 users',
      '10,000 orders/month',
      'Priority support',
      'Advanced reporting',
      'API access',
      'Custom integrations',
    ],
    priceAmount: '9900',
    priceInterval: 'month',
    sortOrder: '2',
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE!,
    stripeProductId: 'prod_enterprise',
    description: 'For large organizations',
    features: [
      'Unlimited users',
      'Unlimited orders',
      'Dedicated support',
      'Custom reporting',
      'API access',
      'SSO / SAML',
      'Audit logs',
      'SLA guarantee',
    ],
    priceAmount: '29900',
    priceInterval: 'month',
    sortOrder: '3',
  },
]
```

## Plan Gating

### Route guard

```ts
// src/routes/app/$orgSlug.tsx beforeLoad
beforeLoad: async () => {
  const org = await getActiveOrganization()
  const sub = await getSubscription(org.id)

  // Free tier: redirect to billing page if no active subscription
  if (!sub || sub.status === 'canceled') {
    throw redirect({ to: `/app/${org.slug}/billing` })
  }

  // Past due: show banner but allow access
  if (sub.status === 'past_due') {
    return { org, subscription: sub, banner: 'past_due' }
  }

  return { org, subscription: sub }
}
```

### Feature gating

```ts
// src/features/billing/feature-gate.ts
export async function checkFeatureAccess(
  orgId: string,
  feature: string,
): Promise<boolean> {
  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.orgId, orgId),
    with: { plan: true },
  })

  if (!sub || !sub.plan) return false
  return sub.plan.features.includes(feature)
}
```

## Billing Routes

```
src/routes/app/$orgSlug/
├── billing.tsx         # Billing page (current plan, usage, invoices)
├── billing/
│   ├── plans.tsx       # Plan selection / upgrade
│   └── invoices.tsx    # Invoice history
```

## Checklist

- [ ] Create `src/db/schema/billing.ts` with plan, subscription, stripeEvent tables
- [ ] Create `src/features/billing/stripe.ts` with Stripe client + checkout + webhook handler
- [ ] Create `src/features/billing/plans.ts` with default plan definitions
- [ ] Create `src/features/billing/feature-gate.ts` for plan gating
- [ ] Set up Stripe webhook endpoint (`/api/webhooks/stripe`)
- [ ] Create Stripe products and prices in Stripe dashboard
- [ ] Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` env vars
- [ ] Seed plan table with default plans
- [ ] Add billing page to sidebar nav
- [ ] Run `db:generate` and `db:migrate`
- [ ] Test webhook with Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
