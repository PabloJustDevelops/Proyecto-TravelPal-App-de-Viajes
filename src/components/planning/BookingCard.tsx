'use client';

import React, { useState } from 'react';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import { formatDate } from '../../lib/utils';

interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'car' | 'activity' | 'restaurant' | 'other';
  title: string;
  description?: string;
  confirmationNumber: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  address?: string;
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  cost?: number;
  currency?: string;
  notes?: string;
  documents?: string[];
  reminders?: {
    id: string;
    message: string;
    datetime: string;
    sent: boolean;
  }[];
  tripId?: string;
}

interface BookingCardProps {
  booking: Booking;
  onEdit?: (booking: Booking) => void;
  onDelete?: (bookingId: string) => void;
  onStatusChange?: (bookingId: string, status: Booking['status']) => void;
  className?: string;
}

const BOOKING_TYPES = {
  flight: { label: 'Vuelo', icon: '✈️', color: 'bg-blue-100 text-blue-800' },
  hotel: { label: 'Hotel', icon: '🏨', color: 'bg-purple-100 text-purple-800' },
  car: { label: 'Auto', icon: '🚗', color: 'bg-green-100 text-green-800' },
  activity: { label: 'Actividad', icon: '🎯', color: 'bg-orange-100 text-orange-800' },
  restaurant: { label: 'Restaurante', icon: '🍽️', color: 'bg-red-100 text-red-800' },
  other: { label: 'Otro', icon: '📝', color: 'bg-gray-100 text-gray-800' }
};

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon }
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onEdit,
  onDelete,
  onStatusChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const bookingType = BOOKING_TYPES[booking.type];
  const statusConfig = STATUS_CONFIG[booking.status];
  const StatusIcon = statusConfig.icon;

  const formatDateRange = () => {
    const start = formatDate(new Date(booking.startDate));
    if (booking.endDate && booking.endDate !== booking.startDate) {
      const end = formatDate(new Date(booking.endDate));
      return `${start} - ${end}`;
    }
    return start;
  };

  const formatTimeRange = () => {
    if (!booking.startTime) return null;
    if (booking.endTime && booking.endTime !== booking.startTime) {
      return `${booking.startTime} - ${booking.endTime}`;
    }
    return booking.startTime;
  };

  const getUpcomingReminders = () => {
    if (!booking.reminders) return [];
    const now = new Date();
    return booking.reminders
      .filter(reminder => !reminder.sent && new Date(reminder.datetime) > now)
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  };

  const upcomingReminders = getUpcomingReminders();

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">{bookingType.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {booking.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${bookingType.color}`}>
                  {bookingType.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Confirmación: <span className="font-mono font-medium">{booking.confirmationNumber}</span>
              </p>
              {booking.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {booking.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3" />
              <span>{statusConfig.label}</span>
            </div>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(booking)}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(booking.id)}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span>{formatDateRange()}</span>
          </div>
          
          {formatTimeRange() && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 flex-shrink-0" />
              <span>{formatTimeRange()}</span>
            </div>
          )}
          
          {booking.location && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
              <span>{booking.location}</span>
            </div>
          )}
          
          {booking.cost && (
            <div className="text-sm font-medium text-gray-900">
              {booking.cost} {booking.currency || 'USD'}
            </div>
          )}
        </div>

        {/* Recordatorios próximos */}
        {upcomingReminders.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              Recordatorios próximos
            </h4>
            <div className="space-y-1">
              {upcomingReminders.slice(0, 2).map(reminder => (
                <div key={reminder.id} className="text-xs text-yellow-700">
                  {reminder.message} - {formatDate(new Date(reminder.datetime))}
                </div>
              ))}
              {upcomingReminders.length > 2 && (
                <div className="text-xs text-yellow-600">
                  +{upcomingReminders.length - 2} más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botón para expandir detalles */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
          </Button>

          {onStatusChange && booking.status !== 'confirmed' && (
            <div className="flex space-x-2">
              {booking.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange(booking.id, 'confirmed')}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  Confirmar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(booking.id, 'cancelled')}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Detalles expandidos */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Dirección */}
            {booking.address && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Dirección</h4>
                <p className="text-sm text-gray-600">{booking.address}</p>
              </div>
            )}

            {/* Información de contacto */}
            {booking.contact && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Contacto</h4>
                <div className="space-y-1">
                  {booking.contact.name && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      <span>{booking.contact.name}</span>
                    </div>
                  )}
                  {booking.contact.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4" />
                      <a 
                        href={`tel:${booking.contact.phone}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {booking.contact.phone}
                      </a>
                    </div>
                  )}
                  {booking.contact.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4" />
                      <a 
                        href={`mailto:${booking.contact.email}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {booking.contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notas */}
            {booking.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Notas</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}

            {/* Documentos */}
            {booking.documents && booking.documents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Documentos</h4>
                <div className="space-y-1">
                  {booking.documents.map((doc, index) => (
                    <div key={index} className="text-sm text-blue-600 hover:text-blue-700">
                      <a href={doc} target="_blank" rel="noopener noreferrer">
                        Documento {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Todos los recordatorios */}
            {booking.reminders && booking.reminders.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recordatorios</h4>
                <div className="space-y-2">
                  {booking.reminders.map(reminder => (
                    <div 
                      key={reminder.id} 
                      className={`p-2 rounded text-sm ${
                        reminder.sent 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      <div className="font-medium">{reminder.message}</div>
                      <div className="text-xs opacity-75">
                        {formatDate(new Date(reminder.datetime))}
                        {reminder.sent && ' (Enviado)'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};