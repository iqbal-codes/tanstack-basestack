import { useCallback, useRef, useState } from 'react'
import type { UploadItem } from '#/features/assets/upload-machine'
import {
  createUploadItem,
  isSubmitBlocked,
} from '#/features/assets/upload-machine'
import type { UploaderAdapter } from './types'

const MAX_CONCURRENT = 3
const UNDO_TIMEOUT_MS = 5000

export type UseUploadMachineOptions = {
  adapter: UploaderAdapter
  maxConcurrency?: number
  onUploadComplete?: (assetId: string) => void
  onUploadError?: (itemId: string, error: string) => void
}

export type UseUploadMachineReturn = {
  items: UploadItem[]
  isBlocked: boolean
  addFiles: (files: File[]) => void
  removeItem: (itemId: string) => void
  retryItem: (itemId: string) => void
  clearFailed: () => void
  updateItem: (itemId: string, update: Partial<UploadItem>) => void
}

export function useUploadMachine(
  initialItems: UploadItem[],
  options: UseUploadMachineOptions,
): UseUploadMachineReturn {
  const {
    adapter,
    maxConcurrency = MAX_CONCURRENT,
    onUploadComplete,
    onUploadError,
  } = options
  const [items, setItems] = useState<UploadItem[]>(initialItems)
  const uploadingRef = useRef<Set<string>>(new Set())
  const undoTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  const updateItem = useCallback(
    (itemId: string, update: Partial<UploadItem>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ...update } : item,
        ),
      )
    },
    [],
  )

  const processQueue = useCallback(() => {
    const pendingItems = items.filter((item) => item.status === 'pending')
    const currentUploading = uploadingRef.current.size

    if (currentUploading >= maxConcurrency) return

    const slotsAvailable = maxConcurrency - currentUploading
    const toStart = pendingItems.slice(0, slotsAvailable)

    for (const item of toStart) {
      uploadingRef.current.add(item.id)
      updateItem(item.id, { status: 'uploading', progress: 0 })

      item.file.arrayBuffer().then(async () => {
        try {
          const result = await adapter.uploadFile({
            ...item,
            status: 'uploading',
            progress: 50,
          })
          updateItem(item.id, { status: 'processing', progress: 75 })
          updateItem(item.id, {
            status: 'done',
            progress: 100,
            assetId: result.assetId,
            error: null,
          })
          uploadingRef.current.delete(item.id)
          onUploadComplete?.(result.assetId)
          processQueue()
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Upload failed'
          updateItem(item.id, { status: 'failed', error: errorMessage })
          uploadingRef.current.delete(item.id)
          onUploadError?.(item.id, errorMessage)
          processQueue()
        }
      })
    }
  }, [
    items,
    maxConcurrency,
    adapter,
    updateItem,
    onUploadComplete,
    onUploadError,
  ])

  const addFiles = useCallback(
    (files: File[]) => {
      const newItems = files.map(createUploadItem)
      setItems((prev) => [...prev, ...newItems])
      processQueue()
    },
    [processQueue],
  )

  const removeItem = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId)
      if (!item) return

      if (item.assetId) {
        const timeout = setTimeout(async () => {
          try {
            await adapter.removeFile(item.assetId as string)
          } catch {}
          undoTimeoutsRef.current.delete(itemId)
          setItems((prev) => prev.filter((i) => i.id !== itemId))
        }, UNDO_TIMEOUT_MS)
        undoTimeoutsRef.current.set(itemId, timeout)
        updateItem(itemId, { status: 'pending' })
      } else {
        setItems((prev) => prev.filter((i) => i.id !== itemId))
      }
    },
    [items, adapter, updateItem],
  )

  const retryItem = useCallback(
    (itemId: string) => {
      updateItem(itemId, { status: 'pending', error: null })
      processQueue()
    },
    [updateItem, processQueue],
  )

  const clearFailed = useCallback(() => {
    setItems((prev) => prev.filter((item) => item.status !== 'failed'))
  }, [])

  return {
    items,
    isBlocked: isSubmitBlocked(items),
    addFiles,
    removeItem,
    retryItem,
    clearFailed,
    updateItem,
  }
}
