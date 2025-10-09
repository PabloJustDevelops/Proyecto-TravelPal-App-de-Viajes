'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarIcon, 
  MapIcon, 
  ClockIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar } from '../../components/calendar/Calendar';
import { ItineraryPlanner } from '../../components/planning/ItineraryPlanner';
import { BookingCard } from '../../components/planning/BookingCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { createSupabaseClient } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';

interface Trip {
  id: string;
  title: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  status: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'trip' | 'activity' | 'booking' | 'reminder';
  color: string;
  time?: string;
  description?: string;
  tripId?: string;
}

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

export default function PlanningPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'itinerary' | 'bookings'>('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showBookingModal, setShowBookingModal] = useState(false);

  const supabase = createSupabaseClient();

  const loadTrips = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user?.id)
        .order('departure_date', { ascending: true });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  }, [user, supabase]);

  const loadBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simular carga de reservas (en una implementación real, esto vendría de Supabase)
      const mockBookings: Booking[] = [
        {
          id: '1',
          type: 'flight',
          title: 'Vuelo Madrid - Barcelona',
          confirmationNumber: 'IB1234',
          status: 'confirmed',
          startDate: '2024-03-15',
          startTime: '08:30',
          endTime: '10:00',
          location: 'Aeropuerto Madrid-Barajas',
          cost: 150,
          currency: 'EUR',
          contact: {
            name: 'Iberia',
            phone: '+34 901 111 500',
            email: 'info@iberia.com'
          },
          reminders: [
            {
              id: 'r1',
              message: 'Check-in online disponible',
              datetime: '2024-03-14T08:30:00',
              sent: false
            }
          ]
        },
        {
          id: '2',
          type: 'hotel',
          title: 'Hotel Barcelona Center',
          confirmationNumber: 'HBC789',
          status: 'confirmed',
          startDate: '2024-03-15',
          endDate: '2024-03-18',
          location: 'Barcelona, España',
          address: 'Carrer de Pelai, 22, 08001 Barcelona',
          cost: 300,
          currency: 'EUR',
          contact: {
            name: 'Hotel Barcelona Center',
            phone: '+34 933 426 565',
            email: 'reservas@barcelonacenter.com'
          }
        }
      ];

      setBookings(mockBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateCalendarEvents = useCallback(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Eventos de viajes
    trips.forEach(trip => {
      calendarEvents.push({
        id: `trip_${trip.id}`,
        title: trip.title,
        date: trip.departure_date,
        type: 'trip',
        color: 'bg-blue-500 text-white',
        description: `Inicio del viaje a ${trip.destination}`,
        tripId: trip.id
      });

      if (trip.return_date && trip.return_date !== trip.departure_date) {
        calendarEvents.push({
          id: `trip_end_${trip.id}`,
          title: `Fin - ${trip.title}`,
          date: trip.return_date,
          type: 'trip',
          color: 'bg-blue-400 text-white',
          description: `Fin del viaje a ${trip.destination}`,
          tripId: trip.id
        });
      }
    });

    // Eventos de reservas
    bookings.forEach(booking => {
      calendarEvents.push({
        id: `booking_${booking.id}`,
        title: booking.title,
        date: booking.startDate,
        type: 'booking',
        color: booking.status === 'confirmed' 
          ? 'bg-green-500 text-white' 
          : booking.status === 'pending'
          ? 'bg-yellow-500 text-white'
          : 'bg-red-500 text-white',
        time: booking.startTime,
        description: booking.description,
        tripId: booking.tripId
      });
    });

    setEvents(calendarEvents);
  }, [trips, bookings]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      loadTrips();
      loadBookings();
    }
  }, [user, loadTrips, loadBookings]);

  // Generar eventos del calendario cuando cambien los datos
  useEffect(() => {
    generateCalendarEvents();
  }, [trips, bookings, generateCalendarEvents]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Buscar si hay un viaje activo en esa fecha
    const activeTrip = trips.find(trip => {
      const startDate = new Date(trip.departure_date);
      const endDate = trip.return_date ? new Date(trip.return_date) : startDate;
      return date >= startDate && date <= endDate;
    });
    
    if (activeTrip) {
      setSelectedTrip(activeTrip);
      setViewMode('itinerary');
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'trip' && event.tripId) {
      const trip = trips.find(t => t.id === event.tripId);
      if (trip) {
        setSelectedTrip(trip);
        setViewMode('itinerary');
      }
    } else if (event.type === 'booking') {
      setViewMode('bookings');
    }
  };

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.confirmationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const upcomingBookings = bookings
    .filter(booking => new Date(booking.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Planificación de Viajes</h1>
            <p className="text-gray-600">
              Organiza tus viajes, itinerarios y reservas en un solo lugar
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg shadow-sm">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  viewMode === 'calendar'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <CalendarIcon className="h-4 w-4 mr-2 inline" />
                Calendario
              </button>
              <button
                onClick={() => setViewMode('itinerary')}
                className={`px-4 py-2 text-sm font-medium border-l-0 border ${
                  viewMode === 'itinerary'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <MapIcon className="h-4 w-4 mr-2 inline" />
                Itinerario
              </button>
              <button
                onClick={() => setViewMode('bookings')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border-l-0 border ${
                  viewMode === 'bookings'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ClockIcon className="h-4 w-4 mr-2 inline" />
                Reservas
              </button>
            </div>
            
            <Button
              onClick={() => setShowBookingModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Viajes Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.filter(t => t.status === 'confirmed' || t.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reservas Confirmadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Próximas Reservas</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlusIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eventos Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.filter(e => {
                    const eventDate = new Date(e.date);
                    const now = new Date();
                    return eventDate.getMonth() === now.getMonth() && 
                           eventDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Calendar
                events={events}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                onAddEvent={handleAddEvent}
              />
            </div>
            
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Próximas Reservas</h3>
                <div className="space-y-3">
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} className="border-l-4 border-blue-500 pl-3">
                      <p className="font-medium text-sm text-gray-900">{booking.title}</p>
                      <p className="text-xs text-gray-600">
                        {formatDate(new Date(booking.startDate))}
                        {booking.startTime && ` - ${booking.startTime}`}
                      </p>
                    </div>
                  ))}
                  {upcomingBookings.length === 0 && (
                    <p className="text-sm text-gray-500">No hay reservas próximas</p>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Viajes Activos</h3>
                <div className="space-y-3">
                  {trips.filter(t => t.status === 'confirmed' || t.status === 'in_progress').map(trip => (
                    <div 
                      key={trip.id} 
                      className="border-l-4 border-green-500 pl-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => {
                        setSelectedTrip(trip);
                        setViewMode('itinerary');
                      }}
                    >
                      <p className="font-medium text-sm text-gray-900">{trip.title}</p>
                      <p className="text-xs text-gray-600">{trip.destination}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(new Date(trip.departure_date))} - {trip.return_date ? formatDate(new Date(trip.return_date)) : 'Sin fecha de regreso'}
                      </p>
                    </div>
                  ))}
                  {trips.filter(t => t.status === 'confirmed' || t.status === 'in_progress').length === 0 && (
                    <p className="text-sm text-gray-500">No hay viajes activos</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {viewMode === 'itinerary' && (
          <div>
            {selectedTrip ? (
              <div>
                <div className="mb-6">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('calendar')}
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
                  endDate={selectedTrip.return_date || selectedTrip.departure_date}
                  onSave={(itinerary) => {
                    console.log('Saving itinerary:', itinerary);
                    // Aquí se guardaría el itinerario en Supabase
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
                  {trips.map(trip => (
                    <Card 
                      key={trip.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTrip(trip)}
                    >
                      <h4 className="font-medium text-gray-900">{trip.title}</h4>
                      <p className="text-sm text-gray-600">{trip.destination}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(new Date(trip.departure_date))} - {trip.return_date ? formatDate(new Date(trip.return_date)) : 'Sin fecha de regreso'}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'bookings' && (
          <div className="space-y-6">
            {/* Filtros y búsqueda */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar reservas..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
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
              {filteredBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onEdit={() => {}}
                  onDelete={(id) => {
                    setBookings(prev => prev.filter(b => b.id !== id));
                  }}
                  onStatusChange={(id, status) => {
                    setBookings(prev => prev.map(b => 
                      b.id === id ? { ...b, status } : b
                    ));
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
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Comienza agregando tu primera reserva'
                  }
                </p>
                <Button
                  onClick={() => setShowBookingModal(true)}
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
            onClose={() => setShowBookingModal(false)}
            title="Nueva Reserva"
          >
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Funcionalidad de creación de reservas en desarrollo...
              </p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}