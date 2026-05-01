import { and, asc, desc, eq, like } from 'drizzle-orm'
import { db } from '#/db/index'
import {
  pricingBreakpoints as breakpointsTable,
  products as productsTable,
  productVariants as variantsTable,
} from '#/db/schema'

export type Product = {
  id: string
  orgId: string
  name: string
  description: string | null
  active: boolean
  productionNotes: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateProductInput = {
  orgId: string
  name: string
  description?: string
  productionNotes?: string
}

export type UpdateProductInput = {
  id: string
  orgId: string
  name?: string
  description?: string | null
  productionNotes?: string | null
  active?: boolean
}

export type ProductListOptions = {
  orgId: string
  search?: string
  activeOnly?: boolean
  sortBy?: 'createdAt' | 'name'
  sortDir?: 'asc' | 'desc'
}

function generateId(): string {
  return crypto.randomUUID()
}

export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  const id = generateId()
  const now = new Date()
  await db.insert(productsTable).values({
    id,
    orgId: input.orgId,
    name: input.name,
    description: input.description ?? null,
    productionNotes: input.productionNotes ?? null,
    active: true,
    createdAt: now,
    updatedAt: now,
  })

  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1)

  return rows[0] as Product
}

export async function updateProduct(
  input: UpdateProductInput,
): Promise<Product> {
  const now = new Date()
  const updates: Record<string, unknown> = { updatedAt: now }
  if (input.name !== undefined) updates.name = input.name
  if (input.description !== undefined) updates.description = input.description
  if (input.productionNotes !== undefined)
    updates.productionNotes = input.productionNotes
  if (input.active !== undefined) updates.active = input.active

  await db
    .update(productsTable)
    .set(updates)
    .where(
      and(eq(productsTable.id, input.id), eq(productsTable.orgId, input.orgId)),
    )

  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, input.id))
    .limit(1)

  return rows[0] as Product
}

export async function listProducts(
  options: ProductListOptions,
): Promise<Product[]> {
  const conditions = [eq(productsTable.orgId, options.orgId)]

  if (options.activeOnly) {
    conditions.push(eq(productsTable.active, true))
  }

  if (options.search) {
    const pattern = `%${options.search}%`
    conditions.push(like(productsTable.name, pattern))
  }

  const orderBy =
    options.sortBy === 'name'
      ? options.sortDir === 'desc'
        ? desc(productsTable.name)
        : asc(productsTable.name)
      : options.sortDir === 'desc'
        ? desc(productsTable.createdAt)
        : asc(productsTable.createdAt)

  const rows = await db
    .select()
    .from(productsTable)
    .where(and(...conditions))
    .orderBy(orderBy)

  return rows as Product[]
}

export async function getProduct(
  id: string,
  orgId: string,
): Promise<Product | null> {
  const rows = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, id), eq(productsTable.orgId, orgId)))
    .limit(1)

  return (rows[0] as Product) ?? null
}

export async function deleteProduct(id: string, orgId: string): Promise<void> {
  await db
    .delete(productsTable)
    .where(and(eq(productsTable.id, id), eq(productsTable.orgId, orgId)))
}

export type ProductVariant = {
  id: string
  orgId: string
  productId: string
  name: string
  attributes: Record<string, string>
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateVariantInput = {
  orgId: string
  productId: string
  name: string
  attributes?: Record<string, string>
}

export async function createVariant(
  input: CreateVariantInput,
): Promise<ProductVariant> {
  const id = generateId()
  const now = new Date()
  await db.insert(variantsTable).values({
    id,
    orgId: input.orgId,
    productId: input.productId,
    name: input.name,
    attributes: input.attributes ?? {},
    active: true,
    createdAt: now,
    updatedAt: now,
  })

  const rows = await db
    .select()
    .from(variantsTable)
    .where(eq(variantsTable.id, id))
    .limit(1)

  return rows[0] as ProductVariant
}

export async function listVariants(
  productId: string,
): Promise<ProductVariant[]> {
  const rows = await db
    .select()
    .from(variantsTable)
    .where(eq(variantsTable.productId, productId))
    .orderBy(asc(variantsTable.createdAt))

  return rows as ProductVariant[]
}

export async function updateVariant(input: {
  id: string
  orgId: string
  name?: string
  attributes?: Record<string, string>
  active?: boolean
}): Promise<ProductVariant> {
  const now = new Date()
  const updates: Record<string, unknown> = { updatedAt: now }
  if (input.name !== undefined) updates.name = input.name
  if (input.attributes !== undefined) updates.attributes = input.attributes
  if (input.active !== undefined) updates.active = input.active

  await db
    .update(variantsTable)
    .set(updates)
    .where(
      and(eq(variantsTable.id, input.id), eq(variantsTable.orgId, input.orgId)),
    )

  const rows = await db
    .select()
    .from(variantsTable)
    .where(eq(variantsTable.id, input.id))
    .limit(1)

  return rows[0] as ProductVariant
}

export async function deleteVariant(id: string, orgId: string): Promise<void> {
  await db
    .delete(variantsTable)
    .where(and(eq(variantsTable.id, id), eq(variantsTable.orgId, orgId)))
}

export type PricingBreakpoint = {
  id: string
  orgId: string
  productId: string
  variantId: string | null
  minQuantity: number
  unitPrice: number
  createdAt: Date
  updatedAt: Date
}

export type CreateBreakpointInput = {
  orgId: string
  productId: string
  variantId?: string
  minQuantity: number
  unitPrice: number
}

export async function createBreakpoint(
  input: CreateBreakpointInput,
): Promise<PricingBreakpoint> {
  const id = generateId()
  const now = new Date()
  await db.insert(breakpointsTable).values({
    id,
    orgId: input.orgId,
    productId: input.productId,
    variantId: input.variantId ?? null,
    minQuantity: input.minQuantity,
    unitPrice: input.unitPrice,
    createdAt: now,
    updatedAt: now,
  })

  const rows = await db
    .select()
    .from(breakpointsTable)
    .where(eq(breakpointsTable.id, id))
    .limit(1)

  return rows[0] as PricingBreakpoint
}

export async function listBreakpoints(
  productId: string,
  variantId?: string,
): Promise<PricingBreakpoint[]> {
  const conditions = [eq(breakpointsTable.productId, productId)]

  if (variantId !== undefined) {
    conditions.push(eq(breakpointsTable.variantId, variantId))
  }

  const rows = await db
    .select()
    .from(breakpointsTable)
    .where(and(...conditions))
    .orderBy(asc(breakpointsTable.minQuantity))

  return rows as PricingBreakpoint[]
}

export async function updateBreakpoint(input: {
  id: string
  orgId: string
  minQuantity?: number
  unitPrice?: number
}): Promise<PricingBreakpoint> {
  const now = new Date()
  const updates: Record<string, unknown> = { updatedAt: now }
  if (input.minQuantity !== undefined) updates.minQuantity = input.minQuantity
  if (input.unitPrice !== undefined) updates.unitPrice = input.unitPrice

  await db
    .update(breakpointsTable)
    .set(updates)
    .where(
      and(
        eq(breakpointsTable.id, input.id),
        eq(breakpointsTable.orgId, input.orgId),
      ),
    )

  const rows = await db
    .select()
    .from(breakpointsTable)
    .where(eq(breakpointsTable.id, input.id))
    .limit(1)

  return rows[0] as PricingBreakpoint
}

export async function deleteBreakpoint(
  id: string,
  orgId: string,
): Promise<void> {
  await db
    .delete(breakpointsTable)
    .where(and(eq(breakpointsTable.id, id), eq(breakpointsTable.orgId, orgId)))
}
