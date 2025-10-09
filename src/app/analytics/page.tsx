'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Trip, Expense } from '@/lib/supabase'
import { createSupabaseClient } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ExpenseChart from '@/components/charts/ExpenseChart'
import TripChart from '@/components/charts/TripChart'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface Budget {
  id: string
  name: string
  total_amount: number
  spent_amount: number
  currency: string
  category: string
}

interface AnalyticsData {
  totalTrips: number
  totalExpenses: number
  totalBudgets: number
  averageExpensePerTrip: number
  mostExpensiveCategory: string
  mostVisitedDestination: string
  monthlyTrend: 'up' | 'down' | 'stable'
  budgetUtilization: number
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('all')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')

  const dateRanges = [
    { value: 'all', label: 'Todo el tiempo' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 3 meses' },
    { value: '365', label: 'Último año' },
  ]

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']

  const calculateAnalytics = useCallback((tripsData: Trip[], expensesData: Expense[], budgetsData: Budget[]) => {
    // Filter expenses by selected currency
    const filteredExpenses = expensesData.filter(expense => expense.currency === selectedCurrency)

    // Total calculations
    const totalTrips = tripsData.length
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalBudgets = budgetsData.reduce((sum, budget) => 
      budget.currency === selectedCurrency ? sum + budget.total_amount : sum, 0)

    // Average expense per trip
    const averageExpensePerTrip = totalTrips > 0 ? totalExpenses / totalTrips : 0

    // Most expensive category
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    const mostExpensiveCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    // Most visited destination
    const destinationCounts = tripsData.reduce((acc, trip) => {
      const destination = trip.destination || 'Desconocido'
      acc[destination] = (acc[destination] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostVisitedDestination = Object.entries(destinationCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    // Monthly trend (comparing last 2 months)
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

    const lastMonthExpenses = filteredExpenses
      .filter(expense => new Date(expense.date) >= lastMonth)
      .reduce((sum, expense) => sum + expense.amount, 0)

    const twoMonthsAgoExpenses = filteredExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= twoMonthsAgo && expenseDate < lastMonth
      })
      .reduce((sum, expense) => sum + expense.amount, 0)

    let monthlyTrend: 'up' | 'down' | 'stable' = 'stable'
    if (lastMonthExpenses > twoMonthsAgoExpenses * 1.1) {
      monthlyTrend = 'up'
    } else if (lastMonthExpenses < twoMonthsAgoExpenses * 0.9) {
      monthlyTrend = 'down'
    }

    // Budget utilization
    const totalSpent = budgetsData.reduce((sum, budget) => 
      budget.currency === selectedCurrency ? sum + budget.spent_amount : sum, 0)
    const budgetUtilization = totalBudgets > 0 ? (totalSpent / totalBudgets) * 100 : 0

    setAnalytics({
      totalTrips,
      totalExpenses,
      totalBudgets: budgetsData.length,
      averageExpensePerTrip,
      mostExpensiveCategory,
      mostVisitedDestination,
      monthlyTrend,
      budgetUtilization,
    })
  }, [selectedCurrency])

  const loadData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const supabase = createSupabaseClient()
      
      // Load trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (tripsError) throw tripsError

      // Load expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (expensesError) throw expensesError

      // Load budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (budgetsError) throw budgetsError
      
      setTrips(tripsData || [])
      setExpenses(expensesData || [])
      setBudgets(budgetsData || [])
      
      calculateAnalytics(tripsData || [], expensesData || [], budgetsData || [])
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, calculateAnalytics])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, loadData])

  const exportData = async () => {
    try {
      const data = {
        trips,
        expenses: expenses.filter(expense => expense.currency === selectedCurrency),
        budgets: budgets.filter(budget => budget.currency === selectedCurrency),
        analytics,
        exportDate: new Date().toISOString(),
        dateRange,
        currency: selectedCurrency,
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `travel-analytics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      accommodation: 'Alojamiento',
      food: 'Comida',
      transport: 'Transporte',
      entertainment: 'Entretenimiento',
      shopping: 'Compras',
      other: 'Otros',
    }
    return names[category] || category
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Análisis y Reportes</h1>
            <p className="text-gray-600">Insights detallados sobre tus viajes y gastos</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={exportData}
              className="flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>Exportar Datos</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>

            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapPinIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Viajes</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalTrips}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Gastos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.totalExpenses, selectedCurrency)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Promedio por Viaje</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.averageExpensePerTrip, selectedCurrency)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {analytics.monthlyTrend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-8 w-8 text-red-600" />
                  ) : analytics.monthlyTrend === 'down' ? (
                    <ArrowTrendingDownIcon className="h-8 w-8 text-green-600" />
                  ) : (
                    <CalendarIcon className="h-8 w-8 text-gray-600" />
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tendencia Mensual</p>
                  <p className={`text-2xl font-bold ${
                    analytics.monthlyTrend === 'up' ? 'text-red-600' :
                    analytics.monthlyTrend === 'down' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {analytics.monthlyTrend === 'up' ? '↗ Subiendo' :
                     analytics.monthlyTrend === 'down' ? '↘ Bajando' :
                     '→ Estable'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Insights Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Categoría Más Costosa</h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {getCategoryName(analytics.mostExpensiveCategory)}
                </p>
                <p className="text-sm text-gray-500">
                  Donde más gastas en tus viajes
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Destino Favorito</h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {analytics.mostVisitedDestination}
                </p>
                <p className="text-sm text-gray-500">
                  Tu destino más visitado
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uso de Presupuesto</h3>
              <div className="text-center">
                <p className={`text-3xl font-bold mb-2 ${
                  analytics.budgetUtilization > 100 ? 'text-red-600' :
                  analytics.budgetUtilization > 80 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {analytics.budgetUtilization.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  Utilización promedio del presupuesto
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {expenses.length > 0 && (
            <>
              <ExpenseChart 
                expenses={expenses.filter(expense => expense.currency === selectedCurrency)} 
                type="category" 
                title="Distribución de Gastos por Categoría"
              />
              <ExpenseChart 
                expenses={expenses.filter(expense => expense.currency === selectedCurrency)} 
                type="timeline" 
                title="Tendencia de Gastos en el Tiempo"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {trips.length > 0 && (
            <>
              <TripChart 
                trips={trips} 
                type="status" 
                title="Estado de los Viajes"
              />
              <TripChart 
                trips={trips} 
                type="destinations" 
                title="Destinos Más Visitados"
              />
            </>
          )}
        </div>

        {trips.length > 0 && (
          <TripChart 
            trips={trips} 
            type="timeline" 
            title="Cronología de Viajes"
            height={200}
          />
        )}

        {/* No Data State */}
        {(!trips.length && !expenses.length) && (
          <Card className="p-12 text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay datos suficientes
            </h3>
            <p className="text-gray-500 mb-6">
              Crea algunos viajes y registra gastos para ver análisis detallados
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}