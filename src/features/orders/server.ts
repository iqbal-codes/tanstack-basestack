import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import {
  type CreateDraftOrderInput,
  type CreateDraftOrderResult,
  createDraftOrder,
  type GetOrderResult,
  getOrder,
  type ListOrdersResult,
  listOrders,
  removeLineItem,
  type UpdateLineItemInput,
  updateLineItem,
} from './model'

async function resolveOrgId(): Promise<string> {
  const { auth } = await import('#/lib/auth')
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Not authenticated')

  const { db } = await import('#/db/index')
  const { member } = await import('#/db/schema')
  const { eq } = await import('drizzle-orm')
  const memberships = await db
    .select({ orgId: member.organizationId })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1)

  if (memberships.length === 0) throw new Error('No organization')
  return memberships[0].orgId
}

export const listOrdersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { orgId: string }) => data)
  .handler(async ({ data }): Promise<ListOrdersResult> => {
    return listOrders(data.orgId)
  })

export const getOrderFn = createServerFn({ method: 'GET' })
  .inputValidator((input: { id: string; orgId: string }) => input)
  .handler(async ({ data }): Promise<GetOrderResult | null> => {
    return getOrder(data.id, data.orgId)
  })

export const createDraftOrderFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: Omit<CreateDraftOrderInput, 'orgId'> & { orgId: string }) => input,
  )
  .handler(async ({ data }): Promise<CreateDraftOrderResult> => {
    const orgId = await resolveOrgId()
    return createDraftOrder(orgId, {
      customerId: data.customerId,
      notes: data.notes,
      lineItems: data.lineItems,
    })
  })

export const updateLineItemFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { itemId: string; orgId: string } & UpdateLineItemInput) => input,
  )
  .handler(async ({ data }) => {
    const orgId = await resolveOrgId()
    return updateLineItem(data.itemId, orgId, {
      quantity: data.quantity,
      unitPrice: data.unitPrice,
    })
  })

export const removeLineItemFn = createServerFn({ method: 'POST' })
  .inputValidator((input: { itemId: string; orgId: string }) => input)
  .handler(async ({ data }) => {
    const orgId = await resolveOrgId()
    return removeLineItem(data.itemId, orgId)
  })
