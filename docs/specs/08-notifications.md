# 08 — Notifications

> In-app notification center, transactional emails (react.email + Resend), and optional push/SMS.

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  Notification Hub                │
│                                                  │
│  createNotification() ──▶ DB (in-app)            │
│                        ──▶ emailQueue (email)    │
│                        ──▶ push (optional)       │
│                        ──▶ SMS (optional)        │
└──────────────────────────────────────────────────┘
```

## Database Table

### `src/db/schema/notifications.ts`

```ts
import { pgTable, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { organization } from './core'

export const notification = pgTable('notification', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  userId: text('user_id').notNull(),        // Target user
  type: text('type').notNull(),
  // 'order_created', 'order_status_changed', 'shipment_delivered',
  // 'invoice_paid', 'payment_failed', 'member_invited',
  // 'trial_expiring', 'export_ready', 'mention', 'system'
  title: text('title').notNull(),
  body: text('body'),
  link: text('link'),                        // Deep link in app
  isRead: boolean('is_read').default(false),
  isArchived: boolean('is_archived').default(false),
  readAt: timestamp('read_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Notification preferences (per user per org)
export const notificationPreference = pgTable('notification_preference', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),             // notification type
  channel: text('channel').notNull(),       // 'in_app', 'email', 'push'
  enabled: boolean('enabled').default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

## Notification Service

### `src/features/notifications/service.ts`

```ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { notification } from '#/db/schema/notifications'
import { emailQueue } from '#/lib/queue'
import { v4 as uuid } from 'uuid'

type CreateNotificationInput = {
  orgId: string
  userIds: string[]
  type: string
  title: string
  body?: string
  link?: string
  metadata?: Record<string, unknown>
  sendEmail?: boolean
  emailTemplate?: string
  emailData?: Record<string, unknown>
}

export async function createNotification(input: CreateNotificationInput) {
  const notificationId = uuid()

  // Insert in-app notifications
  const values = input.userIds.map((userId) => ({
    id: uuid(),
    orgId: input.orgId,
    userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    metadata: input.metadata ?? {},
  }))

  await db.insert(notification).values(values)

  // Optionally send emails
  if (input.sendEmail && input.emailTemplate) {
    await emailQueue.addBulk(
      input.userIds.map((userId) => ({
        name: `email-${notificationId}-${userId}`,
        data: {
          to: userId, // resolve email from user table
          subject: input.title,
          template: input.emailTemplate,
          data: {
            ...input.emailData,
            notificationId,
            title: input.title,
            body: input.body,
            link: input.link,
          },
        },
      })),
    )
  }

  return { notificationId }
}

// Mark as read
export const markNotificationRead = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: { notificationId: string } }) => {
    await db.update(notification)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notification.id, data.notificationId))
  })

// Mark all as read
export const markAllNotificationsRead = createServerFn({ method: 'POST' })
  .handler(async () => {
    const session = await getCurrentSession()
    await db.update(notification)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notification.userId, session.user.id),
          eq(notification.isRead, false),
        ),
      )
  })

// Get notifications
export const getNotifications = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await getCurrentSession()
    return db.query.notification.findMany({
      where: and(
        eq(notification.userId, session.user.id),
        eq(notification.isArchived, false),
      ),
      orderBy: desc(notification.createdAt),
      limit: 50,
    })
  })

// Get unread count
export const getUnreadCount = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await getCurrentSession()
    const result = await db
      .select({ count: count() })
      .from(notification)
      .where(
        and(
          eq(notification.userId, session.user.id),
          eq(notification.isRead, false),
          eq(notification.isArchived, false),
        ),
      )
    return result[0]?.count ?? 0
  })
```

## Notification Center UI

### `src/components/notification-center.tsx`

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ScrollArea } from '#/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import { Separator } from '#/components/ui/separator'
import { Badge } from '#/components/ui/badge'
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from '#/features/notifications/service'
import { formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'

export function NotificationCenter() {
  const queryClient = useQueryClient()

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getUnreadCount(),
    refetchInterval: 30000, // Poll every 30 seconds
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  })

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOneMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead({ data: { notificationId: id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount ? (
            <Badge className="absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-medium">Notifications</h4>
          <Button variant="ghost" size="sm" onClick={() => markAllMutation.mutate()}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        </div>
        <Separator className="my-2" />
        <ScrollArea className="h-80">
          {notifications?.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            notifications?.map((n) => (
              <Link
                key={n.id}
                to={n.link ?? '#'}
                className={`flex flex-col gap-1 rounded-md p-3 text-sm transition-colors hover:bg-muted ${
                  !n.isRead ? 'bg-muted/50' : ''
                }`}
                onClick={() => markOneMutation.mutate(n.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {n.body && (
                  <p className="text-muted-foreground">{n.body}</p>
                )}
              </Link>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
```

## Email Templates

### `src/emails/` directory

```
src/emails/
├── layout.tsx              # Shared email layout (branding, footer)
├── welcome.tsx             # Welcome email
├── org-invitation.tsx      # Organization invitation
├── verify-email.tsx        # Email verification
├── reset-password.tsx      # Password reset
├── invoice-ready.tsx       # Invoice available
├── export-ready.tsx        # Data export ready
└── order-status.tsx        # Order status change
```

### Example email template

```tsx
// src/emails/welcome.tsx
import { Html, Head, Preview, Body, Container, Heading, Text, Link } from '@react-email/components'
import { Layout } from './layout'

type WelcomeEmailProps = {
  name: string
  orgName: string
  dashboardUrl: string
}

export default function WelcomeEmail({ name, orgName, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {orgName} on BaseStack</Preview>
      <Body>
        <Layout>
          <Heading>Welcome, {name}!</Heading>
          <Text>
            You've been added to <strong>{orgName}</strong> on BaseStack.
          </Text>
          <Link href={dashboardUrl}>Go to your dashboard</Link>
        </Layout>
      </Body>
    </Html>
  )
}
```

## Notification Triggers

Wire notifications into business events:

```ts
// Example: after order status changes
async function handleOrderStatusChange(order: Order, newStatus: string) {
  // Get org members who should be notified
  const members = await getOrgMembers(order.orgId, { role: ['admin', 'owner'] })

  await createNotification({
    orgId: order.orgId,
    userIds: members.map((m) => m.userId),
    type: 'order_status_changed',
    title: `Order ${order.orderNumber} is now ${newStatus}`,
    body: `Order total: $${order.grandTotal}`,
    link: `/app/${order.orgSlug}/orders/${order.id}`,
    sendEmail: true,
    emailTemplate: 'order-status',
    emailData: { order, newStatus },
  })
}
```

## Checklist

- [ ] Create `src/db/schema/notifications.ts` with notification + preference tables
- [ ] Create `src/features/notifications/service.ts` with CRUD operations
- [ ] Create `src/components/notification-center.tsx` UI component
- [ ] Create `src/emails/` directory with React Email templates
- [ ] Add notification bell to app header/sidebar
- [ ] Add notification preferences page in settings
- [ ] Wire notifications into business events (order, invoice, shipment, etc.)
- [ ] Set up Resend API key and domain
- [ ] Test email sending in dev
- [ ] Add notification preferences to RBAC (who can send notifications)
- [ ] Run `db:generate` and `db:migrate`
