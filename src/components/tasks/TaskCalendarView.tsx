import React from 'react';
import { Calendar } from '@/components/calendar/Calendar';
import { Task } from '@/lib/insforge';

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateSelect: (date: Date) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onTaskClick,
  onDateSelect
}) => {
  // Transformar tareas a eventos del calendario
  const events = tasks
    .filter(task => task.due_date) // Solo tareas con fecha
    .map(task => {
      const dateObj = new Date(task.due_date!);
      const dateStr = dateObj.toISOString().split('T')[0];
      
      let color = 'bg-gray-500';
      if (task.status === 'completed') color = 'bg-green-500';
      else if (task.priority === 'high') color = 'bg-red-500';
      else if (task.priority === 'medium') color = 'bg-yellow-500';
      else color = 'bg-blue-500';

      return {
        id: task.id,
        title: task.title,
        date: dateStr,
        type: 'task' as const,
        color: color,
        description: task.description,
        // Usamos properties adicionales si Calendar lo permite, o mapeamos por ID al hacer click
      };
    });

  return (
    <div className="h-full">
      <Calendar
        events={events}
        onDateSelect={onDateSelect}
        onEventClick={(event) => {
          const task = tasks.find(t => t.id === event.id);
          if (task) onTaskClick(task);
        }}
        onAddEvent={onDateSelect}
        className="h-full min-h-[600px]"
      />
    </div>
  );
};
