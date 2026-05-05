import { describe, expect, it } from 'vitest'
import { queryKeys } from './query-keys'

describe('queryKeys.assets', () => {
  it('signedUrl builds key with assetId', () => {
    const key = queryKeys.assets.signedUrl('asset-1')
    expect(key).toEqual(['assets', 'signed-url', 'asset-1'])
  })
})
