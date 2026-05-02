import { XIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'use-intl'
import { Button } from '#/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command'
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Textarea } from '#/components/ui/textarea'
import type { BiteshipArea } from '#/features/address/model'
import { searchAreas } from '#/features/address/model'
import { useFieldContext } from './form-context'
import {
  firstError,
  formatNumber,
  formatPhone,
  stripNonDigits,
  stripNumberFormatting,
} from './form-utils'

export type FieldProps = {
  label?: string
  placeholder?: string
  optional?: boolean
  optionalLabel?: string
  disabled?: boolean
  autoComplete?: string
}

export type SelectOption = { value: string; label: string }

export type NumberFieldCallbacks = {
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

export type AreaSearchFieldProps = FieldProps & {
  value: BiteshipArea | null
  onChange: (area: BiteshipArea | null) => void
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

export function AreaSearchField({
  label,
  placeholder,
  optional,
  optionalLabel,
  disabled,
  value,
  onChange,
}: AreaSearchFieldProps) {
  const field = useFieldContext<string>()
  const error = firstError(field.state.meta.errors)
  const t = useTranslations('address')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BiteshipArea[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function handleSearch(searchQuery: string) {
    setQuery(searchQuery)
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const areas = await searchAreas(searchQuery)
      setResults(areas)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSelect(areaId: string) {
    const area = results.find((a) => a.id === areaId) ?? null
    onChange(area)
    setQuery('')
    setResults([])
    setOpen(false)
    field.handleBlur()
  }

  function handleClear() {
    onChange(null)
    setQuery('')
    setResults([])
    field.handleBlur()
  }

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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
              disabled={disabled}
            >
              {value ? (
                <span className="truncate">{value.name}</span>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder ?? t('areaSearchPlaceholder')}
                </span>
              )}
              <XIcon
                className="size-4 opacity-50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={t('areaSearchPlaceholder')}
                value={query}
                onValueChange={handleSearch}
              />
              <CommandList>
                {isLoading && (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    ...
                  </div>
                )}
                {!isLoading && query && results.length === 0 && (
                  <CommandEmpty>{t('noResults')}</CommandEmpty>
                )}
                <CommandGroup>
                  {results.map((area) => (
                    <CommandItem
                      key={area.id}
                      value={area.id}
                      onSelect={handleSelect}
                    >
                      <div className="flex flex-col">
                        <span>{area.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {area.area}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && <FieldError>{error}</FieldError>}
      </FieldContent>
    </Field>
  )
}
