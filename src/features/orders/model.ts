import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '#/db/index'
import {
  customers as customersTable,
  orderLineItems as lineItemsTable,
  orders as ordersTable,
  products as productsTable,
} from '#/db/schema'
import { type Breakpoint, calculateUnitPrice } from '#/features/pricing/engine'
import { listBreakpoints } from '#/features/products/model'

export type Order = {
  id: string
  orgId: string
  customerId: string
  status: string
  notes: string | null
  total: number
  createdAt: Date
  updatedAt: Date
}

export type OrderLineItem = {
  id: string
  orgId: string
  orderId: string
  productId: string
  variantId: string | null
  quantity: number
  unitPrice: number
  total: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type LineItemInput = {
  productId: string
  variantId?: string
  quantity: number
  unitPrice?: number
  notes?: string
}

export type CreateDraftOrderInput = {
  customerId: string
  notes?: string
  lineItems: LineItemInput[]
}

export type CreateDraftOrderResult = {
  order: Order
  lineItems: OrderLineItem[]
}

export type GetOrderResult = {
  order: Order
  lineItems: OrderLineItem[]
}

export type OrderRow = {
  id: string
  customerName: string
  status: string
  total: number
  createdAt: Date
}

export type ListOrdersResult = {
  rows: OrderRow[]
  totalRows: number
}

export async function listOrders(orgId: string): Promise<ListOrdersResult> {
  const rows = await db
    .select({
      id: ordersTable.id,
      customerName: customersTable.name,
      status: ordersTable.status,
      total: ordersTable.total,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .where(eq(ordersTable.orgId, orgId))
    .orderBy(desc(ordersTable.createdAt))

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(ordersTable)
    .where(eq(ordersTable.orgId, orgId))

  return {
    rows,
    totalRows: Number(countResult[0]?.count ?? 0),
  }
}

export async function getOrder(
  id: string,
  orgId: string,
): Promise<GetOrderResult | null> {
  const orderRows = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, id), eq(ordersTable.orgId, orgId)))
    .limit(1)

  if (orderRows.length === 0) return null

  const itemRows = await db
    .select()
    .from(lineItemsTable)
    .where(eq(lineItemsTable.orderId, id))
    .orderBy(lineItemsTable.createdAt)

  return {
    order: orderRows[0] as Order,
    lineItems: itemRows as OrderLineItem[],
  }
}

export async function createDraftOrder(
  orgId: string,
  input: CreateDraftOrderInput,
): Promise<CreateDraftOrderResult> {
  const customerRows = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(
      and(
        eq(customersTable.id, input.customerId),
        eq(customersTable.orgId, orgId),
      ),
    )
    .limit(1)
  if (customerRows.length === 0) throw new Error('Customer not found')

  const now = new Date()
  const orderId = crypto.randomUUID()
  const items: OrderLineItem[] = []

  for (const li of input.lineItems) {
    const productRows = await db
      .select({ id: productsTable.id, active: productsTable.active })
      .from(productsTable)
      .where(
        and(eq(productsTable.id, li.productId), eq(productsTable.orgId, orgId)),
      )
      .limit(1)
    if (productRows.length === 0) throw new Error('Product not found')
    if (!productRows[0].active) throw new Error('Product is not active')

    const breakpoints = await listBreakpoints(li.productId, li.variantId)
    const pricingResult = calculateUnitPrice({
      quantity: li.quantity,
      breakpoints: breakpoints as Breakpoint[],
      manualUnitPrice: li.unitPrice,
    })

    if ('code' in pricingResult) {
      throw new Error(pricingResult.message)
    }

    const itemId = crypto.randomUUID()
    items.push({
      id: itemId,
      orgId,
      orderId,
      productId: li.productId,
      variantId: li.variantId ?? null,
      quantity: li.quantity,
      unitPrice: pricingResult.unitPrice.amount,
      total: pricingResult.lineTotal.amount,
      notes: li.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  const orderTotal = items.reduce((sum, i) => sum + i.total, 0)

  await db.insert(ordersTable).values({
    id: orderId,
    orgId,
    customerId: input.customerId,
    status: 'draft',
    notes: input.notes ?? null,
    total: orderTotal,
    createdAt: now,
    updatedAt: now,
  })

  if (items.length > 0) {
    await db.insert(lineItemsTable).values(items)
  }

  return {
    order: {
      id: orderId,
      orgId,
      customerId: input.customerId,
      status: 'draft',
      notes: input.notes ?? null,
      total: orderTotal,
      createdAt: now,
      updatedAt: now,
    },
    lineItems: items,
  }
}

export type UpdateLineItemInput = {
  quantity: number
  unitPrice?: number
}

export async function updateLineItem(
  itemId: string,
  orgId: string,
  input: UpdateLineItemInput,
): Promise<OrderLineItem> {
  const itemRows = await db
    .select()
    .from(lineItemsTable)
    .where(and(eq(lineItemsTable.id, itemId), eq(lineItemsTable.orgId, orgId)))
    .limit(1)

  if (itemRows.length === 0) throw new Error('Line item not found')

  const item = itemRows[0] as OrderLineItem

  const orderRows = await db
    .select({ status: ordersTable.status })
    .from(ordersTable)
    .where(eq(ordersTable.id, item.orderId))
    .limit(1)

  if (orderRows.length === 0) throw new Error('Order not found')
  if (orderRows[0].status !== 'draft')
    throw new Error('Can only modify draft orders')

  const breakpoints = await listBreakpoints(
    item.productId,
    item.variantId ?? undefined,
  )
  const pricingResult = calculateUnitPrice({
    quantity: input.quantity,
    breakpoints: breakpoints as Breakpoint[],
    manualUnitPrice: input.unitPrice,
  })

  if ('code' in pricingResult) {
    throw new Error(pricingResult.message)
  }

  const now = new Date()
  await db
    .update(lineItemsTable)
    .set({
      quantity: input.quantity,
      unitPrice: pricingResult.unitPrice.amount,
      total: pricingResult.lineTotal.amount,
      updatedAt: now,
    })
    .where(eq(lineItemsTable.id, itemId))

  const allItems = await db
    .select()
    .from(lineItemsTable)
    .where(eq(lineItemsTable.orderId, item.orderId))

  const orderTotal = allItems.reduce(
    (sum, i) => sum + (i as OrderLineItem).total,
    0,
  )

  await db
    .update(ordersTable)
    .set({ total: orderTotal, updatedAt: now })
    .where(eq(ordersTable.id, item.orderId))

  const updatedRows = await db
    .select()
    .from(lineItemsTable)
    .where(eq(lineItemsTable.id, itemId))
    .limit(1)

  return updatedRows[0] as OrderLineItem
}

export async function removeLineItem(
  itemId: string,
  orgId: string,
): Promise<void> {
  const itemRows = await db
    .select()
    .from(lineItemsTable)
    .where(and(eq(lineItemsTable.id, itemId), eq(lineItemsTable.orgId, orgId)))
    .limit(1)

  if (itemRows.length === 0) throw new Error('Line item not found')

  const item = itemRows[0] as OrderLineItem

  const orderRows = await db
    .select({ status: ordersTable.status })
    .from(ordersTable)
    .where(eq(ordersTable.id, item.orderId))
    .limit(1)

  if (orderRows.length === 0) throw new Error('Order not found')
  if (orderRows[0].status !== 'draft')
    throw new Error('Can only modify draft orders')

  await db.delete(lineItemsTable).where(eq(lineItemsTable.id, itemId))

  const remaining = await db
    .select()
    .from(lineItemsTable)
    .where(eq(lineItemsTable.orderId, item.orderId))

  const orderTotal = remaining.reduce(
    (sum, i) => sum + (i as OrderLineItem).total,
    0,
  )

  await db
    .update(ordersTable)
    .set({ total: orderTotal, updatedAt: new Date() })
    .where(eq(ordersTable.id, item.orderId))
}
