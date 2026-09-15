import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Button from './Button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export default function ErrorState({
  title = 'Error al cargar los datos',
  message,
  onRetry,
  retryLabel = 'Reintentar',
}: ErrorStateProps) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <ExclamationTriangleIcon className="mb-4 h-12 w-12 text-danger" />
      <h3 className="mb-2 font-serif text-heading leading-snug text-ink">
        {title}
      </h3>
      <p className="mb-4 max-w-prose leading-reading text-muted">{message}</p>
      {onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
    </div>
  )
}
