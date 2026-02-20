import React, { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  TrashIcon
} from '@heroicons/react/24/outline';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addWeeks,
  subWeeks,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'trip' | 'activity' | 'booking' | 'reminder' | 'task';
  color: string;
  time?: string;
  description?: string;
  tripId?: string;
  bookingId?: string;
  activityId?: string;
  icon?: React.ReactNode;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void;
  selectedDate?: Date;
  className?: string;
}

const DraggableEvent = ({ event, onClick, onContextMenu }: { event: CalendarEvent; onClick: (e: any) => void; onContextMenu: (e: any) => void }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: event
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
    position: 'relative' as const,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`
        group flex items-center gap-1 p-1 rounded cursor-grab active:cursor-grabbing
        hover:opacity-90 transition-all shadow-sm mb-1
        ${event.color} border-l-2 border-white/20 relative
      `}
      title={`${event.title}${event.time ? ` - ${event.time}` : ''}\n${event.description || ''}`}
    >
      {event.icon && (
        <span className="text-white/90 flex-shrink-0 w-3 h-3">
          {event.icon}
        </span>
      )}
      {event.time && (
        <span className="text-[10px] font-medium opacity-90 whitespace-nowrap bg-black/10 px-1 rounded">
          {event.time.substring(0, 5)}
        </span>
      )}
      <span className="text-xs font-medium truncate flex-1 text-white">
        {event.title}
      </span>
    </div>
  );
};

const DroppableDay = ({ 
  day, 
  children, 
  className, 
  onClick, 
  onDoubleClick 
}: { 
  day: Date; 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void; 
  onDoubleClick?: (e: any) => void 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day }
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-blue-100 ring-2 ring-inset ring-blue-400' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </div>
  );
};

export const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onDateSelect,
  onEventClick,
  onAddEvent,
  onDeleteEvent,
  onEventDrop,
  selectedDate,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, event: CalendarEvent } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, event: CalendarEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      event
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.data.current) {
      const draggedEvent = active.data.current as CalendarEvent;
      const newDate = (over.data.current as { date: Date }).date;
      
      // Only trigger if date changed
      if (draggedEvent.date !== format(newDate, 'yyyy-MM-dd')) {
        onEventDrop?.(draggedEvent, newDate);
      }
    }
  };

  // Navegación
  const next = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const prev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generación de días
  const getDays = () => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  };

  const days = getDays();
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Filtrar eventos
  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events.filter(event => event.date === dayStr);
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 border-l border-t border-gray-200 bg-white">
      {days.map((day, idx) => {
        const dayEvents = getEventsForDay(day);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isTodayDay = isToday(day);
        const isCurrentMonth = isSameMonth(day, currentDate);

        return (
          <DroppableDay
            key={day.toISOString()}
            day={day}
            className={`
              min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer 
              transition-colors relative hover:bg-gray-50
              ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'text-gray-900'}
              ${isSelected ? 'bg-blue-50/50' : ''}
            `}
            onClick={() => onDateSelect?.(day)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onAddEvent?.(day);
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                  ${isTodayDay ? 'bg-blue-600 text-white shadow-sm' : ''}
                `}
              >
                {format(day, 'd')}
              </span>
            </div>
            
            <div className="space-y-1 overflow-y-auto max-h-[90px] custom-scrollbar">
              {dayEvents.map(event => (
                <DraggableEvent
                  key={event.id}
                  event={event}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, event)}
                />
              ))}
            </div>
          </DroppableDay>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="grid grid-cols-7 border-l border-t border-gray-200 bg-white h-[600px]">
      {days.map((day) => {
        const dayEvents = getEventsForDay(day);
        const isTodayDay = isToday(day);

        return (
          <DroppableDay
            key={day.toISOString()}
            day={day}
            className={`
              border-r border-b border-gray-200 p-2 overflow-y-auto
              ${isTodayDay ? 'bg-blue-50/30' : ''}
            `}
            onClick={() => onDateSelect?.(day)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onAddEvent?.(day);
            }}
          >
             <div className="text-center mb-4 sticky top-0 bg-inherit pb-2 border-b border-gray-100">
               <span className="text-xs text-gray-500 uppercase block mb-1">
                 {format(day, 'EEE', { locale: es })}
               </span>
               <span className={`
                 inline-flex items-center justify-center w-8 h-8 rounded-full text-lg font-semibold
                 ${isTodayDay ? 'bg-blue-600 text-white' : 'text-gray-900'}
               `}>
                 {format(day, 'd')}
               </span>
             </div>
             
             <div className="space-y-2">
               {dayEvents
                 .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                 .map(event => (
                   <DraggableEvent
                     key={event.id}
                     event={event}
                     onClick={(e) => {
                       e.stopPropagation();
                       onEventClick?.(event);
                     }}
                     onContextMenu={(e) => handleContextMenu(e, event)}
                   />
                 ))}
             </div>
          </DroppableDay>
        );
      })}
    </div>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 capitalize min-w-[200px]">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <div className="flex items-center rounded-md border border-gray-200 bg-white shadow-sm">
              <button
                onClick={prev}
                className="p-1.5 hover:bg-gray-50 text-gray-600 border-r border-gray-200"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hoy
              </button>
              <button
                onClick={next}
                className="p-1.5 hover:bg-gray-50 text-gray-600 border-l border-gray-200"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => setViewMode('month')}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-md transition-all
                ${viewMode === 'month' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-md transition-all
                ${viewMode === 'week' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              Semana
            </button>
          </div>
        </div>

        {/* Días de la semana (Header) */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
          {weekDays.map(day => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Vistas */}
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        
        {/* Footer Leyenda */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/30 flex flex-wrap gap-6 text-xs">
          {[
            { label: 'Viajes', color: 'bg-blue-500' },
            { label: 'Reservas', color: 'bg-green-500' },
            { label: 'Pendiente', color: 'bg-yellow-500' },
            { label: 'Actividades', color: 'bg-purple-500' },
            { label: 'Tareas', color: 'bg-emerald-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${item.color} ring-2 ring-white shadow-sm`} />
              <span className="font-medium text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-white border border-gray-200 shadow-lg rounded-md py-1 z-50 min-w-[120px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteEvent?.(contextMenu.event);
                setContextMenu(null);
              }}
            >
              <TrashIcon className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
};
