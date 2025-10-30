'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient, Expense } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import BudgetCard from '@/components/budget/BudgetCard'
import ExpenseChart from '@/components/charts/ExpenseChart'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { logger } from '@/lib/logger'
import { 
  PlusIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
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

interface Trip {
  id: string
  title: string
}

interface BudgetFormData {
  name: string
  total_amount: string
  currency: string
  category: string
  trip_id: string
  start_date: string
  end_date: string
  description: string
}

export default function BudgetPage() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTrip, setSelectedTrip] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    total_amount: '',
    currency: 'USD',
    category: '',
    trip_id: '',
    start_date: '',
    end_date: '',
    description: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const categories = [
    { value: 'travel', label: 'Viaje General' },
    { value: 'accommodation', label: 'Alojamiento' },
    { value: 'food', label: 'Comida' },
    { value: 'transport', label: 'Transporte' },
    { value: 'entertainment', label: 'Entretenimiento' },
    { value: 'shopping', label: 'Compras' },
    { value: 'other', label: 'Otros' },
  ]

  const currencies = [
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - Libra Esterlina' },
    { value: 'JPY', label: 'JPY - Yen Japonés' },
    { value: 'CAD', label: 'CAD - Dólar Canadiense' },
    { value: 'AUD', label: 'AUD - Dólar Australiano' },
    { value: 'CHF', label: 'CHF - Franco Suizo' },
    { value: 'CNY', label: 'CNY - Yuan Chino' },
  ]

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      const supabase = createSupabaseClient()

      // Load budgets with trip information
      const budgetsQuery = supabase
        .from('budgets')
        .select(`
          *,
          trips:trip_id (
            id,
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      const { data: budgetsData, error: budgetsError } = await (signal ? budgetsQuery.abortSignal(signal) : budgetsQuery)

      if (budgetsError) throw budgetsError

      // Load trips for form
      const tripsQuery = supabase
        .from('trips')
        .select('id, title, user_id, origin, destination, departure_date, return_date, budget, status, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('title')

      const { data: tripsData, error: tripsError } = await (signal ? tripsQuery.abortSignal(signal) : tripsQuery)

      if (tripsError) throw tripsError

      // Load expenses for calculations
      const expensesQuery = supabase
        .from('expenses')
        .select('id, user_id, title, amount, currency, category, date, trip_id, description, receipt_url, created_at, updated_at')
        .eq('user_id', user?.id)

      const { data: expensesData, error: expensesError } = await (signal ? expensesQuery.abortSignal(signal) : expensesQuery)

      if (expensesError) throw expensesError

      // Calculate spent amounts for each budget
      const budgetsWithSpent = budgetsData?.map(budget => {
        const budgetExpenses = expensesData?.filter(expense => {
          const expenseDate = new Date(expense.date)
          const budgetStart = new Date(budget.start_date)
          const budgetEnd = new Date(budget.end_date)
          
          const dateInRange = expenseDate >= budgetStart && expenseDate <= budgetEnd
          const categoryMatch = budget.category === 'travel' || expense.category === budget.category
          const tripMatch = !budget.trip_id || expense.trip_id === budget.trip_id
          
          return dateInRange && categoryMatch && tripMatch && expense.currency === budget.currency
        }) || []

        const spentAmount = budgetExpenses.reduce((sum, expense) => sum + expense.amount, 0)

        return {
          ...budget,
          spent_amount: spentAmount,
          trip_title: budget.trips?.title || null,
        }
      }) || []

      setBudgets(budgetsWithSpent)
      setTrips(tripsData || [])
      setExpenses(expensesData || [])
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      logger.error('BudgetPage: Error loading data', { error: msg })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const controller = new AbortController()
      loadData(controller.signal)
      return () => controller.abort()
    } else {
      // Evitar spinner infinito cuando no hay usuario
      setLoading(false)
    }
  }, [user, loadData])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">Inicia sesión para gestionar tus presupuestos</h3>
          <p className="mt-1 text-sm text-gray-500">La sección de presupuesto requiere autenticación.</p>
          <Button className="mt-4" onClick={() => (window.location.href = '/login')}>Ir a Login</Button>
        </div>
      </DashboardLayout>
    )
  }

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || budget.category === selectedCategory
    const matchesTrip = !selectedTrip || budget.trip_id === selectedTrip
    
    return matchesSearch && matchesCategory && matchesTrip
  })

  const handleCreateBudget = () => {
    setEditingBudget(null)
    setFormData({
      name: '',
      total_amount: '',
      currency: 'USD',
      category: '',
      trip_id: '',
      start_date: '',
      end_date: '',
      description: '',
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      name: budget.name,
      total_amount: budget.total_amount.toString(),
      currency: budget.currency,
      category: budget.category,
      trip_id: budget.trip_id || '',
      start_date: budget.start_date,
      end_date: budget.end_date,
      description: budget.description || '',
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido'
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      errors.total_amount = 'El monto debe ser mayor a 0'
    }

    if (!formData.category) {
      errors.category = 'La categoría es requerida'
    }

    if (!formData.start_date) {
      errors.start_date = 'La fecha de inicio es requerida'
    }

    if (!formData.end_date) {
      errors.end_date = 'La fecha de fin es requerida'
    }

    if (formData.start_date && formData.end_date && 
        new Date(formData.start_date) >= new Date(formData.end_date)) {
      errors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setSubmitting(true)
      const supabase = createSupabaseClient()

      const budgetData = {
        name: formData.name.trim(),
        total_amount: parseFloat(formData.total_amount),
        currency: formData.currency,
        category: formData.category,
        trip_id: formData.trip_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description.trim() || null,
        user_id: user?.id,
      }

      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', editingBudget.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([budgetData])

        if (error) throw error
      }

      setShowCreateModal(false)
      loadData()
    } catch (error) {
      console.error('Error saving budget:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  // Calculate statistics
  const totalBudgets = budgets.length
  const totalBudgetAmount = budgets.reduce((sum, budget) => sum + budget.total_amount, 0)
  const totalSpentAmount = budgets.reduce((sum, budget) => sum + budget.spent_amount, 0)
  const overBudgetCount = budgets.filter(budget => budget.spent_amount > budget.total_amount).length
  const nearLimitCount = budgets.filter(budget => {
    const percentage = budget.total_amount > 0 ? (budget.spent_amount / budget.total_amount) * 100 : 0
    return percentage >= 80 && budget.spent_amount <= budget.total_amount
  }).length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Presupuestos</h1>
            <p className="text-gray-600">Controla tus gastos y mantén tus finanzas organizadas</p>
          </div>
          <Button onClick={handleCreateBudget} className="flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>Nuevo Presupuesto</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Presupuestos</p>
                <p className="text-2xl font-bold text-gray-900">{totalBudgets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Presupuesto Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalBudgetAmount, 'USD')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Gastado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalSpentAmount, 'USD')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Alertas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overBudgetCount + nearLimitCount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart 
              expenses={expenses} 
              type="category" 
              title="Gastos por Categoría"
            />
            <ExpenseChart 
              expenses={expenses} 
              type="timeline" 
              title="Tendencia de Gastos"
            />
          </div>
        )}

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar presupuestos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedTrip}
              onChange={(e) => setSelectedTrip(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los viajes</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-500 flex items-center">
              {filteredBudgets.length} de {budgets.length} presupuestos
            </div>
          </div>
        </Card>

        {/* Budget List */}
        {filteredBudgets.length === 0 ? (
          <Card className="p-12 text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {budgets.length === 0 ? 'No tienes presupuestos' : 'No se encontraron presupuestos'}
            </h3>
            <p className="text-gray-500 mb-6">
              {budgets.length === 0 
                ? 'Crea tu primer presupuesto para comenzar a controlar tus gastos'
                : 'Intenta ajustar los filtros para encontrar lo que buscas'
              }
            </p>
            {budgets.length === 0 && (
              <Button onClick={handleCreateBudget}>
                Crear Presupuesto
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={handleEditBudget}
                onDelete={handleDeleteBudget}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Budget Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Presupuesto *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Vacaciones en Europa"
                error={formErrors.name}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Total *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  placeholder="0.00"
                  error={formErrors.total_amount}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Viaje Asociado
                </label>
                <select
                  value={formData.trip_id}
                  onChange={(e) => setFormData({ ...formData, trip_id: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Sin viaje específico</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  error={formErrors.start_date}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin *
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  error={formErrors.end_date}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Descripción opcional del presupuesto..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                {editingBudget ? 'Actualizar' : 'Crear'} Presupuesto
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}