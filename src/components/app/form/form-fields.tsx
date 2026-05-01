import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { Textarea } from '#/components/ui/textarea'
import { useFieldContext } from './form-context'
import {
  firstError,
  formatNumber,
  formatPhone,
  stripNonDigits,
  stripNumberFormatting,
} from './form-utils'

type FieldProps = {
  label?: string
  placeholder?: string
  optional?: boolean
  optionalLabel?: string
  disabled?: boolean
  autoComplete?: string
}

type SelectOption = { value: string; label: string }

type NumberFieldCallbacks = {
  onValueChange?: (params: {
    rawValue: string
    displayValue: string
    field: ReturnType<typeof useFieldContext<string>>
  }) => void
  onBlurValue?: (params: {
    rawValue: string
    displayValue: string
    field: ReturnType<typeof useFieldContext<string>>
  }) => void
}

function BaseField({
  children,
  label,
  optional,
  optionalLabel,
}: FieldProps & { children: React.ReactNode }) {
  const field = useFieldContext<string>()
  const error = firstError(field.state.meta.errors)

  return (
    <Field data-invalid={!!error}>
      {label && (
        <FieldLabel htmlFor={field.name}>
          {label}
          {optional && optionalLabel && (
            <span className="text-muted-foreground font-normal">
              {optionalLabel}
            </span>
          )}
        </FieldLabel>
      )}
      <FieldContent>
        {children}
        {error && <FieldError>{error}</FieldError>}
      </FieldContent>
    </Field>
  )
}

export function TextField({
  label,
  placeholder,
  optional,
  optionalLabel,
  disabled,
  autoComplete,
}: FieldProps) {
  const field = useFieldContext<string>()

  return (
    <BaseField label={label} optional={optional} optionalLabel={optionalLabel}>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
      />
    </BaseField>
  )
}

export function EmailField({
  label,
  placeholder,
  optional,
  optionalLabel,
  disabled,
  autoComplete = 'email',
}: FieldProps) {
  const field = useFieldContext<string>()

  return (
    <BaseField label={label} optional={optional} optionalLabel={optionalLabel}>
      <Input
        id={field.name}
        name={field.name}
        type="email"
        autoComplete={autoComplete}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
    </BaseField>
  )
}

export function PasswordField({
  label,
  placeholder,
  optional,
  optionalLabel,
  disabled,
  autoComplete = 'current-password',
}: FieldProps) {
  const field = useFieldContext<string>()

  return (
    <BaseField label={label} optional={optional} optionalLabel={optionalLabel}>
      <Input
        id={field.name}
        name={field.name}
        type="password"
        autoComplete={autoComplete}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
    </BaseField>
  )
}

export function TextareaField({
  label,
  placeholder,
  optional,
  optionalLabel,
  disabled,
  autoComplete,
}: FieldProps) {
  const field = useFieldContext<string>()

  return (
    <BaseField label={label} optional={optional} optionalLabel={optionalLabel}>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
      />
    </BaseField>
  )
}

export function SelectField({
  label,
  placeholder,
  optional,
  optionalLabel,
  disabled,
  options,
}: FieldProps & { options: SelectOption[] }) {
  const field = useFieldContext<string>()

  return (
    <BaseField label={label} optional={optional} optionalLabel={optionalLabel}>
      <NativeSelect
        id={field.name}
        name={field.name}
        value={field.state.value || ''}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        disabled={disabled}
      >
        {placeholder && (
          <NativeSelectOption value="" disabled>
            {placeholder}
          </NativeSelectOption>
        )}
        {options.map((opt) => (
          <NativeSelectOption key={opt.value} value={opt.value}>
            {opt.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </BaseField>
  )
}

export function NumberField({
  label,
  placeholder,
  optional,
  optionalLabel,
  disabled,
  autoComplete,
  onValueChange,
  onBlurValue,
}: FieldProps & NumberFieldCallbacks) {
  const field = useFieldContext<string>()
  const displayValue = field.state.value
    ? formatNumber(field.state.value)
    : field.state.value

  return (
    <BaseField label={label} optional={optional} optionalLabel={optionalLabel}>
      <Input
        id={field.name}
        name={field.name}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => {
          const raw = stripNumberFormatting(e.target.value)
          field.handleChange(raw)
          onValueChange?.({
            rawValue: raw,
            displayValue: e.target.value,
            field,
          })
        }}
        onBlur={(e) => {
          field.handleBlur()
          const raw = stripNumberFormatting(e.target.value)
          const display = formatNumber(raw)
          onBlurValue?.({ rawValue: raw, displayValue: display, field })
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
      />
    </BaseField>
  )
}

export function PhoneField({
  label,
  placeholder,
  optional,
  optionalLabel,
  disabled,
  autoComplete = 'tel',
  onValueChange,
  onBlurValue,
}: FieldProps & NumberFieldCallbacks) {
  const field = useFieldContext<string>()
  const displayValue = field.state.value
    ? formatPhone(field.state.value)
    : field.state.value

  return (
    <BaseField label={label} optional={optional} optionalLabel={optionalLabel}>
      <Input
        id={field.name}
        name={field.name}
        type="tel"
        autoComplete={autoComplete}
        value={displayValue}
        onChange={(e) => {
          const raw = stripNonDigits(e.target.value)
          field.handleChange(raw)
          onValueChange?.({
            rawValue: raw,
            displayValue: e.target.value,
            field,
          })
        }}
        onBlur={(e) => {
          field.handleBlur()
          const raw = stripNonDigits(e.target.value)
          const display = formatPhone(raw)
          onBlurValue?.({ rawValue: raw, displayValue: display, field })
        }}
        placeholder={placeholder}
        disabled={disabled}
      />
    </BaseField>
  )
}
