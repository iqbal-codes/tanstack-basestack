# 16 — UI Components

> Reusable UI components for the SaaS boilerplate: data table, command palette, breadcrumbs, and more.

## Data Table Component

A reusable TanStack Table wrapper with sorting, filtering, pagination, row selection, and column visibility.

### `src/components/data-table/data-table.tsx`

```tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '#/components/ui/table'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Checkbox } from '#/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Columns3 } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  enableRowSelection?: boolean
  onRowSelectionChange?: (rows: RowSelectionState) => void
  toolbar?: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  enableRowSelection = false,
  onRowSelectionChange,
  toolbar,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function'
        ? updater(rowSelection)
        : updater
      setRowSelection(newSelection)
      onRowSelectionChange?.(newSelection)
    },
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection,
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        )}
        {toolbar}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="size-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {typeof col.columnDef.header === 'string'
                    ? col.columnDef.header
                    : col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Usage Example

```tsx
import { DataTable } from '#/components/data-table/data-table'
import type { ColumnDef } from '@tanstack/react-table'

type Customer = { id: string; name: string; email: string; status: string }

const columns: ColumnDef<Customer>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'status', header: 'Status' },
]

<DataTable
  columns={columns}
  data={customers}
  searchKey="name"
  searchPlaceholder="Search customers..."
  enableRowSelection
  onRowSelectionChange={(rows) => console.log(rows)}
/>
```

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
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/inventory' }))}>
            <Package className="size-4" /> Inventory
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: '/app/$orgSlug/shipments' }))}>
            <Truck className="size-4" /> Shipments
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
| DataTable | `src/components/data-table/data-table.tsx` | New |
| CommandPalette | `src/components/command-palette.tsx` | New |
| Breadcrumbs | `src/components/breadcrumbs.tsx` | New |
| StatusBadge | `src/components/status-badge.tsx` | New |
| EmptyState | `src/components/empty-state.tsx` | New |
| ConfirmDialog | `src/components/confirm-dialog.tsx` | New |
| NotificationCenter | `src/components/notification-center.tsx` | New (spec 08) |
| FileUpload | `src/components/file-upload.tsx` | New (spec 07) |
| WorkflowActions | `src/components/workflow-actions.tsx` | New (spec 10) |
| PermissionGate (`Can`) | `src/components/permission-gate.tsx` | New (spec 03) |
| AppSidebar | `src/components/app-sidebar.tsx` | Extend |
| NavOrg | `src/components/nav-org.tsx` | New (replaces TeamSwitcher) |

## Checklist

- [ ] Create `DataTable` component with sorting, filtering, pagination, selection
- [ ] Create `CommandPalette` component (⌘K)
- [ ] Create `Breadcrumbs` component
- [ ] Create `StatusBadge` component with status color mapping
- [ ] Create `EmptyState` component
- [ ] Create `ConfirmDialog` component
- [ ] Create `FileUpload` component (from spec 07)
- [ ] Create `NotificationCenter` component (from spec 08)
- [ ] Create `PermissionGate` (`Can`) component (from spec 03)
- [ ] Create `WorkflowActions` component (from spec 10)
- [ ] Create `NavOrg` component (replaces hardcoded TeamSwitcher)
- [ ] Add all new components to sidebar and layout
