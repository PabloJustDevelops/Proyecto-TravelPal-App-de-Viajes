'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient, Trip } from '@/lib/supabase'
import { PlusIcon, MagnifyingGlassIcon, PlayIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function TripsPage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadTrips = useCallback(async (signal?: AbortSignal) => {
    if (!user) return
    const supabase = createSupabaseClient()

    try {
      const query = supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('departure_date', { ascending: false })

      const { data, error } = await (signal ? query.abortSignal(signal) : query)

      if (error) throw error

      setTrips(data || [])
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Error loading trips:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const filterTrips = useCallback(() => {
    let filtered = trips

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (trip) =>
          trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.airline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.flight_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'upcoming') {
        filtered = filtered.filter(
          (trip) => new Date(trip.departure_date) > new Date() && trip.status !== 'cancelled'
        )
      } else {
        filtered = filtered.filter((trip) => trip.status === statusFilter)
      }
    }

    setFilteredTrips(filtered)
  }, [trips, searchTerm, statusFilter])

  useEffect(() => {
    if (user) {
      const controller = new AbortController()
      loadTrips(controller.signal)
      return () => controller.abort()
    } else {
      // Evitar spinner infinito cuando no hay usuario
      setLoading(false)
    }
  }, [user, loadTrips])

  useEffect(() => {
    filterTrips()
  }, [trips, searchTerm, statusFilter, filterTrips])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">Inicia sesión para ver tus viajes</h3>
          <p className="mt-1 text-sm text-gray-500">La sección de viajes requiere autenticación.</p>
          <Link href="/signin">
            <Button className="mt-4">Ir a Login</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Viajes</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona tus itinerarios y reservas
            </p>
          </div>
          <Link href="/trips/new" className="mt-4 sm:mt-0">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Viaje
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar viajes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="planned">Planificado</option>
                <option value="confirmed">Confirmado</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
                <option value="upcoming">Próximos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{trip.title}</h3>
                    <p className="text-sm text-gray-500">{trip.origin} → {trip.destination}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                    {trip.status}
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <div>Salida: {new Date(trip.departure_date).toLocaleDateString()}</div>
                  {trip.return_date && (
                    <div>Regreso: {new Date(trip.return_date).toLocaleDateString()}</div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Link href={`/trips/${trip.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Ver detalles
                  </Link>
                  <div className="flex items-center text-gray-500">
                    <PlayIcon className="h-5 w-5 mr-1" />
                    {trip.airline || 'Sin aerolínea'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              {/* Placeholder icon */}
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12"><path d="M2 16l20-12M2 16l7-1m13-11l-4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes viajes registrados</h3>
            <p className="mt-1 text-sm text-gray-500">Crea tu primer viaje para empezar a planificar.</p>
            <div className="mt-6">
              <Link href="/trips/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Primer Viaje
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}