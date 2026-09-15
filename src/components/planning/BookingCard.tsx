"use client";

import React, { useState } from "react";
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
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import Button from "../ui/Button";
import CategoryIcon from "../ui/CategoryIcon";
import { Card } from "../ui/Card";
import { formatDate } from "../../lib/utils";
import { Booking } from "@/lib/insforge";

interface BookingCardProps {
  booking: Booking;
  onEdit?: (booking: Booking) => void;
  onDelete?: (bookingId: string) => void;
  onStatusChange?: (bookingId: string, status: Booking["status"]) => void;
  className?: string;
}

const BOOKING_TYPES = {
  flight: { label: "Vuelo", category: "flight", color: "bg-blue-100 text-blue-800" },
  hotel: { label: "Hotel", category: "hotel", color: "bg-purple-100 text-purple-800" },
  car: { label: "Auto", category: "car", color: "bg-green-100 text-green-800" },
  activity: {
    label: "Actividad",
    category: "activity",
    color: "bg-orange-100 text-orange-800",
  },
  restaurant: {
    label: "Restaurante",
    category: "restaurant",
    color: "bg-red-100 text-red-800",
  },
  other: { label: "Otro", category: "other", color: "bg-gray-100 text-gray-800" },
};

const STATUS_CONFIG = {
  confirmed: {
    label: "Confirmado",
    color: "bg-green-100 text-green-800",
    icon: CheckCircleIcon,
  },
  pending: {
    label: "Pendiente",
    color: "bg-orange-100 text-orange-800",
    icon: ClockIcon,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800",
    icon: ExclamationTriangleIcon,
  },
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onEdit,
  onDelete,
  onStatusChange,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const bookingType = BOOKING_TYPES[booking.type] || BOOKING_TYPES.other;
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const formatDateRange = () => {
    const start = formatDate(new Date(booking.start_date));
    if (booking.end_date && booking.end_date !== booking.start_date) {
      const end = formatDate(new Date(booking.end_date));
      return `${start} - ${end}`;
    }
    return start;
  };

  const formatTimeRange = () => {
    if (!booking.start_time) return null;
    if (booking.end_time && booking.end_time !== booking.start_time) {
      return `${booking.start_time} - ${booking.end_time}`;
    }
    return booking.start_time;
  };

  // Reminders logic removed as it's a separate table now and not joined by default in simple fetch
  // TODO: Add support for reminders if fetched with join

  return (
    <Card
      className={`overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CategoryIcon
                category={bookingType.category}
                className="h-6 w-6 text-gray-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {booking.title}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${bookingType.color}`}
                >
                  {bookingType.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Confirmación:{" "}
                <span className="font-mono font-medium">
                  {booking.confirmation_number || "N/A"}
                </span>
              </p>
              {booking.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {booking.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              <span>{statusConfig.label}</span>
            </div>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(booking)}>
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
              {booking.cost} {booking.currency || "USD"}
            </div>
          )}
        </div>

        {/* Botón para expandir detalles */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? "Ocultar detalles" : "Ver detalles"}
          </Button>

          {onStatusChange && booking.status !== "confirmed" && (
            <div className="flex space-x-2">
              {booking.status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange(booking.id, "confirmed")}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  Confirmar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(booking.id, "cancelled")}
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
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Dirección
                </h4>
                <p className="text-sm text-gray-600">{booking.address}</p>
              </div>
            )}

            {/* Información de contacto */}
            {(booking.contact_name ||
              booking.contact_phone ||
              booking.contact_email) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Contacto
                </h4>
                <div className="space-y-1">
                  {booking.contact_name && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      <span>{booking.contact_name}</span>
                    </div>
                  )}
                  {booking.contact_phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4" />
                      <a
                        href={`tel:${booking.contact_phone}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {booking.contact_phone}
                      </a>
                    </div>
                  )}
                  {booking.contact_email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4" />
                      <a
                        href={`mailto:${booking.contact_email}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {booking.contact_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notas */}
            {booking.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Notas
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {booking.notes}
                </p>
              </div>
            )}

            {/* Documentos */}
            {booking.documents && booking.documents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Documentos
                </h4>
                <div className="space-y-1">
                  {booking.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      <a href={doc} target="_blank" rel="noopener noreferrer">
                        Documento {index + 1}
                      </a>
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
