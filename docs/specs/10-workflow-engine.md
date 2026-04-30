# 10 — Workflow Engine

> Type-safe state machines with xstate v5 for order pipelines, approval flows, and document workflows.

## Strategy

Use `xstate` v5 for complex stateful processes. Each business domain (order, shipment, invoice, approval) gets its own state machine. Machines are type-safe, serializable, and can be persisted to the database.

## Order State Machine

### `src/features/workflow/order-machine.ts`

```ts
import { createMachine, assign } from 'xstate'

export type OrderContext = {
  orderId: string
  orderNumber: string
  orgId: string
  assignedToId?: string
  reason?: string
  updatedById?: string
  timestamp?: string
}

export type OrderEvent =
  | { type: 'CONFIRM'; updatedById: string }
  | { type: 'START_PROCESSING'; updatedById: string }
  | { type: 'MARK_SHIPPED'; updatedById: string; trackingNumber?: string }
  | { type: 'MARK_DELIVERED'; updatedById: string }
  | { type: 'HOLD'; updatedById: string; reason: string }
  | { type: 'RELEASE_HOLD'; updatedById: string }
  | { type: 'CANCEL'; updatedById: string; reason: string }
  | { type: 'REQUEST_RETURN'; updatedById: string; reason: string }
  | { type: 'APPROVE_RETURN'; updatedById: string }
  | { type: 'REJECT_RETURN'; updatedById: string; reason: string }
  | { type: 'MARK_RETURNED'; updatedById: string }

export const orderMachine = createMachine({
  id: 'order',
  initial: 'draft',
  context: {} as OrderContext,
  states: {
    draft: {
      on: {
        CONFIRM: {
          target: 'confirmed',
          actions: assign({ updatedById: ({ event }) => event.updatedById }),
        },
        CANCEL: 'cancelled',
      },
    },
    confirmed: {
      on: {
        START_PROCESSING: 'processing',
        HOLD: 'on_hold',
        CANCEL: {
          target: 'cancelled',
          guard: 'canCancelFromConfirmed',
        },
      },
    },
    processing: {
      on: {
        MARK_SHIPPED: 'shipped',
        HOLD: 'on_hold',
      },
    },
    shipped: {
      on: {
        MARK_DELIVERED: 'delivered',
        REQUEST_RETURN: 'return_requested',
      },
    },
    delivered: {
      on: {
        REQUEST_RETURN: 'return_requested',
      },
      type: 'final' as const,
    },
    on_hold: {
      on: {
        RELEASE_HOLD: {
          target: 'processing',
          actions: assign({ reason: undefined }),
        },
        CANCEL: 'cancelled',
      },
    },
    return_requested: {
      on: {
        APPROVE_RETURN: 'returned',
        REJECT_RETURN: {
          target: 'delivered',
          actions: assign({ reason: ({ event }) => event.reason }),
        },
      },
    },
    returned: {
      type: 'final' as const,
    },
    cancelled: {
      type: 'final' as const,
    },
  },
  types: {} as import('xstate').TypesMachine<OrderContext, OrderEvent>,
})
```

## Workflow Executor

### `src/features/workflow/executor.ts`

```ts
import { createServerFn } from '@tanstack/react-start'
import { createActor } from 'xstate'
import { z } from 'zod'
import { db } from '#/db/index'
import { order } from '#/db/schema/orders'
import { eq } from 'drizzle-orm'
import { writeAuditLog } from '#/features/audit/logger'
import { createNotification } from '#/features/notifications/service'
import { orderMachine, type OrderEvent } from './order-machine'
import { getCurrentOrgId } from '#/lib/rls'
import { requirePermission } from '#/features/rbac/guards'

// Transition an order through its state machine
export const transitionOrder = createServerFn({ method: 'POST' })
  .validator(z.object({
    orderId: z.string(),
    event: z.object({
      type: z.enum([
        'CONFIRM', 'START_PROCESSING', 'MARK_SHIPPED',
        'MARK_DELIVERED', 'HOLD', 'RELEASE_HOLD',
        'CANCEL', 'REQUEST_RETURN', 'APPROVE_RETURN',
        'REJECT_RETURN', 'MARK_RETURNED',
      ]),
    }).passthrough(),
  }))
  .handler(async ({ data }) => {
    await requirePermission('order', ['update'])

    // Get current order state
    const currentOrder = await db.query.order.findFirst({
      where: eq(order.id, data.orderId),
    })

    if (!currentOrder) throw new Error('Order not found')

    // Create actor with current state
    const actor = createActor(orderMachine, {
      snapshot: JSON.parse(currentOrder.metadata?.machineState ?? '{}'),
      input: {
        orderId: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        orgId: currentOrder.orgId,
      },
    })

    actor.start()

    try {
      // Send the event
      actor.send(data.event as OrderEvent)

      // Get new state
      const snapshot = actor.getSnapshot()

      // Update DB
      await db.update(order)
        .set({
          status: String(snapshot.value),
          metadata: {
            ...currentOrder.metadata,
            machineState: JSON.stringify(snapshot),
            lastEvent: data.event,
            lastUpdatedAt: new Date().toISOString(),
            lastUpdatedBy: (data.event as any).updatedById,
          },
          updatedAt: new Date(),
        })
        .where(eq(order.id, data.orderId))

      // Audit
      await writeAuditLog({
        orgId: currentOrder.orgId,
        userId: (data.event as any).updatedById,
        action: `order.${data.event.type.toLowerCase()}`,
        resource: 'order',
        resourceId: data.orderId,
        resourceName: currentOrder.orderNumber,
        oldValues: { status: currentOrder.status },
        newValues: { status: String(snapshot.value) },
      })

      // Notify
      await createNotification({
        orgId: currentOrder.orgId,
        userIds: await getOrgMemberIds(currentOrder.orgId, ['admin', 'owner']),
        type: 'order_status_changed',
        title: `Order ${currentOrder.orderNumber} → ${snapshot.value}`,
        body: `Order has been ${data.event.type.toLowerCase().replace('_', ' ')}`,
        link: `/app/${currentOrder.orgSlug}/orders/${data.orderId}`,
      })

      return { status: String(snapshot.value) }
    } catch (error) {
      actor.stop()
      throw error
    }
  })

// Get available transitions for an order
export const getOrderTransitions = createServerFn({ method: 'GET' })
  .handler(async ({ data }: { data: { orderId: string } }) => {
    const order = await db.query.order.findFirst({
      where: eq(orderTable.id, data.orderId),
    })

    if (!order) throw new Error('Order not found')

    const actor = createActor(orderMachine, {
      snapshot: JSON.parse(order.metadata?.machineState ?? '{}'),
    })
    actor.start()

    const snapshot = actor.getSnapshot()
    const nextEvents = snapshot._nodes
      .filter((n: any) => n.transitions)
      .flatMap((n: any) => n.transitions.map((t: any) => t.eventType))

    actor.stop()
    return [...new Set(nextEvents)]
  })
```

## Workflow UI Component

### `src/components/workflow-actions.tsx`

```tsx
// Renders available actions as buttons based on current machine state
// Each button triggers transitionOrder with the appropriate event

import { Button } from '#/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { transitionOrder, getOrderTransitions } from '#/features/workflow/executor'

export function OrderWorkflowActions({ orderId }: { orderId: string }) {
  const { data: transitions } = useQuery({
    queryKey: ['order-transitions', orderId],
    queryFn: () => getOrderTransitions({ data: { orderId } }),
  })

  const mutation = useMutation({
    mutationFn: (event: any) => transitionOrder({ data: { orderId, event } }),
  })

  return (
    <div className="flex gap-2">
      {transitions?.map((eventType) => (
        <Button
          key={eventType}
          variant={eventType === 'CANCEL' ? 'destructive' : 'default'}
          onClick={() => mutation.mutate({ type: eventType })}
        >
          {eventType.replace('_', ' ').toLowerCase()}
        </Button>
      ))}
    </div>
  )
}
```

## Shipment State Machine

```ts
// Similar pattern: pending → processing → in_transit → delivered | failed
```

## Approval Workflow (Generic)

```ts
// src/features/workflow/approval-machine.ts

// Generic approval: submitted → under_review → approved | rejected
// Can be used for: purchase orders, refunds, discounts, etc.

export const approvalMachine = createMachine({
  id: 'approval',
  initial: 'draft',
  states: {
    draft: {
      on: { SUBMIT: 'submitted' },
    },
    submitted: {
      on: {
        START_REVIEW: 'under_review',
        AUTO_APPROVE: 'approved', // For auto-approval rules
      },
    },
    under_review: {
      on: {
        APPROVE: 'approved',
        REJECT: 'rejected',
        REQUEST_CHANGES: 'changes_requested',
      },
    },
    changes_requested: {
      on: {
        RESUBMIT: 'submitted',
        CANCEL: 'cancelled',
      },
    },
    approved: { type: 'final' },
    rejected: { type: 'final' },
    cancelled: { type: 'final' },
  },
})
```

## Checklist

- [ ] Install `xstate`: `bun add xstate @xstate/react`
- [ ] Create `src/features/workflow/order-machine.ts` with order state machine
- [ ] Create `src/features/workflow/approval-machine.ts` with generic approval
- [ ] Create `src/features/workflow/shipment-machine.ts` with shipment state machine
- [ ] Create `src/features/workflow/executor.ts` with transitionOrder + helpers
- [ ] Create `src/components/workflow-actions.tsx` UI component
- [ ] Create `src/components/workflow-timeline.tsx` visual timeline
- [ ] Add `machineState` to order metadata (JSON column)
- [ ] Add guard functions for permission checks within machines
- [ ] Add notification triggers on state transitions
- [ ] Add audit logging on state transitions (done in executor)
