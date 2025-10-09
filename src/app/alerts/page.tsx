'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AlertCard from '@/components/alerts/AlertCard'
import Button from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient, Alert } from '@/lib/supabase'
import { 
  BellIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AlertsPage() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadAlerts = useCallback(async () => {
    const supabase = createSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setAlerts(data || [])
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const filterAlerts = useCallback(() => {
    let filtered = alerts

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.type === typeFilter)
    }

    // Filter by status
    if (statusFilter === 'unread') {
      filtered = filtered.filter((alert) => !alert.is_read)
    } else if (statusFilter === 'read') {
      filtered = filtered.filter((alert) => alert.is_read)
    }

    setFilteredAlerts(filtered)
  }, [alerts, typeFilter, statusFilter])

  useEffect(() => {
    if (user) {
      loadAlerts()
    }
  }, [user, loadAlerts])

  useEffect(() => {
    filterAlerts()
  }, [alerts, typeFilter, statusFilter, filterAlerts])

  const handleMarkAsRead = async (alertId: string) => {
    setActionLoading(alertId)
    const supabase = createSupabaseClient()

    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ))
    } catch (error) {
      console.error('Error marking alert as read:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDismiss = async (alertId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta alerta?')) return

    setActionLoading(alertId)
    const supabase = createSupabaseClient()

    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error

      setAlerts(alerts.filter(alert => alert.id !== alertId))
    } catch (error) {
      console.error('Error dismissing alert:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadAlerts = alerts.filter(alert => !alert.is_read)
    if (unreadAlerts.length === 0) return

    setActionLoading('all')
    const supabase = createSupabaseClient()

    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false)

      if (error) throw error

      setAlerts(alerts.map(alert => ({ ...alert, is_read: true })))
    } catch (error) {
      console.error('Error marking all alerts as read:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todas las alertas?')) return

    setActionLoading('clear')
    const supabase = createSupabaseClient()

    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('user_id', user!.id)

      if (error) throw error

      setAlerts([])
    } catch (error) {
      console.error('Error clearing all alerts:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getAlertStats = () => {
    const total = alerts.length
    const unread = alerts.filter(alert => !alert.is_read).length
    const byType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { total, unread, byType }
  }

  const stats = getAlertStats()

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
            <h1 className="text-2xl font-bold text-gray-900">Alertas y Notificaciones</h1>
            <p className="mt-1 text-sm text-gray-500">
              Mantente informado sobre tus viajes y actividades
            </p>
          </div>
          
          {alerts.length > 0 && (
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              {stats.unread > 0 && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  loading={actionLoading === 'all'}
                  disabled={!!actionLoading}
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              )}
              
              <Button
                variant="danger"
                onClick={handleClearAll}
                loading={actionLoading === 'clear'}
                disabled={!!actionLoading}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Limpiar todas
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Total</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl">🔔</div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">No leídas</div>
                <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl">⚠️</div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Advertencias</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.byType.warning || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl">⏰</div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Recordatorios</div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.byType.reminder || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {alerts.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <FunnelIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="info">Información</option>
                  <option value="warning">Advertencia</option>
                  <option value="error">Error</option>
                  <option value="success">Éxito</option>
                  <option value="reminder">Recordatorio</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas</option>
                  <option value="unread">No leídas</option>
                  <option value="read">Leídas</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Alerts List */}
        {filteredAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
                showActions={!actionLoading || actionLoading === alert.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <BellIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No se encontraron alertas'
                : 'No tienes alertas'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros'
                : 'Las alertas aparecerán aquí cuando tengas notificaciones importantes'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}