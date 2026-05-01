import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '#/components/ui/button'
import { useFormContext } from './form-context'

type SubmitButtonProps = ComponentProps<typeof Button> & {
  children: string
}

export function SubmitButton({ children, ...props }: SubmitButtonProps) {
  const form = useFormContext()
  const isSubmitting = form.state.isSubmitting
  const canSubmit = form.state.canSubmit

  return (
    <Button type="submit" disabled={!canSubmit || isSubmitting} {...props}>
      {isSubmitting && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  )
}
