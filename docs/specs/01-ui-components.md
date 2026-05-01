# 01b - UI Components

> Reusable UI components for Pabriq workspace screens.

## Data Table Component

See [03 - Application Data Table Components](./03-application-data-table-components.md).

The old local-state wrapper approach is superseded by the Application Data Table contract: server-backed data, feature-owned `nuqs` URL state, translated labels supplied by features, responsive mobile cards, and page-scoped desktop selection.

## Page Shell Components

See [01 - Application Page Shell Components](./01-application-page-shell-components.md).

The old standalone breadcrumbs and empty-state sketches are superseded by the Application Page Shell contract: route metadata-driven breadcrumbs, responsive shared organization header behavior, desktop-only page headers, standard `PageContent`, and reusable empty states under `src/components/app/page-shell/*`.

## Command Palette (⌘K)

### `src/components/command-palette.tsx`

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList, CommandSeparator,
} from '#/components/ui/command'
import {
  LayoutDashboard, Users, Settings, ShoppingCart,
  Package, Truck, FileText, BarChart3, Search,
  PlusCircle, UserPlus, Home,
} from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/admin' }))}>
            <Home className="size-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/orders' }))}>
            <ShoppingCart className="size-4" /> Orders
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/customers' }))}>
            <Users className="size-4" /> Customers
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/products' }))}>
            <Package className="size-4" /> Products
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/production' }))}>
            <Truck className="size-4" /> Production
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/invoices' }))}>
            <FileText className="size-4" /> Invoices
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/orders/new' }))}>
            <PlusCircle className="size-4" /> New Order
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/customers/new' }))}>
            <UserPlus className="size-4" /> New Customer
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/settings' }))}>
            <Settings className="size-4" /> Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

## Breadcrumbs

### `src/components/breadcrumbs.tsx`

```tsx
import { useRouterState, Link } from '@tanstack/react-router'
import { ChevronRight, Home } from 'lucide-react'
import { Fragment } from 'react'

export function Breadcrumbs() {
  const matches = useRouterState({ select: (s) => s.matches })

  const crumbs = matches
    .filter((m) => m.routeId !== '__root__')
    .map((m) => ({
      label: (m.context as any)?.breadcrumb ?? m.routeId,
      path: m.pathname,
    }))

  if (crumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-foreground">
        <Home className="size-4" />
      </Link>
      {crumbs.map((crumb, i) => (
        <Fragment key={crumb.path}>
          <ChevronRight className="size-4" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
```

## Status Badge

### `src/components/status-badge.tsx`

```tsx
import { Badge, type BadgeProps } from '#/components/ui/badge'

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

const statusMap: Record<string, { variant: StatusVariant; label: string }> = {
  draft: { variant: 'secondary', label: 'Draft' },
  confirmed: { variant: 'default', label: 'Confirmed' },
  processing: { variant: 'warning', label: 'Processing' },
  shipped: { variant: 'default', label: 'Shipped' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  on_hold: { variant: 'warning', label: 'On Hold' },
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'secondary', label: 'Inactive' },
  pending: { variant: 'outline', label: 'Pending' },
  paid: { variant: 'success', label: 'Paid' },
  overdue: { variant: 'destructive', label: 'Overdue' },
  failed: { variant: 'destructive', label: 'Failed' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status] ?? { variant: 'outline' as const, label: status }
  return <Badge variant={config.variant as BadgeProps['variant']}>{config.label}</Badge>
}
```

## Empty State

### `src/components/empty-state.tsx`

```tsx
import type { LucideIcon } from 'lucide-react'
import { PackageOpen } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
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
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

## Confirm Dialog

### `src/components/confirm-dialog.tsx`

```tsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '#/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
}

export function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'default', onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

## Component Index

| Component | File | Status |
|-----------|------|--------|
| Application Data Table | `src/components/app/data-table/*` | New (spec 03) |
| Application Page Shell | `src/components/app/page-shell/*` | New (spec 01) |
| Breadcrumbs | `src/components/app/page-shell/breadcrumbs.tsx` | Superseded by spec 01 |
| StatusBadge | `src/components/status-badge.tsx` | Required for orders, invoices, tasks |
| EmptyState | `src/components/app/page-shell/empty-state.tsx` | Superseded by spec 01 |
| ConfirmDialog | `src/components/confirm-dialog.tsx` | Required for destructive transitions |
| CommandPalette | `src/components/command-palette.tsx` | Later unless needed by a slice |
| WorkflowActions | `src/components/workflow-actions.tsx` | Feature-owned by specs 10-12 |
| PermissionGate (`Can`) | `src/components/permission-gate.tsx` | Feature-owned by spec 05 |
| AppSidebar | `src/components/app-sidebar.tsx` | Extend |
| NavOrg | `src/components/nav-org.tsx` | Extend only if needed for apex workspace context |

## Checklist

- [ ] Create Application Data Table component family from spec 03
- [ ] Create Application Page Shell component family from spec 01
- [ ] Create `StatusBadge` component with status color mapping
- [ ] Create `EmptyState` component
- [ ] Create `ConfirmDialog` component
- [ ] Defer `CommandPalette` unless a feature slice needs it
- [ ] Keep workflow actions and permission gates feature-owned until their slices require shared extraction
- [ ] Update sidebar and layout with Pabriq navigation only
