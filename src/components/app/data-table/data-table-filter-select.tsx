import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'

type FilterOption = { value: string; label: string }

type DataTableFilterSelectProps = {
  label?: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function DataTableFilterSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
}: DataTableFilterSelectProps) {
  return (
    <NativeSelect
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
    >
      {placeholder && (
        <NativeSelectOption value="">{placeholder}</NativeSelectOption>
      )}
      {options.map((opt) => (
        <NativeSelectOption key={opt.value} value={opt.value}>
          {opt.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
