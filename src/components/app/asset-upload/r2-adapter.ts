import { USAGE_LIMITS } from '#/features/assets/model'
import { finalizeUpload } from '#/features/assets/server'
import type { UploadItem } from '#/features/assets/upload-machine'
import { buildR2Key, uploadToR2 } from '#/lib/r2'
import type { AssetUploadConfig, UploaderAdapter, UploadResult } from './types'

export function createR2UploaderAdapter(
  config: AssetUploadConfig,
): UploaderAdapter {
  return {
    async uploadFile(item: UploadItem): Promise<UploadResult> {
      const arrayBuffer = await item.file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const checksumSha256 = await computeSha256(buffer)

      const parts = item.file.name.split('.')
      const ext =
        parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin'

      const assetId = crypto.randomUUID()
      const storageKey = buildR2Key(
        config.ownerId ?? 'draft',
        config.ownerType,
        config.ownerId ?? 'draft',
        assetId,
        'original',
        ext,
      )

      await uploadToR2(
        storageKey,
        buffer,
        item.file.type || 'application/octet-stream',
        {
          'x-amz-meta-org-id': config.ownerId ?? '',
          'x-amz-meta-uploaded-by': 'user',
          'x-amz-meta-checksum-sha256': checksumSha256,
        },
      )

      const result = await finalizeUpload({
        data: {
          draftId: config.ownerId ? undefined : crypto.randomUUID(),
          ownerType: config.ownerType,
          ownerId: config.ownerId,
          usage: config.usage,
          originalFilename: item.file.name,
          mimeType: item.file.type || 'application/octet-stream',
          sizeBytes: item.file.size,
          checksumSha256,
          storageKeyOriginal: storageKey,
          variantOriginalMimeType: item.file.type || 'application/octet-stream',
          variantOriginalSizeBytes: item.file.size,
        },
      })

      return {
        assetId: result.assetId,
        variants: result.variants.map((v) => ({
          variantKey: v.variantKey,
          storageKey: v.storageKey,
          mimeType: v.mimeType,
          sizeBytes: v.sizeBytes,
        })),
      }
    },

    async removeFile(_assetId: string): Promise<void> {
      // TODO: implement removal via cleanup job
    },
  }
}

async function computeSha256(buffer: Buffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new Uint8Array(buffer)
  )
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function getAcceptedMimeTypes(
  usage: keyof typeof USAGE_LIMITS,
): readonly string[] {
  switch (usage) {
    case 'logo':
    case 'profile':
      return ['image/png', 'image/jpeg', 'image/webp']
    case 'gallery':
      return [
        'image/png',
        'image/jpeg',
        'image/webp',
        'video/mp4',
        'video/webm',
      ]
    case 'attachment':
      return [
        'image/png',
        'image/jpeg',
        'image/webp',
        'video/mp4',
        'video/webm',
        'application/pdf',
      ]
  }
}

export function getMaxBytes(usage: keyof typeof USAGE_LIMITS): number {
  return USAGE_LIMITS[usage].maxBytes
}
