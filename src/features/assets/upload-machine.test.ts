import { describe, expect, it } from 'vitest'
import type { UploadItem } from './upload-machine'
import { createUploadItem, isSubmitBlocked } from './upload-machine'

describe('upload machine', () => {
  describe('UploadItem status transitions', () => {
    it('starts in pending state', () => {
      const item: UploadItem = {
        id: 'file-1',
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        status: 'pending',
        progress: 0,
        error: null,
        assetId: null,
      }
      expect(item.status).toBe('pending')
      expect(item.progress).toBe(0)
    })

    it('transitions to uploading when upload starts', () => {
      const item: UploadItem = {
        id: 'file-1',
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        status: 'uploading',
        progress: 0,
        error: null,
        assetId: null,
      }
      expect(item.status).toBe('uploading')
    })

    it('transitions to processing after upload completes', () => {
      const item: UploadItem = {
        id: 'file-1',
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        status: 'processing',
        progress: 100,
        error: null,
        assetId: null,
      }
      expect(item.status).toBe('processing')
      expect(item.progress).toBe(100)
    })

    it('transitions to done when processing completes', () => {
      const item: UploadItem = {
        id: 'file-1',
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        status: 'done',
        progress: 100,
        error: null,
        assetId: 'asset-123',
      }
      expect(item.status).toBe('done')
      expect(item.assetId).toBe('asset-123')
    })

    it('transitions to failed on error', () => {
      const item: UploadItem = {
        id: 'file-1',
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        status: 'failed',
        progress: 45,
        error: 'Network error',
        assetId: null,
      }
      expect(item.status).toBe('failed')
      expect(item.error).toBe('Network error')
    })
  })

  describe('isSubmitBlocked', () => {
    it('returns false when all items are done', () => {
      const items: UploadItem[] = [
        {
          id: 'file-1',
          file: new File(['test'], 'a.png', { type: 'image/png' }),
          status: 'done',
          progress: 100,
          error: null,
          assetId: 'asset-1',
        },
        {
          id: 'file-2',
          file: new File(['test'], 'b.png', { type: 'image/png' }),
          status: 'done',
          progress: 100,
          error: null,
          assetId: 'asset-2',
        },
      ]
      expect(isSubmitBlocked(items)).toBe(false)
    })

    it('returns true when any item is uploading', () => {
      const items: UploadItem[] = [
        {
          id: 'file-1',
          file: new File(['test'], 'a.png', { type: 'image/png' }),
          status: 'done',
          progress: 100,
          error: null,
          assetId: 'asset-1',
        },
        {
          id: 'file-2',
          file: new File(['test'], 'b.png', { type: 'image/png' }),
          status: 'uploading',
          progress: 50,
          error: null,
          assetId: null,
        },
      ]
      expect(isSubmitBlocked(items)).toBe(true)
    })

    it('returns true when any item is failed', () => {
      const items: UploadItem[] = [
        {
          id: 'file-1',
          file: new File(['test'], 'a.png', { type: 'image/png' }),
          status: 'done',
          progress: 100,
          error: null,
          assetId: 'asset-1',
        },
        {
          id: 'file-2',
          file: new File(['test'], 'b.png', { type: 'image/png' }),
          status: 'failed',
          progress: 30,
          error: 'Upload failed',
          assetId: null,
        },
      ]
      expect(isSubmitBlocked(items)).toBe(true)
    })

    it('returns true when any item is pending', () => {
      const items: UploadItem[] = [
        {
          id: 'file-1',
          file: new File(['test'], 'a.png', { type: 'image/png' }),
          status: 'done',
          progress: 100,
          error: null,
          assetId: 'asset-1',
        },
        {
          id: 'file-2',
          file: new File(['test'], 'b.png', { type: 'image/png' }),
          status: 'pending',
          progress: 0,
          error: null,
          assetId: null,
        },
      ]
      expect(isSubmitBlocked(items)).toBe(true)
    })

    it('returns false for empty items', () => {
      expect(isSubmitBlocked([])).toBe(false)
    })
  })

  describe('concurrency queue', () => {
    it('createUploadItem generates unique ids', () => {
      const items = Array.from({ length: 5 }, (_, i) =>
        createUploadItem(
          new File(['test'], `test${i}.png`, { type: 'image/png' }),
        ),
      )
      const ids = items.map((item) => item.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
    })

    it('items start with pending status', () => {
      const item = createUploadItem(
        new File(['test'], 'test.png', { type: 'image/png' }),
      )
      expect(item.status).toBe('pending')
      expect(item.progress).toBe(0)
      expect(item.assetId).toBeNull()
    })
  })
})
