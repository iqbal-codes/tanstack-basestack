export type UploadStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'failed'

export type UploadItem = {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error: string | null
  assetId: string | null
}

export function isSubmitBlocked(items: UploadItem[]): boolean {
  return items.some(
    (item) =>
      item.status === 'pending' ||
      item.status === 'uploading' ||
      item.status === 'processing' ||
      item.status === 'failed',
  )
}

export function createUploadItem(file: File): UploadItem {
  return {
    id: crypto.randomUUID(),
    file,
    status: 'pending',
    progress: 0,
    error: null,
    assetId: null,
  }
}
