import { useDebouncedCallback } from '@tanstack/react-pacer'
import { useEffect, useRef, useState } from 'react'
import { Input } from '#/components/ui/input'

type DataTableSearchProps = {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  debounceMs?: number
}

export function DataTableSearch({
  placeholder,
  value,
  onChange,
  debounceMs = 300,
}: DataTableSearchProps) {
  const [draft, setDraft] = useState(value)
  const prevValue = useRef(value)

  const debouncedOnChange = useDebouncedCallback(
    (val: string) => {
      onChange(val)
    },
    { wait: debounceMs },
  )

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value
      setDraft(value)
    }
  }, [value])

  return (
    <Input
      placeholder={placeholder}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        debouncedOnChange(e.target.value)
      }}
      onBlur={() => {
        if (draft !== value) onChange(draft)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && draft !== value) onChange(draft)
      }}
    />
  )
}
