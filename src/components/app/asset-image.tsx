import { Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import { getAssetSignedUrl } from '#/features/assets/server'
import { cn } from '#/lib/utils'

interface AssetImageProps {
  assetId: string | null
  className?: string
}

export function AssetImage({ assetId, className }: AssetImageProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const t = useTranslations('products')

  useEffect(() => {
    if (!assetId) {
      setUrl(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(false)

    getAssetSignedUrl({ data: { assetId, variantKey: 'preview' } })
      .then(({ url: fetchedUrl }) => {
        if (cancelled) return
        setUrl(fetchedUrl)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [assetId])

  if (!assetId || error) {
    return (
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0',
          className,
        )}
      >
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }

  if (loading || !url) {
    return (
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg bg-muted animate-pulse shrink-0',
          className,
        )}
      />
    )
  }

  return (
    <img
      src={url}
      alt={t('noPhoto')}
      className={cn('h-10 w-10 rounded-lg object-cover shrink-0', className)}
    />
  )
}
