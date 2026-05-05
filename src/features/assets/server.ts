import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq, inArray } from 'drizzle-orm'
import { assets, assetVariants } from '#/db/schema'
import {
  buildR2Key,
  generateSignedDownloadUrl,
  generateSignedUploadUrl,
} from '#/lib/r2'
import type { AssetKind, VariantKey } from './model'
import { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES } from './model'

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
  assetId?: string
  draftId?: string
  ownerType?: string
  ownerId?: string
  usage?: string
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

    const mimeType = obj.mimeType as string
    const sizeBytes = Number(obj.sizeBytes)

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
      const userId = await resolveUserId()
      const { db } = await import('#/db/index')
      const assetKind = getAssetKind(data.mimeType)

      const assetId = data.assetId ?? crypto.randomUUID()
      const now = new Date()

      await db.insert(assets).values({
        id: assetId,
        ownerType: data.ownerType ?? null,
        ownerId: data.ownerId ?? null,
        draftId: data.draftId ?? null,
        usage: data.usage ?? null,
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
      })

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

export type GetUploadUrlInput = {
  fileName: string
  fileType: string
  fileSize: number
  ownerType?: string
  ownerId?: string
  usage?: string
}

export const getUploadUrl = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown): GetUploadUrlInput => {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input')
    }
    const obj = input as Record<string, unknown>

    const fileName = obj.fileName as string
    const fileType = obj.fileType as string
    const fileSize = Number(obj.fileSize)

    if (!fileName) throw new Error('fileName required')
    if (!fileType) throw new Error('fileType required')
    if (!fileSize || fileSize <= 0) throw new Error('Invalid fileSize')

    return obj as GetUploadUrlInput
  })
  .handler(
    async ({
      data,
    }): Promise<{ uploadUrl: string; storageKey: string; assetId: string }> => {
      const userId = await resolveUserId()

      const parts = data.fileName.split('.')
      const ext =
        parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin'

      const assetId = crypto.randomUUID()
      const storageKey = buildR2Key(
        userId,
        data.ownerType ?? 'general',
        data.ownerId ?? 'draft',
        assetId,
        'original',
        ext,
      )

      const { url } = await generateSignedUploadUrl(
        storageKey,
        data.fileType || 'application/octet-stream',
        900,
      )

      return {
        uploadUrl: url,
        storageKey,
        assetId,
      }
    },
  )

export const getAssetSignedUrl = createServerFn({ method: 'GET' })
  .inputValidator((input: { assetId: string; variantKey: VariantKey }) => input)
  .handler(async ({ data }): Promise<{ url: string; expiresAt: number }> => {
    await resolveUserId()
    const { db } = await import('#/db/index')

    const requestedVariant = await db
      .select()
      .from(assetVariants)
      .where(
        and(
          eq(assetVariants.assetId, data.assetId),
          eq(assetVariants.variantKey, data.variantKey),
        ),
      )
      .limit(1)

    const originalVariant =
      data.variantKey === 'original'
        ? []
        : await db
            .select()
            .from(assetVariants)
            .where(
              and(
                eq(assetVariants.assetId, data.assetId),
                eq(assetVariants.variantKey, 'original'),
              ),
            )
            .limit(1)

    const fallbackVariant = await db
      .select()
      .from(assetVariants)
      .where(eq(assetVariants.assetId, data.assetId))
      .limit(1)

    const variant =
      requestedVariant[0] ?? originalVariant[0] ?? fallbackVariant[0]

    if (!variant) throw new Error('Variant not found')

    const key = variant.storageKey
    const ttl = data.variantKey === 'original' ? 5 * 60 : 15 * 60

    return generateSignedDownloadUrl(key, ttl)
  })

export type AssetMetadata = {
  id: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  assetKind: string
}

export const getAssetsMetadata = createServerFn({ method: 'GET' })
  .inputValidator((input: { assetIds: string[] }) => input)
  .handler(async ({ data }): Promise<AssetMetadata[]> => {
    await resolveUserId()
    const { db } = await import('#/db/index')

    const rows = await db
      .select({
        id: assets.id,
        originalFilename: assets.originalFilename,
        mimeType: assets.mimeType,
        sizeBytes: assets.sizeBytes,
        assetKind: assets.assetKind,
      })
      .from(assets)
      .where(inArray(assets.id, data.assetIds))

    return rows
  })
