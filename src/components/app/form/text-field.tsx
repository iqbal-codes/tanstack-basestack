import { Input } from '#/components/ui/input'
import { useFieldContext } from './form-context'
import type { FieldProps } from './form-fields-shared'

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
    <div>
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
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
        />
      </div>
    </div>
  )
}
