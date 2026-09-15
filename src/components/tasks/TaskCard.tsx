import React from 'react';
import { Task } from '@/lib/insforge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarIcon, 
  FlagIcon, 
  PencilSquareIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { selectClassName } from '@/components/ui/fieldStyles';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  className?: string;
}

const priorityConfig = {
  low: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Baja' },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Media' },
  high: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Alta' },
};

const statusOptions: { value: Task['status']; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'completed', label: 'Completada' },
];

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete,
  onStatusChange,
  className = ''
}) => {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  const handleStatusChange = (value: string) => {
    const option = statusOptions.find((candidate) => candidate.value === value);
    if (option) onStatusChange(task.id, option.value);
  };

  return (
    <div
      className={`
        bg-white p-4 rounded-xl shadow-sm border border-gray-200 
        hover:shadow-md transition-all duration-200 group relative
        ${className}
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`
          text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5
          ${priority.color}
        `}>
          <FlagIcon className="w-3 h-3" />
          {priority.label}
        </span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="h-7 w-7 p-0"
            title="Editar tarea"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Eliminar tarea"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-1.5 leading-snug pr-8">
        {task.title}
      </h3>
      
      {task.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-50">
        {task.due_date ? (
          <div className="flex items-center text-xs font-medium text-gray-500">
            <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400" aria-hidden="true" />
            {format(new Date(task.due_date), "d 'de' MMM", { locale: es })}
          </div>
        ) : (
          <span />
        )}

        {/* El tablero mueve las tareas por arrastre, que no existe ni con teclado ni en tactil:
            este selector es la via alternativa, y usa la clase de campo compartida. */}
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          draggable={false}
          aria-label={`Mover la tarea ${task.title}`}
          className={cn(selectClassName, 'h-7 w-auto px-2 py-0 text-xs')}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
