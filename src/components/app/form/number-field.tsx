import { Input } from '#/components/ui/input'
import { useFieldContext } from './form-context'
import type { FieldProps, NumberFieldCallbacks } from './form-fields-shared'
import { firstError, formatNumber, stripNumberFormatting } from './form-utils'

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
  const error = firstError(field.state.meta.errors)
  const displayValue = field.state.value
    ? formatNumber(field.state.value)
    : field.state.value

  return (
    <div data-invalid={!!error}>
      {label && (
        <label htmlFor={field.name} className="text-sm font-medium">
          {label}
          {optional && optionalLabel && (
            <span className="text-muted-foreground font-normal">
              {optionalLabel}
            </span>
          )}
        </label>
      )}
      <div className="mt-1">
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
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  )
}
