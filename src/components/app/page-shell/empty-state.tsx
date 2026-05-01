import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { PackageOpen } from 'lucide-react'
import { Button } from '#/components/ui/button'

export type EmptyStateAction = {
  label: string
  href?: string
  onClick?: () => void
}

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      {action?.href ? (
        <Button className="mt-4" asChild>
          <Link to={action.href}>{action.label}</Link>
        </Button>
      ) : action ? (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
