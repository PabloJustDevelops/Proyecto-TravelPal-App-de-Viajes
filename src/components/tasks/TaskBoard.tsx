import React from 'react';
import { Task } from '@/lib/supabase';
import { TaskCard } from './TaskCard';
import { motion } from 'framer-motion';

interface TaskBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const columns: { id: Task['status']; title: string; color: string }[] = [
  { id: 'pending', title: 'Pendiente', color: 'bg-gray-100 border-gray-200' },
  { id: 'in_progress', title: 'En Progreso', color: 'bg-blue-50 border-blue-200' },
  { id: 'completed', title: 'Completada', color: 'bg-green-50 border-green-200' },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 h-full min-h-[500px]">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        
        return (
          <div
            key={col.id}
            className={`flex-1 min-w-[300px] rounded-xl border ${col.color} p-4 flex flex-col h-full`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">{col.title}</h3>
              <span className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-500 shadow-sm">
                {colTasks.length}
              </span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {colTasks.length === 0 ? (
                <div className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  Arrastra tareas aquí
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="cursor-move"
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
