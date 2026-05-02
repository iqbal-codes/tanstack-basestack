import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { useFieldContext } from './form-context'
import type { FieldProps, SelectOption } from './form-fields-shared'
import { firstError } from './form-utils'

export function SelectField({
  label,
  placeholder,
  optional,
  optionalLabel,
  disabled,
  options,
}: FieldProps & { options: SelectOption[] }) {
  const field = useFieldContext<string>()
  const error = firstError(field.state.meta.errors)

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
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  )
}
