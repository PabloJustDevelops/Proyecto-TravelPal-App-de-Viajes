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
      <ExclamationTriangleIcon className="mb-4 h-12 w-12 text-red-500" />
      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-4 text-gray-500 dark:text-gray-400">{message}</p>
      {onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
    </div>
  )
}
