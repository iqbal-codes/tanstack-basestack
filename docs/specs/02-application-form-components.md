# 02 - Application Form Components

> Project-wide reusable form components for Pabriq application screens, including internal workspace flows and public order/customer flows.

## Status

Proposed. This spec captures the agreed design before implementation.

## Scope

Application form components are reusable UI compositions built from TanStack Form and shadcn/ui primitives. They must not assume authentication, organization membership, subdomain state, route context, or a specific domain resource.

They are intended for:

- Internal workspace forms for owners, admins, members, and operators.
- Public order/customer forms accessed without login.
- Existing auth and onboarding forms once the adapter is implemented.

They are not intended to become a schema-driven form generator. Keep the first implementation compositional and thin.

## Directory

Use `src/components/app/form/*` for the application form layer. Keep `src/components/ui/*` reserved for shadcn/ui primitives.

```txt
src/components/app/form/
├── index.ts
├── form-root.tsx
├── form-context.tsx
├── form-fields.tsx
├── form-layout.tsx
├── form-utils.ts
└── form.test.tsx
```

## Architecture

Use TanStack Form's official `createFormHook` and context pattern.

- Export `useAppForm` from the form package.
- Use TanStack's field context for field components.
- Use TanStack's form context for form components such as `SubmitButton`.
- Use a small app form UI context only for cross-cutting UI behavior, such as `onAnyValueChange`.
- Do not store form values, validation state, or submit state in the app form UI context.

Example target API:

```tsx
const form = useAppForm({
  defaultValues: {
    customerName: '',
    phone: '',
    quantity: '',
    notes: '',
  } satisfies z.input<typeof schema>,
  validators: {
    onChange: schema,
  },
  onSubmit: async ({ value }) => {
    const parsed = schema.parse(value)
    await createOrder({ data: parsed })
  },
})

<FormRoot form={form} onAnyValueChange={() => setSubmitError(null)}>
  <FormSection title={t('customerDetails')}>
    <FormGrid>
      <form.AppField name="customerName">
        {(field) => <field.TextField label={t('customerName')} />}
      </form.AppField>

      <form.AppField name="phone">
        {(field) => <field.PhoneField label={t('phone')} />}
      </form.AppField>
    </FormGrid>
  </FormSection>

  <form.AppForm>
    <form.FormError message={submitError} />
    <FormActions>
      <form.SubmitButton>{t('save')}</form.SubmitButton>
    </FormActions>
  </form.AppForm>
</FormRoot>
```

## First Component Set

Field components:

- `TextField`
- `EmailField`
- `PasswordField`
- `TextareaField`
- `SelectField`
- `NumberField`
- `PhoneField`

Form components:

- `SubmitButton`
- `FormError`

Layout components:

- `FormRoot`
- `FormSection`
- `FormGrid`
- `FormActions`

Shared utilities:

- First-error normalization.
- Number formatting and digit normalization.
- Phone formatting and digit normalization.

Defer checkbox, radio, date, file, money, autocomplete, and combobox fields until a concrete form requires them.

## Validation

Use Zod-first validation at the form level.

```tsx
const schema = z.object({
  customerName: z.string().min(2, t('customerNameMin')),
  phone: z.string().min(10, t('phoneMin')),
  quantity: z.string().min(1, t('quantityRequired')),
})

const form = useAppForm({
  defaultValues: {
    customerName: '',
    phone: '',
    quantity: '',
  } satisfies z.input<typeof schema>,
  validators: {
    onChange: schema,
  },
  onSubmit: async ({ value }) => {
    const parsed = schema.parse(value)
    await saveOrder({ data: parsed })
  },
})
```

Rules:

- Normal validation belongs in Zod schemas.
- Field-level TanStack validators are allowed only for exceptional cases.
- Submit handlers must parse with the Zod schema before calling server functions.
- Field components must not own business validation.
- Field components may normalize input for masking.

## Error Behavior

Field errors:

- Show the first validation error only.
- Hide errors until the field has been touched.
- After touched, keep errors live while typing.

Form errors:

- Submit/server errors are owned by each page or feature form.
- `FormError` renders the provided message with shadcn `Alert`.
- `FormRoot` accepts `onAnyValueChange` so pages can clear stale submit errors when the user edits any field.
- Callback errors from custom field callbacks do not affect form validity.

## Labels And Text

All field labels, descriptions, placeholders, option labels, button labels, and error messages must be passed as already-translated strings.

Do this:

```tsx
<field.TextField label={t('customerName')} />
```

Do not do this:

```tsx
<field.TextField labelKey="customer.name" />
```

Optional fields use a muted suffix. Required fields show no marker.

```tsx
<field.TextField
  label={t('notes')}
  optional
  optionalLabel={t('optional')}
/>
```

Optional labels are controlled per field, not by `FormRoot`.

## Field Props

Fields should pass through normal control props while keeping TanStack Form handlers internal.

Allowed pass-through examples:

- `placeholder`
- `autoComplete`
- `disabled`
- `className`
- `rows` for textarea

Do not allow callers to replace these props:

- `value`
- `onChange`
- `onBlur`
- `name`

Those come from TanStack Form context.

## Custom Field Callbacks

Fields support additive callbacks for custom behavior.

```tsx
<field.NumberField
  label={t('quantity')}
  onValueChange={({ rawValue, displayValue, field }) => {
    field.form.setFieldValue('estimatedTotal', calculateEstimate(rawValue))
  }}
  onBlurValue={({ rawValue, displayValue, field }) => {
    trackQuantityBlur(rawValue)
  }}
/>
```

Rules:

- Internal field logic always calls `field.handleChange`.
- `onValueChange` runs after normalization and after form state update.
- `onBlurValue` runs after `field.handleBlur`.
- Callbacks may be synchronous or asynchronous.
- Field components must not await callback results.
- Callback errors are side-effect errors only and must not affect form validity.
- Validation errors must come from Zod or TanStack validators.
- Other fields may be updated through the provided `field.form` API for small form-local effects.

## Masked Values

Masked fields store raw canonical values in TanStack Form state. Display formatting is UI-only.

### `NumberField`

Default behavior:

- Locale: `id-ID`
- Display value: `5.000`
- Stored value: `'5000'`
- Empty value: `''`
- Stored type: string

The field strips non-digits before updating TanStack Form state. Do not store formatted punctuation in form values.

### `PhoneField`

Default behavior:

- Indonesia-first display grouping.
- Display value: `0888-0429-1032`.
- Stored value: `'088804291032'`.
- Strip non-digits immediately on change.
- Preserve local `08...` and international `62...` digits exactly as entered after normalization.
- Do not auto-convert `+62` to `08` in the first version.

## `SelectField`

The first version uses a simple options array.

```tsx
<field.SelectField
  label={t('status')}
  placeholder={t('selectStatus')}
  options={[
    { value: 'draft', label: t('draft') },
    { value: 'approved', label: t('approved') },
  ]}
/>
```

Behavior:

- Option shape is `{ value: string; label: string }`.
- Empty form value is `''`.
- Placeholder shows when the field value is empty.
- Zod decides whether empty is valid.

If a future select needs icons, grouped options, async search, or custom rendering, add a separate `ComboboxField` or enhance `SelectField` after the need is concrete.

## Layout Components

### `FormRoot`

Responsibilities:

- Render the actual `<form>` element.
- Handle `preventDefault` and `stopPropagation`.
- Call `form.handleSubmit()`.
- Provide the app form UI context for `onAnyValueChange`.
- Default class: `space-y-6`.
- Accept `className` for override.

### `FormSection`

Responsibilities:

- Group related inputs semantically.
- Use shadcn `FieldSet` and `FieldLegend`.
- Support `title`, `description`, and `titleHidden`.

### `FormGrid`

Responsibilities:

- Default to one column on mobile and two columns on desktop.
- Support `columns={1 | 2 | 3}`.
- Keep spacing consistent with shadcn `FieldGroup`.

### `FormActions`

Responsibilities:

- Support `align="end"` for internal admin forms.
- Support `align="stretch"` for public/mobile-first forms.
- Default to stretch on mobile and end on desktop.

## Submit UX

`SubmitButton` reads form state through TanStack Form context.

Responsibilities:

- Disable while the form cannot submit.
- Disable while submitting.
- Show a lucide spinner while submitting.
- Accept translated children for the label.
- Support shadcn `Button` props such as `variant`, `size`, and `className`.

Do not standardize success toasts or submit confirmation UX in this adapter. Public order flows and internal workspace flows may need different confirmation patterns.

## Adoption Plan

First implementation should:

- Add the adapter in `src/components/app/form/*`.
- Refactor `AuthForm` to use the adapter without changing behavior.
- Refactor onboarding organization creation to use the adapter without changing behavior.
- Keep all user-facing strings translated through feature/page code.

## Tests

Use Vitest and Testing Library.

Cover:

- `NumberField` stores raw digits and displays Indonesian thousands formatting.
- `PhoneField` stores raw digits and displays grouped formatting.
- `SubmitButton` disables when invalid or submitting.
- `FormRoot` submits through `form.handleSubmit`.

Avoid visual snapshot tests for the first version.

## Open Follow-Ups

- Data table design comes next, especially URL-backed search filters, import/export controls, pagination, and server-backed data loading.
- Decide later whether repeated CRUD forms justify a schema-driven form generator.
- Decide later whether public phone input should enforce or normalize Indonesian `+62` formatting.
