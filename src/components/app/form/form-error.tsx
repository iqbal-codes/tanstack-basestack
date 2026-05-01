import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '#/components/ui/alert'

type FormErrorProps = {
  message?: string | null
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
