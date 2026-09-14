"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  MapIcon,
  ClockIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  HomeModernIcon,
  TruckIcon,
  TicketIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Calendar,
  type CalendarEvent,
} from "../../components/calendar/Calendar";
import { ItineraryPlanner } from "../../components/planning/ItineraryPlanner";
import { BookingCard } from "../../components/planning/BookingCard";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";

import NewBookingForm from "../../components/planning/NewBookingForm";
import { useAuth } from "../../contexts/AuthContext";
import { createInsforgeClient, Booking } from "../../lib/insforge";
import { formatDate } from "../../lib/utils";
import { logger } from "@/lib/logger";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useApiResource } from "@/hooks/use-api-resource";

import { format } from 'date-fns';

interface Trip {
  id: string;
  title: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  status: string;
}

interface ItineraryActivity {
  id: string;
  trip_id: string;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  category?: string;
  description?: string;
  location?: string;
  cost?: number;
  currency?: string;
  notes?: string;
  completed?: boolean;
}

export default function PlanningPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<
    "calendar" | "itinerary" | "bookings"
  >("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [silentReload, setSilentReload] = useState(false);

  const insforge = createInsforgeClient();

  // Función para obtener el icono según el tipo
  const getEventIcon = (type: string, category?: string) => {
    // Si es un booking, el tipo suele ser 'flight', 'hotel', etc.
    // Si es activity, tiene una category
    const typeToCheck = category || type;

    switch (typeToCheck) {
      case "flight":
      case "transport":
        return <PaperAirplaneIcon className="h-3 w-3" />;
      case "hotel":
      case "accommodation":
        return <HomeModernIcon className="h-3 w-3" />;
      case "car":
        return <TruckIcon className="h-3 w-3" />;
      case "activity":
      case "restaurant":
        return <TicketIcon className="h-3 w-3" />;
      default:
        return <TagIcon className="h-3 w-3" />;
    }
  };

  const url = !authLoading && user ? "/api/planning" : null;
  const {
    data,
    loading,
    error: loadError,
    refetch,
  } = useApiResource<{
    trips: Trip[];
    bookings: Booking[];
    activities: ItineraryActivity[];
  }>(url);

  const { trips, activities } = useMemo(
    () => ({
      trips: data?.trips ?? [],
      activities: data?.activities ?? [],
    }),
    [data],
  );

  useEffect(() => {
    if (data) setBookings(data.bookings ?? []);
  }, [data]);

  useEffect(() => {
    setSilentReload(false);
  }, [data, loadError]);

  const error = loadError
    ? "Error al cargar la planificación. Por favor, inténtalo de nuevo."
    : null;

  const showSkeleton =
    authLoading ||
    (loading && !silentReload) ||
    (url !== null && data === null && !loadError);

  const generateCalendarEvents = useCallback(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Eventos de viajes
    trips.forEach((trip) => {
      calendarEvents.push({
        id: `trip_${trip.id}`,
        title: trip.title,
        date: trip.departure_date,
        type: "trip",
        color: "bg-blue-500 text-white",
        description: `Inicio del viaje a ${trip.destination}`,
        tripId: trip.id,
        icon: <PaperAirplaneIcon className="h-3 w-3" />,
      });

      if (trip.return_date && trip.return_date !== trip.departure_date) {
        calendarEvents.push({
          id: `trip_end_${trip.id}`,
          title: `Fin - ${trip.title}`,
          date: trip.return_date,
          type: "trip",
          color: "bg-blue-400 text-white",
          description: `Fin del viaje a ${trip.destination}`,
          tripId: trip.id,
          icon: <PaperAirplaneIcon className="h-3 w-3" />,
        });
      }
    });

    // Eventos de reservas
    bookings.forEach((booking) => {
      calendarEvents.push({
        id: `booking_${booking.id}`,
        title: booking.title,
        date: booking.start_date,
        type: "booking",
        color:
          booking.status === "confirmed"
            ? "bg-green-500 text-white"
            : booking.status === "pending"
              ? "bg-orange-500 text-white"
              : "bg-red-500 text-white",
        time: booking.start_time,
        description: booking.description,
        tripId: booking.trip_id,
        bookingId: booking.id,
        icon: getEventIcon(booking.type),
      });
    });

    // Eventos de actividades
    activities.forEach((activity) => {
      calendarEvents.push({
        id: `activity_${activity.id}`,
        title: activity.title,
        date: activity.date,
        type: "activity",
        color: "bg-purple-500 text-white",
        time: activity.start_time,
        description: activity.description,
        tripId: activity.trip_id,
        activityId: activity.id,
        icon: getEventIcon("activity", activity.category),
      });
    });

    setEvents(calendarEvents);
  }, [trips, bookings, activities]);

  // Transformar actividades para el planificador de itinerarios
  const getTripItinerary = useCallback(
    (tripId: string) => {
      const tripActivities = activities.filter((a) => a.trip_id === tripId);
      const itineraryMap = new Map<string, any[]>();

      tripActivities.forEach((a) => {
        const activity = {
          id: a.id,
          title: a.title,
          description: a.description,
          startTime: a.start_time || "",
          endTime: a.end_time || "",
          category: a.category || "other",
          location: a.location,
          cost: a.cost,
          currency: a.currency,
          notes: a.notes,
          completed: a.completed,
        };

        if (!itineraryMap.has(a.date)) {
          itineraryMap.set(a.date, []);
        }
        itineraryMap.get(a.date)?.push(activity);
      });

      const itinerary: any[] = [];
      itineraryMap.forEach((acts, date) => {
        itinerary.push({
          date,
          activities: acts,
          notes: "",
        });
      });

      return itinerary;
    },
    [activities],
  );

  // Generar eventos del calendario cuando cambien los datos
  useEffect(() => {
    generateCalendarEvents();
  }, [trips, bookings, activities, generateCalendarEvents]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Buscar si hay un viaje activo en esa fecha
    const activeTrip = trips.find((trip) => {
      if (!trip.departure_date) return false;
      const startDate = new Date(trip.departure_date);
      const endDate = trip.return_date ? new Date(trip.return_date) : startDate;
      return date >= startDate && date <= endDate;
    });

    if (activeTrip) {
      setSelectedTrip(activeTrip);
      // Mantener en vista calendario o permitir cambiar, pero no forzar itinerario si falla
      // setViewMode("itinerary"); // Comentado para evitar cambio brusco si falla
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === "trip" && event.tripId) {
      // Redirigir a la página de detalle del viaje
      router.push(`/trips/${event.tripId}`);
    } else if (event.type === "booking" && event.bookingId) {
      // Abrir el modal de edición de reserva
      const booking = bookings.find((b) => b.id === event.bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setShowBookingModal(true);
      }
    } else if (event.type === "activity" && event.tripId) {
      // Ir a la vista de itinerario del viaje
      router.push(`/trips/${event.tripId}`);
    }
  };

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setSelectedBooking(null); // Asegurarse de que no estamos editando
    setShowBookingModal(true);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${event.title}"?`)) {
      return;
    }

    void (async () => {
      try {
        if (event.type === "booking" && event.bookingId) {
          const { error } = await insforge
            .database.from("bookings")
            .delete()
            .eq("id", event.bookingId);

          if (error) throw error;
        } else if (event.type === "activity" && event.activityId) {
          const { error } = await insforge
            .database.from("itinerary_activities")
            .delete()
            .eq("id", event.activityId);

          if (error) throw error;
        } else if (event.type === "trip" && event.tripId) {
          const { error } = await insforge
            .database.from("trips")
            .delete()
            .eq("id", event.tripId);

          if (error) throw error;
        }

        refetch();
      } catch (error) {
        logger.error("Error deleting event:", error);
        alert("Error al eliminar el evento");
      }
    })();
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.confirmation_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const upcomingBookings = bookings
    .filter((booking) => new Date(booking.start_date) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    )
    .slice(0, 5);

  const handleBookingCreated = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
    refetch();
  };

  const handleEventDrop = async (event: CalendarEvent, newDate: Date) => {
    try {
      // Use date-fns format to get the date string in 'YYYY-MM-DD' format using local time
      // This avoids timezone issues that occur with toISOString()
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      
      // Update local state optimistically
      setEvents(prev => prev.map(e => 
        e.id === event.id ? { ...e, date: formattedDate } : e
      ));

      // Update in DB based on event type
      if (event.type === 'booking' && event.bookingId) {
        const { error } = await insforge
          .database.from('bookings')
          .update({ start_date: formattedDate })
          .eq('id', event.bookingId);
        if (error) throw error;
      } else if (event.type === 'activity' && event.activityId) {
        const { error } = await insforge
          .database.from('itinerary_activities')
          .update({ date: formattedDate })
          .eq('id', event.activityId);
        if (error) throw error;
      } else if (event.type === 'trip' && event.tripId) {
        // For trips, we might need to handle end date logic, but for simple move:
        const { error } = await insforge
          .database.from('trips')
          .update({ departure_date: formattedDate })
          .eq('id', event.tripId);
        if (error) throw error;
      }

      // Reload data to ensure consistency, but silently (without loading spinner)
      setSilentReload(true);
      refetch();
    } catch (error) {
      console.error('Error updating event date:', error);
      alert('Error al mover el evento');
      setSilentReload(true); // Revert on error
      refetch();
    }
  };

  if (showSkeleton) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar los datos
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Planificación de Viajes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organiza tus viajes, itinerarios y reservas en un solo lugar
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg shadow-sm bg-white dark:bg-gray-800">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  viewMode === "calendar"
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                <CalendarIcon className="h-4 w-4 mr-2 inline" />
                Calendario
              </button>
              <button
                onClick={() => setViewMode("itinerary")}
                className={`px-4 py-2 text-sm font-medium border-l-0 border ${
                  viewMode === "itinerary"
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                <MapIcon className="h-4 w-4 mr-2 inline" />
                Itinerario
              </button>
              <button
                onClick={() => setViewMode("bookings")}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border-l-0 border ${
                  viewMode === "bookings"
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                <ClockIcon className="h-4 w-4 mr-2 inline" />
                Reservas
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Viajes Activos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    trips.filter(
                      (t) =>
                        t.status === "confirmed" || t.status === "in_progress",
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Reservas Confirmadas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Próximas Reservas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {upcomingBookings.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlusIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Eventos Este Mes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    events.filter((e) => {
                      const eventDate = new Date(e.date);
                      const now = new Date();
                      return (
                        eventDate.getMonth() === now.getMonth() &&
                        eventDate.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        {viewMode === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Calendar
                events={events}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                onEventDrop={handleEventDrop}
              />
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Próximas Reservas
                </h3>
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border-l-4 border-green-500 pl-3 dark:border-green-400"
                    >
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {booking.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(new Date(booking.start_date))}
                        {booking.start_time && ` - ${booking.start_time}`}
                      </p>
                    </div>
                  ))}
                  {upcomingBookings.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay reservas próximas
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Viajes Activos
                </h3>
                <div className="space-y-3">
                  {trips
                    .filter(
                      (t) =>
                        t.status === "confirmed" || t.status === "in_progress",
                    )
                    .map((trip) => (
                      <div
                        key={trip.id}
                        className="border-l-4 border-blue-500 pl-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        onClick={() => router.push(`/trips/${trip.id}`)}
                      >
                        <p className="font-medium text-sm text-gray-900">
                          {trip.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {trip.destination}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(new Date(trip.departure_date))} -{" "}
                          {trip.return_date
                            ? formatDate(new Date(trip.return_date))
                            : "Sin fecha de regreso"}
                        </p>
                      </div>
                    ))}
                  {trips.filter(
                    (t) =>
                      t.status === "confirmed" || t.status === "in_progress",
                  ).length === 0 && (
                    <p className="text-sm text-gray-500">
                      No hay viajes activos
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {viewMode === "itinerary" && (
          <div>
            {selectedTrip ? (
              <div>
                <div className="mb-6">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode("calendar")}
                    className="mb-4"
                  >
                    ← Volver al calendario
                  </Button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Itinerario: {selectedTrip.title}
                  </h2>
                  <p className="text-gray-600">{selectedTrip.destination}</p>
                </div>

                <ItineraryPlanner
                  tripId={selectedTrip.id}
                  startDate={selectedTrip.departure_date}
                  endDate={
                    selectedTrip.return_date || selectedTrip.departure_date
                  }
                  itinerary={getTripItinerary(selectedTrip.id)}
                  onSave={(itinerary) => {
                    logger.debug("Saving itinerary:", itinerary);
                    // Aquí se guardaría el itinerario en InsForge
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona un viaje
                </h3>
                <p className="text-gray-600 mb-4">
                  Elige un viaje para planificar su itinerario detallado
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {trips.map((trip) => (
                    <Card
                      key={trip.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTrip(trip)}
                    >
                      <h4 className="font-medium text-gray-900">
                        {trip.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {trip.destination}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(new Date(trip.departure_date))} -{" "}
                        {trip.return_date
                          ? formatDate(new Date(trip.return_date))
                          : "Sin fecha de regreso"}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === "bookings" && (
          <div className="space-y-6">
            {/* Filtros y búsqueda */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar reservas..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFilterStatus(e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="pending">Pendiente</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Lista de reservas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onEdit={() => {
                    setSelectedBooking(booking);
                    setShowBookingModal(true);
                  }}
                  onDelete={(id) => {
                    setBookings((prev) => prev.filter((b) => b.id !== id));
                  }}
                  onStatusChange={(id, status) => {
                    setBookings((prev) =>
                      prev.map((b) => (b.id === id ? { ...b, status } : b)),
                    );
                  }}
                />
              ))}
            </div>

            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron reservas
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Comienza agregando tu primera reserva"}
                </p>
                <Button
                  onClick={() => {
                    setSelectedBooking(null);
                    setShowBookingModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nueva Reserva
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Modal para nueva reserva */}
        {showBookingModal && (
          <Modal
            isOpen={showBookingModal}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedBooking(null);
            }}
            title={selectedBooking ? "Editar Reserva" : "Nueva Reserva"}
          >
            <div className="p-6">
              <NewBookingForm
                onSuccess={handleBookingCreated}
                onCancel={() => {
                  setShowBookingModal(false);
                  setSelectedBooking(null);
                }}
                initialData={selectedBooking}
                defaultDate={selectedDate}
              />
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
