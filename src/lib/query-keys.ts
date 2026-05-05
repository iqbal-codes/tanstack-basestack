export const queryKeys = {
  assets: {
    all: ['assets'] as const,
    signedUrl: (assetId: string) =>
      [...queryKeys.assets.all, 'signed-url', assetId] as const,
  },
}
