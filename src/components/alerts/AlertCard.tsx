'use client'

import { Alert } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface AlertCardProps {
  alert: Alert
  onMarkAsRead?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  showActions?: boolean
  isLoading?: boolean
}

export default function AlertCard({ 
  alert, 
  onMarkAsRead, 
  onDismiss, 
  showActions = true,
  isLoading = false,
}: AlertCardProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5" />
      case 'success':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'error':
        return <XCircleIcon className="h-5 w-5" />
      case 'reminder':
        return <ClockIcon className="h-5 w-5" />
      default:
        return <InformationCircleIcon className="h-5 w-5" />
    }
  }

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          text: 'text-yellow-700',
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          text: 'text-blue-700',
        }
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          title: 'text-green-800',
          text: 'text-green-700',
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          text: 'text-red-700',
        }
      case 'reminder':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          title: 'text-purple-800',
          text: 'text-purple-700',
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          text: 'text-gray-700',
        }
    }
  }

  const getAlertTypeName = (type: string) => {
    const names: Record<string, string> = {
      warning: 'Advertencia',
      info: 'Información',
      success: 'Éxito',
      error: 'Error',
      reminder: 'Recordatorio',
    }
    return names[type] || 'Notificación'
  }

  const colors = getAlertColors(alert.type)

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        colors.bg,
        colors.border,
        !alert.is_read && 'ring-2 ring-blue-500 ring-opacity-20'
      )}
    >
      <div className="flex items-start">
        <div className={cn('flex-shrink-0', colors.icon)}>
          {getAlertIcon(alert.type)}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={cn('text-sm font-medium', colors.title)}>
                {alert.title}
              </h3>
              
              <div className={cn('mt-1 text-sm', colors.text)}>
                {alert.message}
              </div>
              
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>{getAlertTypeName(alert.type)}</span>
                <span>•</span>
                <span>{formatDate(alert.created_at)}</span>
                {!alert.is_read && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-blue-600">No leída</span>
                  </>
                )}
              </div>
            </div>

            {showActions && onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Descartar alerta"
                disabled={isLoading}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {showActions && !alert.is_read && onMarkAsRead && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onMarkAsRead(alert.id)}
                className={cn(
                  'text-xs font-medium hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  colors.title
                )}
                disabled={isLoading}
              >
                Marcar como leída
              </button>
              {isLoading && (
                <span className="text-xs text-gray-400">Procesando...</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}