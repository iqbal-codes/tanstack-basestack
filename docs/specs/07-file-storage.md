# 07 — File Storage

> S3-compatible presigned uploads, image optimization, and data export (CSV/Excel).

## Strategy

Use S3-compatible storage (AWS S3, Cloudflare R2, MinIO, or Neon Storage) with **presigned URLs** so files never pass through the app server. Direct client-to-storage uploads.

```
Client ──▶ GET /api/v1/files/upload-url ──▶ App Server (validates, generates presigned URL)
Client ──▶ PUT presigned URL ──▶ S3/R2 directly
Client ──▶ POST /api/v1/files/confirm ──▶ App Server (records in DB)
```

## Storage Client

### `src/lib/storage.ts`

```ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.STORAGE_REGION || 'auto',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.STORAGE_BUCKET!
const PUBLIC_URL = process.env.STORAGE_PUBLIC_URL!

// Generate upload presigned URL
export async function createUploadUrl(
  key: string,
  contentType: string,
  maxSizeBytes = 10 * 1024 * 1024, // 10 MB default
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: maxSizeBytes,
  })

  const url = await getSignedUrl(s3, command, { expiresIn: 300 }) // 5 minutes
  return { url, key, publicUrl: `${PUBLIC_URL}/${key}` }
}

// Generate download presigned URL (for private files)
export async function createDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  return getSignedUrl(s3, command, { expiresIn: 3600 }) // 1 hour
}

// Upload file directly (server-side, for PDF generation etc.)
export async function putObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  })

  await s3.send(command)
  return { key, publicUrl: `${PUBLIC_URL}/${key}` }
}

// Delete file
export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  await s3.send(command)
}

// Get public URL
export function getPublicUrl(key: string) {
  return `${PUBLIC_URL}/${key}`
}
```

## File Record Table

### `src/db/schema/files.ts`

```ts
import { pgTable, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'
import { organization } from './core'

export const file = pgTable('file', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organization.id),
  key: text('key').notNull(),              // S3 object key
  filename: text('filename').notNull(),     // Original filename
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  publicUrl: text('public_url'),
  entityType: text('entity_type'),          // 'customer', 'product', 'invoice', 'shipment'
  entityId: text('entity_id'),              // References the parent entity
  uploadedById: text('uploaded_by_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

## Upload API

### `src/features/files/api.ts`

```ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { v4 as uuid } from 'uuid'  // or nanoid
import { createUploadUrl } from '#/lib/storage'
import { db } from '#/db/index'
import { file } from '#/db/schema/files'
import { requirePermission } from '#/features/rbac/guards'

export const requestUploadUrl = createServerFn({ method: 'POST' })
  .validator(z.object({
    filename: z.string().min(1),
    contentType: z.string(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    await requirePermission('customer', ['create']) // or generic 'file' permission

    const id = uuid()
    const key = `uploads/${id}/${data.filename}`

    const { url, publicUrl } = await createUploadUrl(key, data.contentType)

    // Record in DB
    await db.insert(file).values({
      id,
      orgId: getCurrentOrgId(), // from RLS context
      key,
      filename: data.filename,
      contentType: data.contentType,
      sizeBytes: 0, // updated after upload confirmed
      publicUrl,
      entityType: data.entityType,
      entityId: data.entityId,
      uploadedById: getCurrentUserId(),
    })

    return { uploadUrl: url, fileId: id, publicUrl }
  })

export const confirmUpload = createServerFn({ method: 'POST' })
  .validator(z.object({
    fileId: z.string(),
    sizeBytes: z.number(),
  }))
  .handler(async ({ data }) => {
    await db.update(file)
      .set({ sizeBytes: data.sizeBytes })
      .where(eq(file.id, data.fileId))
  })
```

## Client Upload Component

### `src/components/file-upload.tsx`

```tsx
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { requestUploadUrl, confirmUpload } from '#/features/files/api'

type FileUploadProps = {
  entityType?: string
  entityId?: string
  accept?: string
  maxSizeMB?: number
  onUploaded?: (fileId: string, publicUrl: string) => void
}

export function FileUpload({
  entityType,
  entityId,
  accept,
  maxSizeMB = 10,
  onUploaded,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  async function handleFile(file: File) {
    setUploading(true)
    setProgress(0)

    // 1. Get presigned URL
    const { uploadUrl, fileId, publicUrl } = await requestUploadUrl({
      data: {
        filename: file.name,
        contentType: file.type,
        entityType,
        entityId,
      },
    })

    // 2. Upload directly to S3
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })

    // 3. Confirm
    await confirmUpload({
      data: { fileId, sizeBytes: file.size },
    })

    setUploading(false)
    onUploaded?.(fileId, publicUrl)
  }

  return (
    <div>
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && file.size <= maxSizeMB * 1024 * 1024) {
            handleFile(file)
          }
        }}
      />
      {uploading && <Progress value={progress} />}
    </div>
  )
}
```

## Data Export (CSV/Excel)

### `src/features/files/export.ts`

```ts
import { exportQueue } from '#/lib/queue'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const requestExport = createServerFn({ method: 'POST' })
  .validator(z.object({
    type: z.enum(['csv', 'excel']),
    resource: z.enum(['orders', 'customers', 'inventory', 'shipments', 'invoices']),
    filters: z.record(z.unknown()).optional(),
    columns: z.array(z.string()),
  }))
  .handler(async ({ data }) => {
    const job = await exportQueue.add('export', {
      type: data.type,
      query: data.resource,
      filters: data.filters ?? {},
      columns: data.columns,
      orgId: getCurrentOrgId(),
      userId: getCurrentUserId(),
    })

    // Notify user when export is ready
    return { jobId: job.id, status: 'queued' }
  })
```

## Image Optimization

For product images, avatars, etc., use a CDN transform service or add `sharp` for server-side resizing:

```ts
// src/lib/image.ts
import sharp from 'sharp'

export async function optimizeImage(
  buffer: Buffer,
  options: { width?: number; height?: number; quality?: number; format?: 'webp' | 'jpeg' | 'png' },
) {
  let pipeline = sharp(buffer)

  if (options.width || options.height) {
    pipeline = pipeline.resize(options.width, options.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  if (options.format) {
    pipeline = pipeline.toFormat(options.format, {
      quality: options.quality ?? 80,
    })
  }

  return pipeline.toBuffer()
}
```

## Checklist

- [ ] Choose S3-compatible provider (AWS S3, Cloudflare R2, MinIO, Neon Storage)
- [ ] Create `src/lib/storage.ts` with S3 client and presigned URL helpers
- [ ] Create `src/db/schema/files.ts` with file record table
- [ ] Create `src/features/files/api.ts` with upload/confirm endpoints
- [ ] Create `src/components/file-upload.tsx` component
- [ ] Create `src/features/files/export.ts` with export queue integration
- [ ] Create `src/lib/image.ts` with sharp image optimization
- [ ] Add file permissions to RBAC system
- [ ] Set up storage CORS for direct uploads
- [ ] Set up storage lifecycle policies for old uploads
- [ ] Add file preview component (images, PDFs)
- [ ] Run `db:generate` and `db:migrate`
