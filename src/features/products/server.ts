import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import {
  type CreateProductInput,
  createProduct,
  getProduct,
  listProducts,
  type Product,
  type UpdateProductInput,
  updateProduct,
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

export const listProductsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Product[]> => {
    const orgId = await resolveOrgId()
    return listProducts({ orgId })
  },
)

export const getProductFn = createServerFn({ method: 'GET' })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<Product | null> => {
    const orgId = await resolveOrgId()
    return getProduct(data.id, orgId)
  })

export const createProductFn = createServerFn({ method: 'POST' })
  .inputValidator((input: Omit<CreateProductInput, 'orgId'>) => input)
  .handler(async ({ data }): Promise<Product> => {
    const orgId = await resolveOrgId()
    return createProduct({ ...data, orgId })
  })

export const updateProductFn = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateProductInput) => input)
  .handler(async ({ data }): Promise<Product> => {
    const orgId = await resolveOrgId()
    return updateProduct({ ...data, orgId })
  })
