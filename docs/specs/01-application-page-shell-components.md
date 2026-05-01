# 01 - Application Page Shell Components

> Reusable page chrome and layout components for Pabriq workspace screens.

## Status

Proposed. This spec captures the agreed design before implementation.

## Scope

Application page shell components are reusable UI compositions for workspace page structure. They are built from shadcn/ui primitives, TanStack Router route matches, and lucide-react icons.

They are intended for:

- Workspace page chrome inside the existing organization layout.
- Consistent page titles, breadcrumbs, actions, content width, empty states, and responsive header behavior.
- List, detail, settings, dashboard, and form pages that need standard spacing and page structure.

They are not intended to own feature data fetching, domain permissions, form state, table state, route guards, organization resolution, or business workflows.

## Directory

Use `src/components/app/page-shell/*` for the application page shell layer. Keep `src/components/ui/*` reserved for shadcn/ui primitives.

```txt
src/components/app/page-shell/
├── index.ts
├── breadcrumbs.tsx
├── page-actions.tsx
├── page-content.tsx
├── page-header.tsx
├── empty-state.tsx
├── page-shell-types.ts
└── page-shell.test.tsx
```

## Responsibilities

Application Page Shell owns:

- Workspace breadcrumb rendering from TanStack Router matches.
- Current page title and page action rendering in the shared organization header.
- Desktop-only page header rendering inside page content.
- Standard content width and padding for most workspace pages.
- First-use and no-content empty state presentation.
- Responsive handoff between desktop content headers and mobile shared headers.

Feature code owns:

- Translated labels and page copy.
- Domain-specific page titles and descriptions.
- Primary and secondary action definitions.
- Action behavior, permissions, disabled state decisions, confirmation flows, mutations, import, and export behavior.
- Data table composition through `src/components/app/data-table/*`.
- Form composition through `src/components/app/form/*`.
- Full-bleed layouts such as kanban boards that intentionally skip `PageContent`.

## Route Metadata Contract

Workspace routes provide page metadata through route context.

```ts
import type { LucideIcon } from 'lucide-react'

type PageAction = {
  label: string
  icon?: LucideIcon
  href?: string
  onClick?: () => void
}

type PageMeta = {
  breadcrumb: string
  pageTitle: string
  primaryAction?: PageAction
  secondaryActions?: PageAction[]
}
```

Rules:

- `breadcrumb` is the route label used in the desktop breadcrumb trail.
- `pageTitle` is the current page title used by mobile shared header and desktop `PageHeader`.
- `primaryAction` is the single most important page action, such as creating a new order.
- `secondaryActions` are supporting actions such as import, export, archive, or settings.
- Actions must be already translated by the feature or route.
- Action labels must be human-readable and not translation keys.
- Route metadata must not contain organization, membership, role, or auth objects.
- Route metadata must not contain business rules. Hide or omit actions in feature code when the user lacks permission.

## Organization Layout Integration

The existing `_org.tsx` organization layout remains the outer shell.

Shared organization header behavior:

- Keep `SidebarProvider`, `AppSidebar`, `SidebarInset`, `SidebarTrigger`, and `Outlet` as the outer structure.
- Remove the org name and slug block from the shared header because that identity already appears in `AppSidebar`.
- Do not add root content padding around `Outlet`; pages opt into padding with `PageContent`.
- Desktop shared header renders `SidebarTrigger` and `Breadcrumbs`.
- Mobile shared header renders `SidebarTrigger`, current page title, primary action, and secondary action menu.
- Dashboard and other one-level pages still show a single current crumb, such as a dashboard icon plus `Dashboard`.

## Breadcrumbs

`Breadcrumbs` reads active route matches with TanStack Router.

Responsibilities:

- Derive crumbs from route matches that expose `breadcrumb` in route context.
- Ignore root document routes that are not user-visible workspace pages.
- Render desktop breadcrumbs with shadcn `Breadcrumb` primitives.
- Render links for ancestors and `BreadcrumbPage` for the current page.
- Support a single-crumb trail for dashboard-style routes.
- Keep breadcrumbs hidden on mobile.

Rules:

- Do not require each page to manually pass breadcrumb arrays.
- Do not duplicate org name or slug in breadcrumbs.
- Do not infer human labels from route IDs when a route is meant to be user-visible; add route metadata instead.
- Do not hardcode English labels inside `Breadcrumbs`.

## Page Actions

`PageActions` renders the `primaryAction` and `secondaryActions` consistently across desktop and mobile.

Desktop behavior:

- Render the primary action as a prominent shadcn `Button` when present.
- Render secondary actions inside a dropdown menu when any are present.
- Keep actions right-aligned in `PageHeader`.

Mobile behavior:

- Render the primary action in the shared header as a compact button.
- Prefer icon-only rendering when the action has an icon.
- Render secondary actions inside a compact dropdown menu.
- If no primary or secondary actions exist, render no action controls.

Rules:

- A route can have one primary action and many secondary actions.
- Do not support nested action dropdowns in v1.
- Do not implement generic import or export behavior in page shell components.
- Do not render disabled or permission-aware logic inside page shell components unless the `PageAction` contract is deliberately expanded later.
- Links must use TanStack Router `Link` when navigating internally.

## Page Header

`PageHeader` is the desktop page title area rendered inside `PageContent`.

Responsibilities:

- Render `title`, optional `description`, and page actions.
- Hide on mobile because the shared header already shows the current page title and actions.
- Keep title and actions aligned on desktop.
- Support page-level descriptions below the title.

Target API:

```tsx
<PageHeader
  title={t('orders.title')}
  description={t('orders.description')}
  primaryAction={{ label: t('orders.new'), icon: Plus, href: '/orders/new' }}
  secondaryActions={[
    { label: t('orders.import'), icon: Upload, href: '/orders/import' },
    { label: t('orders.export'), icon: Download },
  ]}
/>
```

Rules:

- Pages render `PageHeader` explicitly on desktop pages that need a title row.
- `PageHeader` should not render breadcrumbs.
- `PageHeader` should not fetch route metadata by default; route files and pages pass translated strings explicitly.
- `PageHeader` should not be used for compact card titles, modal titles, or form section titles.

## Page Content

`PageContent` is the standard content wrapper for most workspace pages.

Responsibilities:

- Render the actual `<main>` element for standard pages.
- Provide consistent max width, horizontal padding, vertical padding, and vertical rhythm.
- Keep workspace pages readable on wide monitors.

Default class behavior:

- `mx-auto`
- `max-w-7xl`
- `px-4 md:px-6`
- `py-6`
- `space-y-6`

Rules:

- The root organization layout must not add horizontal page padding around `Outlet`.
- Standard pages should use `PageContent`.
- Full-bleed pages such as kanban boards may skip `PageContent` and render directly into `Outlet`.
- `PageContent` should not auto-render `Breadcrumbs` or `PageHeader`.
- `PageContent` should accept `className` for page-specific spacing overrides.

## Empty State

`EmptyState` is a reusable no-content presentation component.

Responsibilities:

- Render a lucide icon, title, description, and optional action.
- Work inside cards, tables, forms, or standalone page content.
- Use shadcn `Button` for the optional action.

Target API:

```tsx
<EmptyState
  icon={ShoppingCart}
  title={t('orders.emptyTitle')}
  description={t('orders.emptyDescription')}
  action={{ label: t('orders.new'), href: '/orders/new' }}
/>
```

Rules:

- All visible text must be passed as already-translated strings.
- Do not hardcode English defaults.
- Do not use emoji.
- Do not add data fetching, permission checks, or feature-specific empty copy.

## Responsive Behavior

Desktop, `md` and above:

- Shared organization header shows `SidebarTrigger` and `Breadcrumbs`.
- Page content may show `PageHeader` with title, description, primary action, and secondary action menu.
- Page actions in the shared header are not shown on desktop.

Mobile, below `md`:

- Shared organization header shows `SidebarTrigger`, current page title, primary action, and secondary action menu.
- Breadcrumbs are hidden.
- `PageHeader` is hidden.
- Page content starts below the shared header.

Rules:

- Avoid horizontal breadcrumb truncation complexity on mobile by hiding breadcrumbs completely.
- Do not duplicate the current page title in both the shared mobile header and page content.
- Keep mobile action controls compact and reachable.

## Labels And I18n

All page shell labels must be passed as already-translated strings.

Do this:

```tsx
<PageHeader title={t('orders.title')} />
```

Do not do this:

```tsx
<PageHeader titleKey="orders.title" />
```

Rules:

- Page shell components must not import translation files or call translation hooks for feature labels.
- Page shell components may render non-feature accessibility labels only when those labels are passed in by callers or represented by shadcn primitives that already support accessible composition.
- Route metadata should use translated strings when metadata is rendered to users.

## Interaction With Data Table And Form Components

Page shell components provide the frame around feature surfaces.

Data table pages:

```tsx
<PageContent>
  <PageHeader title={title} primaryAction={primaryAction} />
  <DataTable {...tableProps} />
</PageContent>
```

Form pages:

```tsx
<PageContent>
  <PageHeader title={title} description={description} />
  <FormRoot form={form}>...</FormRoot>
</PageContent>
```

Rules:

- `PageListLayout` and `PageDetailLayout` are deferred.
- Application Data Table remains responsible for table toolbar, loading, empty, no-results, error, pagination, selection, and mobile cards.
- Application Form remains responsible for form sections, field grids, submit buttons, validation, and submit errors.
- Page shell components should not wrap or interpret data table props or form props.

## Out Of Scope For V1

- Nested action menus.
- Permission-aware action evaluation.
- Global command palette.
- Tab layout components.
- Detail/sidebar split layout components.
- Page-level loading skeleton orchestration.
- Sticky page headers.
- Route metadata code generation.
- Multiple independent page headers per route.
- Mobile breadcrumbs.
- Generic import, export, or confirmation behavior.

## First Implementation Plan

Implement the shared package in `src/components/app/page-shell/*`.

First adoption target should be the existing organization dashboard and `_org.tsx` layout:

- Add page shell exports.
- Add route metadata to the dashboard route.
- Replace the org name/slug block in `_org.tsx` header with desktop breadcrumbs and mobile page title/action rendering.
- Refactor the dashboard page to use `PageContent` and desktop `PageHeader` without changing dashboard behavior.
- Keep org identity visible in `AppSidebar`.
- Keep all user-facing strings translated through route/page code.

## Tests

Use Vitest and Testing Library.

Cover:

- Breadcrumb rendering from route metadata.
- Single-crumb dashboard rendering.
- Breadcrumbs hidden on mobile classes.
- `PageHeader` renders title, description, primary action, and secondary action menu.
- `PageHeader` uses desktop-only visibility classes.
- `PageContent` applies `max-w-7xl`, horizontal padding, and spacing defaults.
- `EmptyState` renders icon, title, description, and optional action.
- Mobile shared header renders current page title and actions from route metadata after `_org.tsx` integration.

Avoid visual snapshot tests for the first version.
