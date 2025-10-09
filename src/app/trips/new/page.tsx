'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function NewTripPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    origin: '',
    destination: '',
    departure_date: '',
    return_date: '',
    airline: '',
    flight_number: '',
    confirmation_code: '',
    notes: '',
    status: 'planned' as const,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()

      // Validate required fields
      if (!formData.title || !formData.origin || !formData.destination || !formData.departure_date) {
        throw new Error('Por favor completa todos los campos requeridos')
      }

      // Validate dates
      const departureDate = new Date(formData.departure_date)
      const returnDate = formData.return_date ? new Date(formData.return_date) : null

      if (returnDate && returnDate <= departureDate) {
        throw new Error('La fecha de regreso debe ser posterior a la fecha de salida')
      }

      const tripData = {
        user_id: user!.id,
        title: formData.title,
        origin: formData.origin,
        destination: formData.destination,
        departure_date: formData.departure_date,
        return_date: formData.return_date || null,
        airline: formData.airline || null,
        flight_number: formData.flight_number || null,
        confirmation_code: formData.confirmation_code || null,
        notes: formData.notes || null,
        status: formData.status,
      }

      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select()
        .single()

      if (error) throw error

      router.push(`/trips/${data.id}`)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating trip'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/trips">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Viaje</h1>
            <p className="text-sm text-gray-500">Crea un nuevo viaje y organiza todos los detalles</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Viaje</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
                
                <Input
                  label="Título del Viaje *"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="ej. Vacaciones en París"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Origen *"
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    placeholder="ej. Madrid"
                    required
                  />
                  <Input
                    label="Destino *"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="ej. París"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Fecha de Salida *"
                    name="departure_date"
                    type="datetime-local"
                    value={formData.departure_date}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Fecha de Regreso"
                    name="return_date"
                    type="datetime-local"
                    value={formData.return_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Estado del Viaje
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="planned">Planeado</option>
                    <option value="confirmed">Confirmado</option>
                  </select>
                </div>
              </div>

              {/* Flight Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Información de Vuelo</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Aerolínea"
                    name="airline"
                    value={formData.airline}
                    onChange={handleInputChange}
                    placeholder="ej. Iberia"
                  />
                  <Input
                    label="Número de Vuelo"
                    name="flight_number"
                    value={formData.flight_number}
                    onChange={handleInputChange}
                    placeholder="ej. IB3201"
                  />
                </div>

                <Input
                  label="Código de Confirmación"
                  name="confirmation_code"
                  value={formData.confirmation_code}
                  onChange={handleInputChange}
                  placeholder="ej. ABC123"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notas Adicionales
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Añade cualquier información adicional sobre el viaje..."
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1 sm:flex-none"
                >
                  Crear Viaje
                </Button>
                <Link href="/trips" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}