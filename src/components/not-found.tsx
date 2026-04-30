import { Link } from '@tanstack/react-router'
import { useTranslations } from 'use-intl'
import { Button } from '#/components/ui/button'

export default function NotFound() {
  const t = useTranslations('common')

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <p className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-black text-[40vw] text-foreground/2 leading-none">
        404
      </p>
      <div className="relative z-10">
        <h1 className="font-medium text-4xl/none tracking-tight">
          {t('pageNotFound')}
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-lg text-muted-foreground">
          {t('pageNotFoundDesc')}
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link to="/">{t('goHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
