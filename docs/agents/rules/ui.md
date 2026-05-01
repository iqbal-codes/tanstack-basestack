# UI Rules

## Purpose

Controls UI component composition, widget library usage, form implementation, and URL search-param handling.

## When To Read This

- Building a new route page or layout.
- Adding or editing a form.
- Adding search/filter query parameters to a route.
- Reviewing a UI component for shadcn/ui compliance.

## Current Project Pattern

**Component library:** shadcn/ui (New York style) configured in `components.json`. All shadcn primitives live in `src/components/ui/`. Icon library is `lucide-react`.

**App-level components:** Reusable patterns in `src/components/app/`:
- `page-shell/` — `PageHeader`, `PageContent`, `PageActions`, `EmptyState`, `Breadcrumbs` with `src/components/app/page-shell/page-shell-types.ts`
- `form/` — `FormRoot`, `FormSection`, `FormGrid`, `FormActions`, field components (`TextField`, `EmailField`, `PasswordField`, `TextareaField`, `SelectField`, `NumberField`, `PhoneField`), `SubmitButton`, `FormError`
- `data-table/` — `DataTable` wrapper around `@tanstack/react-table`, with search, pagination, toolbar, view options, mobile cards

**Forms:** Uses TanStack Form via `useAppForm` from `src/components/app/form/form-context.tsx`. The hook `useAppForm` is created with `createFormHook` and registers project-specific field components and form components. Example usage pattern:

```tsx
const form = useAppForm({
  defaultValues: { name: '' },
  onSubmit: async ({ value }) => { /* ... */ },
})

// In JSX:
<form.AppField name="name">
  {(field) => <field.TextField label={t('name')} />}
</form.AppField>
<form.AppForm>
  <form.SubmitButton>{t('save')}</form.SubmitButton>
</form.AppForm>
```

Field components use shadcn `Input`, `Textarea`, or `NativeSelect` and are built on shadcn `Field`, `FieldContent`, `FieldLabel`, `FieldError` from `src/components/ui/field.tsx`.

**URL search params:** The `NuqsAdapter` is registered at root in `src/routes/__root.tsx:57`. Routes use `useQueryState` and `parseAsString` from `nuqs` — see `src/routes/_org/products/index.tsx:39` and `src/routes/_org/customers/index.tsx:36`.

## Non-Negotiable Rules

- MUST use shadcn/ui primitives for all UI elements where a shadcn component exists. MUST NOT use raw HTML `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<dialog>`, `<label>` standalone. Use `Button`, `Input`, `NativeSelect`, `Textarea`, `Table`, `Dialog`, `Label` from `#/components/ui/*`.
- MUST use `useAppForm` from `#/components/app/form` for all form state management. MUST NOT use raw `useState` for form field values or validation errors.
- MUST wrap form fields in `form.AppField` with the field component from `#/components/app/form`.
- MUST use `nuqs` (`useQueryState`, `parseAsString`, etc.) for any URL search parameter state. MUST NOT use raw `useSearchParams` or manual `window.location.search` parsing.
- MUST NOT use `console.log` on user-facing pages. (Legacy exception: `src/lib/auth.ts:91` invitation placeholder.)
- MUST NOT use emoji or non-Lucide icon libraries. All icons come from `lucide-react`.
- MUST use `Button asChild` pattern when wrapping a `Link` component in a `Button` (e.g. `src/components/not-found.tsx:21-23`).
- MUST use `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` instead of raw `<div>` with heading/text for card layouts.
- MUST use `SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger` from `#/components/ui/sidebar` for workspace sidebar layout.
- Page layout MUST use `PageContent` and `PageHeader` from `#/components/app/page-shell/` for workspace pages.
- Data lists MUST use `DataTable` from `#/components/app/data-table` instead of building raw `<table>` markup.

## Allowed Exceptions

- `useState` for local UI state (toolbar toggle state, sidebar open state, debounced input draft, submission error display) is allowed — these are not form field values.
- `src/features/admin/model.ts` contains hardcoded demo admin data — this is legacy seed data and must not be treated as a UI pattern.

## Implementation Checklist

1. Check whether a shadcn/ui component already exists before writing any raw HTML element.
2. Use `useAppForm` and wrap all fields in `form.AppField`.
3. Use `useQueryState` for search params, not raw URL parsing.
4. Import from `#/components/app/page-shell` for page structure.
5. Use `DataTable` for any list with columns.
6. Ensure all user-visible strings use translations (see i18n rules).

## Verification

- Manual: Inspect the route page — every interactive element should map to a shadcn component.
- `bun run check` catches unused imports and formatting.
- TypeScript enforces typed `form.AppField` names and translation keys.

## Common Mistakes To Avoid

- Using `<input>` directly instead of `Input` when a text field is needed.
- Using `react-hook-form` or raw `useState` for forms — the project has standardized on `@tanstack/react-form` via `useAppForm`.
- Using `useSearchParams` from React Router — use `nuqs` `useQueryState` instead.
- Wrapping a `Link` in a `Button` without `asChild` — use `<Button asChild><Link to="...">...</Link></Button>`.
- Importing icons from anywhere other than `lucide-react`.
