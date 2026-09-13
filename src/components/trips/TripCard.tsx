'use client'

import { Trip } from '@/lib/insforge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import {
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface TripCardProps {
  trip: Trip
}

export default function TripCard({ trip }: TripCardProps) {
  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: Trip['status']) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'confirmed':
        return 'Confirmado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Planeado'
    }
  }

  const isUpcoming = new Date(trip.departure_date) > new Date()

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{trip.title}</CardTitle>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                trip.status
              )}`}
            >
              {getStatusText(trip.status)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Route */}
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPinIcon className="h-4 w-4" />
            <span className="text-sm">
              {trip.origin} → {trip.destination}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              <div className="text-sm">
                <div className="font-medium">Salida</div>
                <div>{formatDate(trip.departure_date)}</div>
              </div>
            </div>
            {trip.return_date && (
              <div className="flex items-center space-x-2 text-gray-600">
                <ClockIcon className="h-4 w-4" />
                <div className="text-sm">
                  <div className="font-medium">Regreso</div>
                  <div>{formatDate(trip.return_date)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Flight Info */}
          {(trip.airline || trip.flight_number) && (
            <div className="flex items-center space-x-2 text-gray-600">
              <PaperAirplaneIcon className="h-4 w-4" />
              <span className="text-sm">
                {trip.airline && trip.flight_number
                  ? `${trip.airline} ${trip.flight_number}`
                  : trip.airline || trip.flight_number}
              </span>
            </div>
          )}

          {/* Notes Preview */}
          {trip.notes && (
            <div className="text-sm text-gray-500 line-clamp-2">
              {trip.notes}
            </div>
          )}

          {/* Upcoming indicator */}
          {isUpcoming && trip.status !== 'cancelled' && (
            <div className="flex items-center space-x-1 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Próximo viaje</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}