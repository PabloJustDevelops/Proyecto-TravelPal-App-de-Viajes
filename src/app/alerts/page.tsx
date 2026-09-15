'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AlertCard from '@/components/alerts/AlertCard'
import Button from '@/components/ui/Button'
import PageTitle from '@/components/ui/PageTitle'
import { useAuth } from '@/contexts/AuthContext'
import { createInsforgeClient, Alert } from '@/lib/insforge'
import { logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/utils'
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

  const loadAlerts = useCallback(async (signal?: AbortSignal) => {
    const insforge = createInsforgeClient()

    try {
      const query = insforge
        .database.from('alerts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      const { data, error } = await (signal ? query.abortSignal(signal) : query)

      if (error) throw error

      setAlerts(data || [])
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const message = getErrorMessage(err)
      logger.error('AlertsPage: Error loading alerts', { error: message })
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
      const controller = new AbortController()
      loadAlerts(controller.signal)
      return () => controller.abort()
    } else {
      // Evitar spinner infinito cuando no hay usuario
      setLoading(false)
    }
  }, [user, loadAlerts])

  useEffect(() => {
    filterAlerts()
  }, [alerts, typeFilter, statusFilter, filterAlerts])

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
          <h3 className="text-lg font-semibold text-gray-900">Inicia sesión para ver tus alertas</h3>
          <p className="mt-1 text-sm text-gray-500">La sección de alertas requiere autenticación.</p>
          <Button className="mt-4" onClick={() => (window.location.href = '/signin')}>Ir a Login</Button>
        </div>
      </DashboardLayout>
    )
  }

  const handleMarkAsRead = async (alertId: string) => {
    setActionLoading(alertId)
    const insforge = createInsforgeClient()

    try {
      const { error } = await insforge
        .database.from('alerts')
        .update({ is_read: true })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ))
    } catch (err: unknown) {
      const message = getErrorMessage(err)
      logger.error('AlertsPage: Error marking alert as read', { error: message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDismiss = async (alertId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta alerta?')) return

    setActionLoading(alertId)
    const insforge = createInsforgeClient()

    try {
      const { error } = await insforge
        .database.from('alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error

      setAlerts(alerts.filter(alert => alert.id !== alertId))
    } catch (err: unknown) {
      const message = getErrorMessage(err)
      logger.error('AlertsPage: Error dismissing alert', { error: message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadAlerts = alerts.filter(alert => !alert.is_read)
    if (unreadAlerts.length === 0) return

    setActionLoading('all')
    const insforge = createInsforgeClient()

    try {
      const { error } = await insforge
        .database.from('alerts')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false)

      if (error) throw error

      setAlerts(alerts.map(alert => ({ ...alert, is_read: true })))
    } catch (err: unknown) {
      const message = getErrorMessage(err)
      logger.error('AlertsPage: Error marking all alerts as read', { error: message })
    } finally {
      setActionLoading(null)
    }
  }

  const getTypeLabel = (type: Alert['type']) => {
    const labels: Record<Alert['type'], string> = {
      reminder: 'Recordatorio',
      warning: 'Advertencia',
      info: 'Información',
    }
    return labels[type]
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageTitle
            title="Alertas"
            subtitle="Gestiona tus recordatorios y notificaciones"
          />
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => handleMarkAllAsRead()}>
              <CheckIcon className="h-5 w-5 mr-2" /> Marcar todas como leídas
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">Tipo:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm border rounded p-1"
              >
                <option value="all">Todos</option>
                <option value="reminder">Recordatorios</option>
                <option value="warning">Advertencias</option>
                <option value="info">Información</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border rounded p-1"
              >
                <option value="all">Todos</option>
                <option value="unread">No leídos</option>
                <option value="read">Leídos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
              <p className="text-sm text-gray-500 mt-2">Cargando alertas...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay alertas que coincidan con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert}
                  onMarkAsRead={() => handleMarkAsRead(alert.id)}
                  onDismiss={() => handleDismiss(alert.id)}
                  isLoading={actionLoading === alert.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}