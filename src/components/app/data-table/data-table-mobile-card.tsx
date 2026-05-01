import type { Row } from '@tanstack/react-table'
import { Badge } from '#/components/ui/badge'
import { Card } from '#/components/ui/card'
import type { AppColumnMeta } from './data-table-utils'

type DataTableMobileCardProps<TData> = {
  row: Row<TData>
  customCard?: (row: TData) => React.ReactNode
}

export function DataTableMobileCard<TData>({
  row,
  customCard,
}: DataTableMobileCardProps<TData>) {
  if (customCard) return <>{customCard(row.original)}</>

  const titleCol = row.getAllCells().find((c) => {
    const meta = c.column.columnDef.meta as AppColumnMeta | undefined
    return meta?.mobileRole === 'title'
  })
  const subtitleCol = row.getAllCells().find((c) => {
    const meta = c.column.columnDef.meta as AppColumnMeta | undefined
    return meta?.mobileRole === 'subtitle'
  })
  const badgeCol = row.getAllCells().find((c) => {
    const meta = c.column.columnDef.meta as AppColumnMeta | undefined
    return meta?.mobileRole === 'badge'
  })
  const metaCols = row.getAllCells().filter((c) => {
    const meta = c.column.columnDef.meta as AppColumnMeta | undefined
    return meta?.mobileRole === 'meta'
  })

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {titleCol && (
            <div className="text-sm font-medium">
              {titleCol.renderValue() as React.ReactNode}
            </div>
          )}
          {subtitleCol && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {subtitleCol.renderValue() as React.ReactNode}
            </div>
          )}
        </div>
        {badgeCol && (
          <Badge variant="outline">
            {badgeCol.renderValue() as React.ReactNode}
          </Badge>
        )}
      </div>
      {metaCols.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          {metaCols.map((col) => (
            <div key={col.id}>{col.renderValue() as React.ReactNode}</div>
          ))}
        </div>
      )}
      {row.getVisibleCells().find((c) => {
        const meta = c.column.columnDef.meta as AppColumnMeta | undefined
        return meta?.mobileRole === 'actions'
      }) && (
        <div className="mt-2 flex justify-end gap-1">
          {row
            .getVisibleCells()
            .filter((c) => {
              const meta = c.column.columnDef.meta as AppColumnMeta | undefined
              return meta?.mobileRole === 'actions'
            })
            .map((c) => c.renderValue() as React.ReactNode)}
        </div>
      )}
    </Card>
  )
}
