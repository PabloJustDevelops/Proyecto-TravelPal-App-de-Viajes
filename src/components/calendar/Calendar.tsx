'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { formatDate } from '../../lib/utils';

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

interface CalendarProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onDateSelect,
  onEventClick,
  onAddEvent,
  selectedDate,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Obtener el primer día del mes y calcular los días a mostrar
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generar array de días para mostrar en el calendario
  const calendarDays = [];
  
  // Días del mes anterior
  const prevMonth = new Date(currentYear, currentMonth - 1, 0);
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i),
      isCurrentMonth: false
    });
  }

  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      date: new Date(currentYear, currentMonth, day),
      isCurrentMonth: true
    });
  }

  // Días del mes siguiente para completar la grilla
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      date: new Date(currentYear, currentMonth + 1, day),
      isCurrentMonth: false
    });
  }

  // Obtener eventos para una fecha específica
  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events.filter(event => event.date === dateStr);
  };

  // Navegación del calendario
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Verificar si una fecha está seleccionada
  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  // Verificar si una fecha es hoy
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  // Manejar click en una fecha
  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  // Manejar click en agregar evento
  const handleAddEvent = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddEvent?.(date);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header del calendario */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-1"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-1"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
          >
            Hoy
          </Button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm font-medium rounded-l-md border ${
                viewMode === 'month'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm font-medium rounded-r-md border-l-0 border ${
                viewMode === 'week'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAYS.map(day => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grilla del calendario */}
      <div className="grid grid-cols-7">
        {calendarDays.map((calendarDay, index) => {
          const dayEvents = getEventsForDate(calendarDay.date);
          const isSelected = isDateSelected(calendarDay.date);
          const isTodayDate = isToday(calendarDay.date);

          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border-r border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                !calendarDay.isCurrentMonth ? 'bg-gray-50/50' : ''
              } ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => handleDateClick(calendarDay.date)}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    !calendarDay.isCurrentMonth
                      ? 'text-gray-400'
                      : isTodayDate
                      ? 'text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center'
                      : 'text-gray-900'
                  }`}
                >
                  {calendarDay.date.getDate()}
                </span>
                {calendarDay.isCurrentMonth && (
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleAddEvent(calendarDay.date, e)}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded-full hover:bg-gray-200 transition-opacity"
                    title="Agregar evento"
                  >
                    <PlusIcon className="h-3 w-3 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Eventos del día */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${event.color}`}
                    title={`${event.title}${event.time ? ` - ${event.time}` : ''}`}
                  >
                    <div className="truncate font-medium">
                      {event.title}
                    </div>
                    {event.time && (
                      <div className="text-xs opacity-75">
                        {event.time}
                      </div>
                    )}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda de tipos de eventos */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-gray-600">Viajes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600">Actividades</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-gray-600">Reservas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-gray-600">Recordatorios</span>
          </div>
        </div>
      </div>
    </div>
  );
};