# 04 — Database Schema

> Agnostic business tables covering the superset of ERP, CRM, OMS, and LSM domains.

## Schema Organization

Each domain gets its own schema file. Tables reference `organization.id` for multi-tenancy.

```
src/db/schema/
├── auth.ts        # Better Auth tables (existing, auto-managed)
├── core.ts        # organization, membership (auto-managed by BA plugin)
├── customers.ts   # CRM: contacts + companies
├── products.ts    # Product catalog
├── orders.ts      # OMS: orders + line items
├── inventory.ts   # LSM: stock, warehouses, movements
├── shipments.ts   # Logistics: shipments + tracking
├── invoices.ts    # Billing: invoices + line items
├── billing.ts     # Plans, subscriptions (Stripe-synced)
├── audit.ts       # Audit log
├── notifications.ts # In-app notifications
└── index.ts       # Re-exports all schemas
```

## Core Tables

### `src/db/schema/core.ts`

```ts
import { pgTable, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'

// Maps the current user to an organization with a role
// (Better Auth manages this via the organization plugin, but we define
//  any extra columns here if needed — otherwise auto-managed)
```

Managed by Better Auth organization plugin:
- `organization` — id, name, slug, logo, metadata, createdAt, updatedAt
- `member` — id, organizationId, userId, role, createdAt
- `invitation` — id, organizationId, email, role, status, expiresAt, inviterId
- `team` — id, name, organizationId, createdAt
- `teamMember` — id, teamId, memberId, createdAt

## CRM Tables

### `src/db/schema/customers.ts`

```ts
import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'
import { organization } from './core'

// Individual contacts
export const customer = pgTable('customer', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  title: text('title'),
  companyId: text('company_id').references(() => company.id),
  tags: jsonb('tags').$type<string[]>().default([]),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Business accounts / companies
export const company = pgTable('company', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  taxId: text('tax_id'),
  website: text('website'),
  industry: text('industry'),
  size: text('size'), // '1-10', '11-50', '51-200', '201-500', '500+'
  status: text('status').default('active'), // 'active', 'inactive', 'lead'
  billingAddress: jsonb('billing_address').$type<Address>(),
  shippingAddress: jsonb('shipping_address').$type<Address>(),
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  assignedToId: text('assigned_to_id'), // user ID for sales rep
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

type Address = {
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
}
```

## Product Catalog

### `src/db/schema/products.ts`

```ts
import { pgTable, text, timestamp, boolean, jsonb, numeric } from 'drizzle-orm/pg-core'
import { organization } from './core'

export const product = pgTable('product', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  unit: text('unit').default('each'), // 'each', 'kg', 'liter', 'box'
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

## OMS Tables

### `src/db/schema/orders.ts`

```ts
import { pgTable, text, timestamp, jsonb, numeric, integer } from 'drizzle-orm/pg-core'
import { organization } from './core'
import { customer, company } from './customers'
import { product } from './products'

export const order = pgTable('order', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  orderNumber: text('order_number').notNull().unique(), // ORD-2026-0001
  customerId: text('customer_id').references(() => customer.id),
  companyId: text('company_id').references(() => company.id),
  status: text('status').notNull().default('draft'),
  // draft → confirmed → processing → shipped → delivered → cancelled
  //           ↓                       ↓
  //         on-hold                 returned
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxTotal: numeric('tax_total', { precision: 12, scale: 2 }).default('0'),
  shippingTotal: numeric('shipping_total', { precision: 12, scale: 2 }).default('0'),
  discountTotal: numeric('discount_total', { precision: 12, scale: 2 }).default('0'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  shippingAddress: jsonb('shipping_address').$type<Address>(),
  billingAddress: jsonb('billing_address').$type<Address>(),
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdById: text('created_by_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const orderLineItem = pgTable('order_line_item', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => order.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => product.id),
  productName: text('product_name').notNull(), // snapshot at order time
  productSku: text('product_sku').notNull(),    // snapshot at order time
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
})
```

## LSM Tables

### `src/db/schema/inventory.ts`

```ts
import { pgTable, text, timestamp, jsonb, integer, numeric } from 'drizzle-orm/pg-core'
import { organization } from './core'
import { product } from './products'

export const warehouse = pgTable('warehouse', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  name: text('name').notNull(),
  code: text('code').notNull(),  // 'WH-01'
  address: jsonb('address').$type<Address>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const stock = pgTable('stock', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  productId: text('product_id').notNull().references(() => product.id),
  warehouseId: text('warehouse_id').notNull().references(() => warehouse.id),
  quantityOnHand: integer('quantity_on_hand').default(0),
  quantityAllocated: integer('quantity_allocated').default(0),
  quantityAvailable: integer('quantity_available').default(0),
  reorderPoint: integer('reorder_point'),
  reorderQuantity: integer('reorder_quantity'),
  lastCountedAt: timestamp('last_counted_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const stockMovement = pgTable('stock_movement', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  stockId: text('stock_id').notNull().references(() => stock.id),
  type: text('type').notNull(),
  // 'receipt', 'issue', 'transfer', 'adjustment', 'return', 'cycle_count'
  quantity: integer('quantity').notNull(),
  referenceType: text('reference_type'), // 'order', 'shipment', 'purchase_order'
  referenceId: text('reference_id'),
  notes: text('notes'),
  performedById: text('performed_by_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

## Logistics Tables

### `src/db/schema/shipments.ts`

```ts
import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { organization } from './core'
import { order } from './orders'
import { warehouse } from './inventory'

export const shipment = pgTable('shipment', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  orderId: text('order_id').references(() => order.id),
  warehouseId: text('warehouse_id').references(() => warehouse.id),
  carrier: text('carrier'),     // 'UPS', 'FedEx', 'DHL', 'USPS'
  serviceLevel: text('service_level'), // 'standard', 'express', 'overnight'
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  status: text('status').default('pending'),
  // 'pending' → 'processing' → 'in_transit' → 'delivered' | 'failed'
  estimatedDeliveryAt: timestamp('estimated_delivery_at'),
  actualDeliveryAt: timestamp('actual_delivery_at'),
  shippingAddress: jsonb('shipping_address').$type<Address>(),
  weight: text('weight'),
  dimensions: text('dimensions'),
  cost: text('cost'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

## Invoice Tables

### `src/db/schema/invoices.ts`

```ts
import { pgTable, text, timestamp, jsonb, numeric, date } from 'drizzle-orm/pg-core'
import { organization } from './core'
import { customer, company } from './customers'
import { order } from './orders'

export const invoice = pgTable('invoice', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  invoiceNumber: text('invoice_number').notNull().unique(), // INV-2026-0001
  orderId: text('order_id').references(() => order.id),
  customerId: text('customer_id').references(() => customer.id),
  companyId: text('company_id').references(() => company.id),
  status: text('status').default('draft'),
  // 'draft' → 'sent' → 'paid' | 'overdue' | 'void' | 'cancelled'
  //           ↓
  //         'partial'
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxTotal: numeric('tax_total', { precision: 12, scale: 2 }).default('0'),
  discountTotal: numeric('discount_total', { precision: 12, scale: 2 }).default('0'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).default('0'),
  amountDue: numeric('amount_due', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  notes: text('notes'),
  terms: text('terms'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const invoiceLineItem = pgTable('invoice_line_item', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoice.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: text('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
})
```

## Contact/Customer Pattern

All contact info uses the same pattern across modules:

```ts
// Reusable contact column pattern
import type { PgColumnBuilderBase } from 'drizzle-orm/pg-core'

type ContactColumns = {
  firstName: PgColumnBuilderBase
  lastName: PgColumnBuilderBase
  email: PgColumnBuilderBase
  phone: PgColumnBuilderBase
}
```

## Checklist

- [ ] Split schema into domain files under `src/db/schema/`
- [ ] Create `src/db/schema/index.ts` re-exporting all schemas
- [ ] Add `org_id` to all business tables with FK to organization
- [ ] Generate migrations: `bun run db:generate`
- [ ] Run migrations: `bun run db:migrate`
- [ ] Create RLS policies for all new tables
- [ ] Create seed data for PGlite fallback
- [ ] Update `drizzle.config.ts` to point to new schema location
- [ ] Add database indexes on frequent query columns:
  - `customer(org_id, email)`, `customer(org_id, company_id)`
  - `order(org_id, status, created_at)`, `order(org_id, customer_id)`
  - `stock(org_id, product_id, warehouse_id)` — unique
  - `invoice(org_id, status, due_date)`
