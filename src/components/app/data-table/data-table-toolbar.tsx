import type { DataTableSlotContext } from './data-table-utils'

type DataTableToolbarProps<TData> = {
  toolbarStart?: React.ReactNode
  toolbarEnd?: React.ReactNode
  selectionToolbar?: (ctx: DataTableSlotContext<TData>) => React.ReactNode
  slotContext: DataTableSlotContext<TData>
}

export function DataTableToolbar<TData>({
  toolbarStart,
  toolbarEnd,
  selectionToolbar,
  slotContext,
}: DataTableToolbarProps<TData>) {
  const hasSelection = slotContext.selectedRowIds.length > 0

  return (
    <div className="flex flex-col gap-4">
      {hasSelection && selectionToolbar ? (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <p className="text-sm text-muted-foreground">
            {slotContext.totalRows > 0
              ? `${slotContext.selectedRowIds.length} selected`
              : null}
          </p>
          <div className="flex items-center gap-2">
            {selectionToolbar(slotContext)}
          </div>
        </div>
      ) : null}

      {!hasSelection && (toolbarStart || toolbarEnd) ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">{toolbarStart}</div>
          <div className="flex items-center gap-2">{toolbarEnd}</div>
        </div>
      ) : null}
    </div>
  )
}
