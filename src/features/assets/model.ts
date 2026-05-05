export type OwnerType = string
export type Usage = 'logo' | 'profile' | 'gallery' | 'attachment'
export type AssetKind = 'image' | 'video' | 'file'
export type VariantKey = 'preview' | 'full' | 'original'

export interface Asset {
  id: string
  ownerType: string | null
  ownerId: string | null
  draftId: string | null
  usage: string | null
  assetKind: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  uploadedByUserId: string
  status: string
  checksumSha256: string | null
  imageWidth: number | null
  imageHeight: number | null
  videoDurationSeconds: number | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AssetVariant {
  id: string
  assetId: string
  variantKey: VariantKey
  storageKey: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  createdAt: Date
}

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const
export const FILE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const USAGE_LIMITS: Record<
  string,
  { maxActive: number; maxBytes: number; kinds: AssetKind[] }
> = {
  logo: { maxActive: 1, maxBytes: 5 * 1024 * 1024, kinds: ['image'] },
  profile: { maxActive: 1, maxBytes: 8 * 1024 * 1024, kinds: ['image'] },
  gallery: {
    maxActive: 20,
    maxBytes: 25 * 1024 * 1024,
    kinds: ['image', 'video'],
  },
  attachment: {
    maxActive: 50,
    maxBytes: 100 * 1024 * 1024,
    kinds: ['image', 'video', 'file'],
  },
}

export const SIGNED_URL_TTL_SECONDS: Record<VariantKey, number> = {
  preview: 15 * 60,
  full: 15 * 60,
  original: 5 * 60,
}
