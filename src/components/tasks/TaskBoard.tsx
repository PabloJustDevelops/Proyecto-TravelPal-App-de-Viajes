import React, { useState } from 'react';
import { Task } from '@/lib/insforge';
import { TaskCard } from './TaskCard';
import { TrashIcon } from '@heroicons/react/24/outline';

interface TaskBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const columns: { id: Task['status']; title: string; color: string; bg: string }[] = [
  { id: 'pending', title: 'Pendiente', color: 'border-gray-200', bg: 'bg-gray-50' },
  { id: 'in_progress', title: 'En Progreso', color: 'border-blue-200', bg: 'bg-blue-50' },
  { id: 'completed', title: 'Completada', color: 'border-green-200', bg: 'bg-green-50' },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTrash, setDragOverTrash] = useState(false);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    setIsDragging(true);
    // Set drag image or effect if needed
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverTrash(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  const handleTrashDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTrash(true);
  };

  const handleTrashDragLeave = () => {
    setDragOverTrash(false);
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        onDeleteTask(task);
      }
    }
    setDragOverTrash(false);
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Trash Zone - Visible only when dragging */}
      <div 
        className={`
          absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50
          transition-all duration-300 ease-in-out
          ${isDragging ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
        `}
        onDragOver={handleTrashDragOver}
        onDragLeave={handleTrashDragLeave}
        onDrop={handleTrashDrop}
      >
        <div className={`
          flex items-center gap-3 px-8 py-4 rounded-full shadow-lg border-2
          backdrop-blur-sm transition-colors
          ${dragOverTrash 
            ? 'bg-red-100 border-red-500 text-red-600 scale-110' 
            : 'bg-white/90 border-red-200 text-gray-500 hover:border-red-400 hover:text-red-500'
          }
        `}>
          <TrashIcon className={`w-8 h-8 ${dragOverTrash ? 'animate-bounce' : ''}`} />
          <span className="font-medium text-lg">Soltar para eliminar</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-20 h-full min-h-[500px]">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          
          return (
            <div
              key={col.id}
              className={`flex-1 min-w-[300px] rounded-xl border ${col.color} ${col.bg} p-4 flex flex-col h-full transition-colors`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    col.id === 'pending' ? 'bg-gray-400' : 
                    col.id === 'in_progress' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <h3 className="font-semibold text-gray-700">{col.title}</h3>
                </div>
                <span className="bg-white px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-100">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className="cursor-move transform transition-transform active:scale-[1.02] active:rotate-1"
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                    />
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-gray-300/50 rounded-lg flex flex-col items-center justify-center text-gray-400 gap-2">
                    <span className="text-sm">Vacío</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
