# 03 - Application Data Table Components

> Reusable table and responsive card components for server-backed workspace resource lists.

## Status

Proposed. This spec captures the agreed design before implementation.

## Scope

The Application Data Table is an Application Component for workspace resource lists such as orders, customers, products, invoices, workflow stages, production tasks, members, and activity tables.

It is optimized for internal workspace lists first. It must remain auth-neutral, org-neutral, and route-neutral. Feature code owns data fetching, URL state, server validation, permissions, filters, row actions, import, and export.

This component is not a shadcn primitive, not a schema-driven table generator, and not a client-only spreadsheet.

## Directory

Use `src/components/app/data-table/*` for the Application Data Table layer. Keep `src/components/ui/*` reserved for shadcn/ui primitives.

```txt
src/components/app/data-table/
├── index.ts
├── data-table.tsx
├── data-table-context.tsx
├── data-table-toolbar.tsx
├── data-table-pagination.tsx
├── data-table-view-options.tsx
├── data-table-mobile-card.tsx
├── data-table-search.tsx
├── data-table-filter-select.tsx
├── data-table-utils.ts
└── data-table.test.tsx
```

## Responsibilities

Application Data Table owns:

- Desktop table rendering with TanStack Table and shadcn table primitives.
- Mobile card rendering below `md`.
- Built-in loading, refetching, empty, no-results, and error states.
- Pagination controls.
- Page-scoped row selection for desktop/tablet.
- Structural selection and actions columns.
- Column visibility state, local-storage persistence, and reset.
- Toolbar layout and shared controlled toolbar primitives.

Feature code owns:

- `createServerFn` list functions.
- TanStack Query or route-loader data fetching.
- `nuqs` URL search params.
- Feature-specific filter state and validation.
- Permission and RBAC decisions.
- Translated labels and copy.
- Domain-specific cell rendering.
- Row action content.
- Bulk action behavior.
- Import and export behavior.
- Confirmation dialogs and mutations.

## State Model

V1 is server-backed only. Do not add client-only sorting, filtering, or pagination mode to this component.

The feature/page owns URL state through `nuqs` and passes controlled state into the table.

Default URL params for a page with one primary table:

- `q`
- `page`
- `perPage`
- `sort`
- resource filters such as `status` or `customerId`

Use unprefixed params by default. Prefix params only for rare routes with multiple independent tables.

Rules:

- `page` is 1-based in the URL and UI.
- `perPage` defaults to `25`.
- Allowed `perPage` values are `10`, `25`, `50`, and `100`.
- Server functions must clamp invalid `page` and `perPage` values.
- Search, filters, sort, and `perPage` reset `page` to `1`.
- Direct pagination controls are the only controls that set a different page.
- Invalid URL params coerce to safe defaults.
- Search/filter typing should use history `replace`.
- Explicit pagination, sort, reset, and clear-filter actions may use history `push`.

## Data Contract

Feature server functions return exact counts.

```ts
type DataTableResult<TData> = {
  rows: TData[]
  totalRows: number
}
```

The table derives page count and visible row range from `totalRows`, `page`, and `perPage`.

Workspace list server functions must enforce org scope, RLS, and permissions before returning rows. The Application Data Table must never receive org, role, membership, or auth props.

## Fetching

Application Data Table must not call server functions itself.

Feature code fetches data with `createServerFn` plus TanStack Query or route loaders, then passes controlled state into the table.

```tsx
<DataTable
  columns={columns}
  data={orders.rows}
  error={ordersError}
  getRowId={(row) => row.id}
  isLoading={ordersQuery.isLoading}
  isRefetching={ordersQuery.isFetching && !ordersQuery.isLoading}
  labels={tableLabels}
  onPageChange={setPage}
  onPerPageChange={setPerPage}
  onSortChange={setSort}
  page={query.page}
  perPage={query.perPage}
  sort={query.sort}
  tableId="orders-index"
  totalRows={orders.totalRows}
/>
```

## Sorting

V1 supports single-column server sorting only.

Encode sort as `field:direction`.

Examples:

- `createdAt:desc`
- `customerName:asc`

Feature schemas must whitelist sortable fields. Unsupported sort values must reset to the feature default.

Do not implement multi-sort in v1.

## Search And Filters

Search and filters are feature-owned URL state.

The shared package may provide controlled toolbar primitives:

- `DataTableSearch`
- `DataTableFilterSelect`
- `DataTableViewOptions`

`DataTableSearch` behavior:

- Keep an immediate local draft value.
- Use TanStack Pacer to debounce URL updates by about 300ms.
- Reset `page` to `1` when committed.
- Flush on Enter and blur.

`DataTableFilterSelect` behavior:

- Single-select only in v1.
- Option shape is `{ value: string; label: string }`.
- Feature code owns the URL param and server validation.

Advanced filters:

- Use the Application Form adapter for multi-field filter panels or drawers.
- Apply/reset buttons update explicit `nuqs` params.
- Date ranges belong in advanced feature-owned filters, not built-in table primitives.

Faceted option counts are out of scope for v1.

## Toolbar

Use named slots so layout stays consistent while feature actions remain feature-owned.

- `toolbarStart`: search and simple filters.
- `toolbarEnd`: create, import, export, and view options.
- `selectionToolbar`: page-scoped bulk actions shown when desktop/tablet rows are selected.

Toolbar slots may be render props that receive table context.

```ts
type DataTableSlotContext<TData> = {
  clearSelection: () => void
  selectedRowIds: string[]
  selectedRows: TData[]
  totalRows: number
  visibleRows: TData[]
}
```

Import and export controls are feature-owned toolbar actions. Export controls must label and implement scope explicitly:

- selected rows
- current page
- all rows matching current filters

Application Data Table must not provide generic import/export behavior.

## Labels And I18n

All visible text must be passed as already-translated strings.

Use a required `labels` object for shared table chrome.

```ts
type DataTableLabels = {
  clearFilters: string
  columnVisibility: string
  errorTitle: string
  firstPage: string
  lastPage: string
  loading: string
  nextPage: string
  of: string
  page: string
  perPage: string
  previousPage: string
  resetColumns: string
  rowsSelected: (selected: number, total: number) => string
  visibleRows: (from: number, to: number, total: number) => string
}
```

Do not use translation keys inside Application Data Table. Do not hardcode English defaults.

Avoid shadcn pagination wrappers that hardcode English labels. Render translated labels with shadcn primitives or `Button` directly.

## Columns

Use TanStack Table column definitions with a small UI-only metadata shape.

```ts
type AppColumnMeta = {
  align?: 'start' | 'center' | 'end'
  cellClassName?: string
  headerClassName?: string
  label: string
  mobileRole?: 'title' | 'subtitle' | 'meta' | 'badge' | 'hidden'
  skeleton?: 'text' | 'badge' | 'avatar' | 'number' | 'actions'
}
```

Rules:

- Feature code owns cell rendering for status, money, dates, links, and domain labels.
- Data columns are hideable by default.
- Structural selection and actions columns are not hideable.
- Required identity columns should opt out with `enableHiding: false`.
- Source order defines feature column order.
- DataTable inserts the selection column first when selection is enabled.
- DataTable inserts the actions column last when `rowActions` is provided.
- No user-controlled column reorder or pinning in v1.

## Column Visibility

Every table requires a stable `tableId`.

Examples:

- `orders-index`
- `customers-index`
- `audit-log`

Persist column visibility in local storage keyed by `tableId`. Column visibility is a user preference, not a shareable URL state.

Render default visibility on the server and apply stored preferences after hydration.

Render the View Options control automatically when at least one column can hide, unless disabled by the feature. Include a reset action that clears only this table's visibility preference.

## Responsive Behavior

Render mobile cards below `md`. Render the desktop table at `md` and above.

Mobile cards use column metadata by default:

- `title`: primary identifier or link.
- `subtitle`: secondary context.
- `badge`: compact status or classification.
- `meta`: supporting fields.
- `hidden`: omitted from cards.

Allow a custom `mobileCard` renderer only when a table needs a bespoke card layout.

Mobile behavior:

- Hide selection and bulk actions.
- Keep cards focused on viewing and primary row actions.
- Show a compact row action menu when `rowActions` is provided.
- Keep primary navigation as a real Link or Button inside the card.

## Row Interaction

Support optional `onRowClick` for pointer convenience only.

Accessibility rule: the primary identifier cell or card title must also render a real focusable Link or Button supplied by the feature. Do not rely on clickable rows as the only navigation path.

`rowActions` supplies feature-owned per-row action content. Row actions must stop row-click propagation.

The DataTable creates the structural actions column and mobile action slot when `rowActions` is provided.

## Selection And Bulk Actions

Selection is page-scoped and applies only to currently loaded rows.

Rules:

- Selection is hidden on mobile.
- Selection requires `getRowId`.
- Never infer selected IDs from row index.
- Clear selection when page, `perPage`, search, filters, or sort changes.
- Render selected-count copy from `labels.rowsSelected`.
- Render bulk actions through the feature-owned `selectionToolbar` slot.

Do not support “select all matching filters” in v1.

## Pagination UI

Render:

- first page button
- previous page button
- current page / total pages text
- next page button
- last page button
- visible row range
- per-page select

Do not add a go-to-page input in v1.

## Loading, Empty, And Error States

Built-in states are required.

Initial loading:

- Render skeleton rows on desktop/tablet.
- Render skeleton cards on mobile.

Refetching:

- Keep current rows visible.
- Show a subtle busy state.
- Disable pagination controls while a page transition is pending if needed.

Empty states:

- Distinguish first-use empty from filtered no-results.
- Feature passes `emptyState`, `noResultsState`, and `hasActiveFilters`.
- DataTable renders a clear-filters action only when `onClearFilters` is provided.

Error state:

- Feature passes translated error title/message.
- Feature may pass a retry action.
- DataTable renders the error consistently.

## Out Of Scope For V1

- Client-only table mode.
- Inline editing.
- Virtualized rows.
- Sticky headers.
- Expandable rows.
- Grouping and aggregation footers.
- User-controlled column reorder.
- Column pinning.
- Density controls.
- Multi-sort.
- Built-in date-range filters.
- Built-in multi-select filters.
- Built-in import/export.
- Built-in confirmation dialogs.
- Built-in money/date/status formatters.
- Selecting all rows matching current filters.

## First Implementation Plan

Implement the shared package in `src/components/app/data-table/*`.

First adoption target should be a real workspace resource list, preferably the first Orders or Customers index route. Do not retrofit this into public/mobile-only flows unless a table is actually needed.

## Tests

Use Vitest and Testing Library for shared component tests.

Cover:

- Row rendering.
- Initial loading skeletons.
- Refetching busy state with existing rows preserved.
- Empty vs no-results state selection.
- Error state and retry action.
- Pagination callbacks.
- Sort callback encoding.
- Column visibility persistence by `tableId`.
- Resetting column visibility for the current table only.
- Page-scoped selection and clearing on query changes.
- Mobile card rendering from column metadata.
- Selection hidden on mobile.

Feature-level tests should cover:

- `nuqs` parser defaults and coercion.
- Server function input validation.
- Sort whitelist behavior.
- Org scope, RLS, and permission boundaries.
