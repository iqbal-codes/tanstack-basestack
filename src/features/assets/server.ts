import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '#/db/index'
import { assets, assetVariants } from '#/db/schema'
import type { AssetKind, OwnerType, Usage, VariantKey } from './model'
import { IMAGE_MIME_TYPES, USAGE_LIMITS, VIDEO_MIME_TYPES } from './model'

async function resolveOrgId(): Promise<string> {
  const { auth } = await import('#/lib/auth')
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Not authenticated')

  const { member } = await import('#/db/schema')
  const memberships = await db
    .select({ orgId: member.organizationId })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1)

  if (memberships.length === 0) throw new Error('No organization')
  return memberships[0].orgId
}

async function resolveUserId(): Promise<string> {
  const { auth } = await import('#/lib/auth')
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Not authenticated')
  return session.user.id
}

function getAssetKind(mimeType: string): AssetKind {
  if (IMAGE_MIME_TYPES.includes(mimeType as (typeof IMAGE_MIME_TYPES)[number]))
    return 'image'
  if (VIDEO_MIME_TYPES.includes(mimeType as (typeof VIDEO_MIME_TYPES)[number]))
    return 'video'
  return 'file'
}

export type FinalizeUploadInput = {
  draftId?: string
  ownerType: OwnerType
  ownerId?: string
  usage: Usage
  originalFilename: string
  mimeType: string
  sizeBytes: number
  checksumSha256?: string
  imageWidth?: number
  imageHeight?: number
  storageKeyOriginal: string
  variantOriginalMimeType: string
  variantOriginalSizeBytes: number
}

export const finalizeUpload = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown): FinalizeUploadInput => {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input')
    }
    const obj = input as Record<string, unknown>

    const ownerType = obj.ownerType as OwnerType
    const usage = obj.usage as Usage
    const mimeType = obj.mimeType as string
    const sizeBytes = Number(obj.sizeBytes)

    if (
      ![
        'product',
        'customer',
        'organization',
        'order',
        'productionTask',
      ].includes(ownerType)
    ) {
      throw new Error('Invalid ownerType')
    }
    if (!['logo', 'profile', 'gallery', 'attachment'].includes(usage)) {
      throw new Error('Invalid usage')
    }
    if (!mimeType) throw new Error('mimeType required')
    if (!sizeBytes || sizeBytes <= 0) throw new Error('Invalid sizeBytes')

    return obj as FinalizeUploadInput
  })
  .handler(
    async ({
      data,
    }): Promise<{
      assetId: string
      variants: {
        variantKey: VariantKey
        storageKey: string
        mimeType: string
        sizeBytes: number
      }[]
    }> => {
      const orgId = await resolveOrgId()
      const userId = await resolveUserId()

      const limits = USAGE_LIMITS[data.usage]
      if (data.sizeBytes > limits.maxBytes) {
        throw new Error(
          `File size exceeds ${limits.maxBytes} bytes limit for ${data.usage}`,
        )
      }

      const assetKind = getAssetKind(data.mimeType)
      if (!limits.kinds.includes(assetKind)) {
        throw new Error(`${assetKind} not allowed for ${data.usage}`)
      }

      if (data.ownerId) {
        const activeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(assets)
          .where(
            and(
              eq(assets.orgId, orgId),
              eq(assets.ownerType, data.ownerType),
              eq(assets.ownerId, data.ownerId),
              eq(assets.usage, data.usage),
              eq(assets.status, 'active'),
            ),
          )
          .limit(1)

        if (Number(activeCount[0]?.count ?? 0) >= limits.maxActive) {
          throw new Error(
            `Maximum ${limits.maxActive} active ${data.usage} assets reached`,
          )
        }
      }

      const assetId = crypto.randomUUID()
      const now = new Date()

      const insertValues: {
        id: string
        orgId: string
        ownerType: string
        ownerId: string | null
        draftId: string | null
        usage: string
        assetKind: string
        originalFilename: string
        mimeType: string
        sizeBytes: number
        uploadedByUserId: string
        status: string
        checksumSha256: string | null
        imageWidth: number | null
        imageHeight: number | null
        createdAt: Date
        updatedAt: Date
      } = {
        id: assetId,
        orgId,
        ownerType: data.ownerType,
        ownerId: data.ownerId ?? null,
        draftId: data.draftId ?? null,
        usage: data.usage,
        assetKind,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        uploadedByUserId: userId,
        status: 'active',
        checksumSha256: data.checksumSha256 ?? null,
        imageWidth: data.imageWidth ?? null,
        imageHeight: data.imageHeight ?? null,
        createdAt: now,
        updatedAt: now,
      }

      await db.insert(assets).values(insertValues)

      const originalVariantId = crypto.randomUUID()
      await db.insert(assetVariants).values({
        id: originalVariantId,
        assetId,
        variantKey: 'original' as VariantKey,
        storageKey: data.storageKeyOriginal,
        mimeType: data.variantOriginalMimeType,
        sizeBytes: data.variantOriginalSizeBytes,
        createdAt: now,
      })

      const insertedVariants = await db
        .select({
          variantKey: assetVariants.variantKey,
          storageKey: assetVariants.storageKey,
          mimeType: assetVariants.mimeType,
          sizeBytes: assetVariants.sizeBytes,
        })
        .from(assetVariants)
        .where(eq(assetVariants.assetId, assetId))

      return {
        assetId,
        variants: insertedVariants.map((v) => ({
          variantKey: v.variantKey as VariantKey,
          storageKey: v.storageKey,
          mimeType: v.mimeType,
          sizeBytes: v.sizeBytes,
        })),
      }
    },
  )

export const getAssetSignedUrl = createServerFn({ method: 'GET' })
  .inputValidator((input: { assetId: string; variantKey: VariantKey }) => input)
  .handler(async ({ data }): Promise<{ url: string; expiresAt: number }> => {
    await resolveOrgId()

    const variant = await db
      .select()
      .from(assetVariants)
      .where(eq(assetVariants.assetId, data.assetId))
      .limit(1)

    if (variant.length === 0) throw new Error('Variant not found')

    const key = variant[0].storageKey
    const ttl = data.variantKey === 'original' ? 5 * 60 : 15 * 60
    const expiresAt = Date.now() + ttl * 1000

    const signedUrl = `https://mock-r2.example.com/${key}?expires=${expiresAt}`
    return { url: signedUrl, expiresAt }
  })
