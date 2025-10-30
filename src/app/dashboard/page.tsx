'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient, Trip, Expense } from '@/lib/supabase'
import {
  MapIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DashboardStats {
  totalTrips: number
  upcomingTrips: number
  totalExpenses: number
  totalNotes: number
  recentTrips: Trip[]
  recentExpenses: Expense[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    upcomingTrips: 0,
    totalExpenses: 0,
    totalNotes: 0,
    recentTrips: [],
    recentExpenses: [],
  })
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async (signal?: AbortSignal) => {
    const supabase = createSupabaseClient()

    try {
      // Get trips stats
      const tripsQuery = supabase
        .from('trips')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      const { data: trips } = await (signal ? tripsQuery.abortSignal(signal) : tripsQuery)

      const now = new Date()
      const upcomingTrips = trips?.filter(trip => new Date(trip.departure_date) > now) || []

      // Get expenses stats
      const expensesQuery = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      const { data: expenses } = await (signal ? expensesQuery.abortSignal(signal) : expensesQuery)

      const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0

      // Get notes count
      const notesQuery = supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)

      const { count: notesCount } = await (signal ? notesQuery.abortSignal(signal) : notesQuery)

      setStats({
        totalTrips: trips?.length || 0,
        upcomingTrips: upcomingTrips.length,
        totalExpenses,
        totalNotes: notesCount || 0,
        recentTrips: trips?.slice(0, 5) || [],
        recentExpenses: expenses?.slice(0, 5) || [],
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const controller = new AbortController()
      loadDashboardData(controller.signal)
      return () => controller.abort()
    }
  }, [user, loadDashboardData])

  const statCards = [
    {
      name: 'Total de Viajes',
      value: stats.totalTrips,
      icon: MapIcon,
      color: 'bg-blue-500',
      href: '/trips',
    },
    {
      name: 'Próximos Viajes',
      value: stats.upcomingTrips,
      icon: CalendarIcon,
      color: 'bg-green-500',
      href: '/trips',
    },
    {
      name: 'Gastos Totales',
      value: formatCurrency(stats.totalExpenses),
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      href: '/expenses',
    },
    {
      name: 'Notas',
      value: stats.totalNotes,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      href: '/notes',
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user?.full_name || 'Usuario'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Aquí tienes un resumen de tus viajes y actividades recientes.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <Link
              key={card.name}
              href={card.href}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${card.color} p-3 rounded-md`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Trips */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Viajes Recientes</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.recentTrips.length > 0 ? (
                stats.recentTrips.map((trip) => (
                  <div key={trip.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {trip.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {trip.origin} → {trip.destination}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(trip.departure_date)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                        trip.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        trip.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {trip.status === 'completed' ? 'Completado' :
                         trip.status === 'confirmed' ? 'Confirmado' :
                         trip.status === 'cancelled' ? 'Cancelado' :
                         'Planeado'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">No tienes viajes registrados aún.</p>
                  <Link
                    href="/trips/new"
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                  >
                    Crear tu primer viaje
                  </Link>
                </div>
              )}
            </div>
            {stats.recentTrips.length > 0 && (
              <div className="px-6 py-3 bg-gray-50">
                <Link
                  href="/trips"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Ver todos los viajes →
                </Link>
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Gastos Recientes</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.recentExpenses.length > 0 ? (
                stats.recentExpenses.map((expense) => (
                  <div key={expense.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {expense.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {expense.category}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(expense.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">No tienes gastos registrados aún.</p>
                  <Link
                    href="/expenses/new"
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                  >
                    Registrar tu primer gasto
                  </Link>
                </div>
              )}
            </div>
            {stats.recentExpenses.length > 0 && (
              <div className="px-6 py-3 bg-gray-50">
                <Link
                  href="/expenses"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Ver todos los gastos →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}