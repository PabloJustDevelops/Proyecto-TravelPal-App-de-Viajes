import React from 'react';
import { Task } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarIcon, 
  FlagIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  className?: string;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete,
  className = ''
}) => {
  return (
    <motion.div
      layoutId={task.id}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[task.priority]} font-medium flex items-center gap-1`}>
          <FlagIcon className="w-3 h-3" />
          {priorityLabels[task.priority]}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
      
      {task.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      
      {task.due_date && (
        <div className="flex items-center text-xs text-gray-500 mt-2">
          <CalendarIcon className="w-4 h-4 mr-1" />
          {format(new Date(task.due_date), "d 'de' MMM", { locale: es })}
        </div>
      )}
    </motion.div>
  );
};
