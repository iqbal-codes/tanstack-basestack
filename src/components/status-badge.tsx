import { Badge, type BadgeProps } from '#/components/ui/badge'

type StatusVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'

const statusMap: Record<string, { variant: StatusVariant; label: string }> = {
  draft: { variant: 'secondary', label: 'Draft' },
  pending: { variant: 'outline', label: 'Pending' },
  approved: { variant: 'default', label: 'Approved' },
  production: { variant: 'warning', label: 'In Production' },
  in_delivery: { variant: 'default', label: 'In Delivery' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'secondary', label: 'Inactive' },
  paid: { variant: 'success', label: 'Paid' },
  overdue: { variant: 'destructive', label: 'Overdue' },
  failed: { variant: 'destructive', label: 'Failed' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status] ?? {
    variant: 'outline' as const,
    label: status,
  }
  return (
    <Badge variant={config.variant as BadgeProps['variant']}>
      {config.label}
    </Badge>
  )
}
