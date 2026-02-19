'use client'

import { useState } from 'react'
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface Budget {
  id: string
  name: string
  total_amount: number
  spent_amount: number
  currency: string
  category: string
  trip_id?: string
  trip_title?: string
  start_date: string
  end_date: string
  description?: string
  created_at: string
  updated_at: string
}

interface BudgetCardProps {
  budget: Budget
  onEdit?: (budget: Budget) => void
  onDelete?: (budgetId: string) => void
  showActions?: boolean
}

export default function BudgetCard({ 
  budget, 
  onEdit, 
  onDelete, 
  showActions = true 
}: BudgetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const spentPercentage = budget.total_amount > 0 
    ? (budget.spent_amount / budget.total_amount) * 100 
    : 0
  
  const remainingAmount = budget.total_amount - budget.spent_amount
  const isOverBudget = budget.spent_amount > budget.total_amount
  const isNearLimit = spentPercentage >= 80 && !isOverBudget

  const getStatusColor = () => {
    if (isOverBudget) return 'text-red-600'
    if (isNearLimit) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusIcon = () => {
    if (isOverBudget) return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
    if (isNearLimit) return <ArrowTrendingUpIcon className="h-5 w-5 text-yellow-500" />
    return <CheckCircleIcon className="h-5 w-5 text-green-500" />
  }

  const getProgressBarColor = () => {
    if (isOverBudget) return 'bg-red-500'
    if (isNearLimit) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactElement> = {
      travel: <CurrencyDollarIcon className="h-5 w-5" />,
      accommodation: <CurrencyDollarIcon className="h-5 w-5" />,
      food: <CurrencyDollarIcon className="h-5 w-5" />,
      transport: <CurrencyDollarIcon className="h-5 w-5" />,
      entertainment: <CurrencyDollarIcon className="h-5 w-5" />,
      shopping: <CurrencyDollarIcon className="h-5 w-5" />,
      other: <CurrencyDollarIcon className="h-5 w-5" />,
    }
    return icons[category] || <CurrencyDollarIcon className="h-5 w-5" />
  }

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      travel: 'Viaje',
      accommodation: 'Alojamiento',
      food: 'Comida',
      transport: 'Transporte',
      entertainment: 'Entretenimiento',
      shopping: 'Compras',
      other: 'Otros',
    }
    return names[category] || category
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysRemaining = () => {
    const endDate = new Date(budget.end_date)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                {getCategoryIcon(budget.category)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {budget.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getCategoryName(budget.category)}
                </span>
                {budget.trip_title && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 truncate">
                      {budget.trip_title}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            {showActions && (
              <div className="flex items-center space-x-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(budget)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(budget.id)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Budget Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Gastado: {formatCurrency(budget.spent_amount, budget.currency)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {spentPercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Presupuesto: {formatCurrency(budget.total_amount, budget.currency)}
            </span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {isOverBudget ? 'Excedido por' : 'Restante'}: {' '}
              {formatCurrency(Math.abs(remainingAmount), budget.currency)}
            </span>
          </div>
        </div>

        {/* Period and Status */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>
            {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
          </span>
          <span className={daysRemaining > 0 ? 'text-gray-600 dark:text-gray-300' : 'text-red-600 dark:text-red-400'}>
            {daysRemaining > 0 
              ? `${daysRemaining} días restantes`
              : daysRemaining === 0 
                ? 'Termina hoy'
                : `Terminó hace ${Math.abs(daysRemaining)} días`
            }
          </span>
        </div>

        {/* Expandable Description */}
        {budget.description && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {isExpanded ? 'Ocultar descripción' : 'Ver descripción'}
            </button>
            {isExpanded && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {budget.description}
              </p>
            )}
          </div>
        )}

        {/* Status Alerts */}
        {(isOverBudget || isNearLimit) && (
          <div className={`mt-4 p-3 rounded-lg ${
            isOverBudget 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-center">
              {isOverBudget ? (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
              ) : (
                <ArrowTrendingUpIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2" />
              )}
              <span className={`text-sm font-medium ${
                isOverBudget ? 'text-red-800 dark:text-red-300' : 'text-yellow-800 dark:text-yellow-300'
              }`}>
                {isOverBudget 
                  ? '¡Presupuesto excedido!'
                  : '¡Cerca del límite del presupuesto!'
                }
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              isOverBudget ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'
            }`}>
              {isOverBudget 
                ? `Has gastado ${formatCurrency(budget.spent_amount - budget.total_amount, budget.currency)} más de lo presupuestado.`
                : `Has gastado el ${spentPercentage.toFixed(1)}% de tu presupuesto.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}