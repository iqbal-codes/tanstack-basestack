import { cn } from '#/lib/utils'
import { PageActions } from './page-actions'
import type { PageAction } from './page-shell-types'

type PageHeaderProps = {
  title: string
  description?: string
  primaryAction?: PageAction
  secondaryActions?: PageAction[]
  className?: string
}

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'hidden md:flex md:items-center md:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <PageActions
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />
    </div>
  )
}
