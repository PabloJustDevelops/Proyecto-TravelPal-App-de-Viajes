'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TripCard from '@/components/trips/TripCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient, Trip } from '@/lib/supabase'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function TripsPage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadTrips = useCallback(async () => {
    const supabase = createSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user!.id)
        .order('departure_date', { ascending: false })

      if (error) throw error

      setTrips(data || [])
    } catch (error) {
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
      loadTrips()
    }
  }, [user, loadTrips])

  useEffect(() => {
    filterTrips()
  }, [trips, searchTerm, statusFilter, filterTrips])

  const getStatusCounts = () => {
    const now = new Date()
    return {
      all: trips.length,
      upcoming: trips.filter(
        (trip) => new Date(trip.departure_date) > now && trip.status !== 'cancelled'
      ).length,
      planned: trips.filter((trip) => trip.status === 'planned').length,
      confirmed: trips.filter((trip) => trip.status === 'confirmed').length,
      completed: trips.filter((trip) => trip.status === 'completed').length,
      cancelled: trips.filter((trip) => trip.status === 'cancelled').length,
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
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
              Gestiona y organiza todos tus viajes
            </p>
          </div>
          <Link href="/trips/new">
            <Button className="mt-4 sm:mt-0">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Viaje
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos ({statusCounts.all})</option>
                <option value="upcoming">Próximos ({statusCounts.upcoming})</option>
                <option value="planned">Planeados ({statusCounts.planned})</option>
                <option value="confirmed">Confirmados ({statusCounts.confirmed})</option>
                <option value="completed">Completados ({statusCounts.completed})</option>
                <option value="cancelled">Cancelados ({statusCounts.cancelled})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron viajes'
                : 'No tienes viajes registrados'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primer viaje'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <div className="mt-6">
                <Link href="/trips/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear Primer Viaje
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}