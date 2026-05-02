import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, ilike, or, type SQL, sql } from 'drizzle-orm'
import { db } from '#/db/index'
import { customers as customersTable } from '#/db/schema'

export type Customer = {
  id: string
  orgId: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  active: boolean
  photoAssetId: string | null
  createdAt: Date
  updatedAt: Date
}

export type CustomerInput = {
  name: string
  email?: string | null
  phone?: string | null
  notes?: string | null
  active?: boolean
  photoAssetId?: string | null
}

export type CustomerRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  active: boolean
  photoAssetId: string | null
}

export type ListCustomersResult = {
  rows: CustomerRow[]
  totalRows: number
}

export function validateCustomerInput(input: CustomerInput): string | null {
  if (!input.name || input.name.trim().length === 0) {
    return 'nameRequired'
  }
  return null
}

export const listCustomers = createServerFn({ method: 'GET' })
  .inputValidator((data: { orgId: string; search?: string }) => data)
  .handler(async ({ data }): Promise<ListCustomersResult> => {
    const conditions: SQL[] = [eq(customersTable.orgId, data.orgId)]

    if (data.search?.trim()) {
      const pattern = `%${data.search.trim()}%`
      conditions.push(
        or(
          ilike(customersTable.name, pattern),
          ilike(customersTable.email, pattern),
          ilike(customersTable.phone, pattern),
        ) as SQL,
      )
    }

    const allConditions = and(...conditions) as SQL

    const rows = await db
      .select({
        id: customersTable.id,
        name: customersTable.name,
        email: customersTable.email,
        phone: customersTable.phone,
        active: customersTable.active,
        photoAssetId: customersTable.photoAssetId,
      })
      .from(customersTable)
      .where(allConditions)
      .orderBy(desc(customersTable.createdAt))

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customersTable)
      .where(allConditions)

    return {
      rows,
      totalRows: Number(countResult[0]?.count ?? 0),
    }
  })

export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((input: CustomerInput & { orgId: string }) => input)
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const validationError = validateCustomerInput(data)
      if (validationError) {
        return { ok: false, error: validationError }
      }

      await db.insert(customersTable).values({
        id: crypto.randomUUID(),
        orgId: data.orgId,
        name: data.name.trim(),
        email: data.email?.trim() ?? null,
        phone: data.phone?.trim() ?? null,
        notes: data.notes?.trim() ?? null,
        active: data.active ?? true,
        photoAssetId: data.photoAssetId ?? null,
      })

      return { ok: true }
    },
  )

export const updateCustomer = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: CustomerInput & { id: string; orgId: string }) => input,
  )
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const validationError = validateCustomerInput(data)
      if (validationError) {
        return { ok: false, error: validationError }
      }

      await db
        .update(customersTable)
        .set({
          name: data.name.trim(),
          email: data.email?.trim() ?? null,
          phone: data.phone?.trim() ?? null,
          notes: data.notes?.trim() ?? null,
          active: data.active ?? true,
          photoAssetId: data.photoAssetId ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(customersTable.id, data.id),
            eq(customersTable.orgId, data.orgId),
          ),
        )

      return { ok: true }
    },
  )

export const getCustomer = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string; orgId: string }) => data)
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.id, data.id),
          eq(customersTable.orgId, data.orgId),
        ),
      )
      .limit(1)

    return rows[0] ?? null
  })
