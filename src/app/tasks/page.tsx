"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Task } from "@/lib/supabase";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskCalendarView } from "@/components/tasks/TaskCalendarView";
import { TaskModal } from "@/components/tasks/TaskModal";
import {
  PlusIcon,
  ViewColumnsIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { showToast } from "@/lib/toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "calendar">("board");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 15000)
      );

      const fetchPromise = fetch("/api/tasks");
      const res = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!res.ok) throw new Error("Error al cargar tareas");
      const data = await res.json();
      setTasks(data);
    } catch (error: any) {
      console.error(error);
      if (error.message === "Timeout") {
        setError("La carga de tareas ha tardado demasiado.");
      } else {
        setError("No se pudieron cargar las tareas.");
      }
      showToast({ type: "error", message: "Error al cargar las tareas" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (data: Partial<Task>) => {
    try {
      setSaving(true);
      const method = editingTask ? "PUT" : "POST";
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error al guardar la tarea");

      showToast({
        type: "success",
        message: editingTask ? "Tarea actualizada" : "Tarea creada",
      });
      setIsModalOpen(false);
      fetchTasks(); // Reload tasks
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: "Error al guardar la tarea" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      showToast({ type: "success", message: "Tarea eliminada" });
      setTasks(tasks.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: "Error al eliminar la tarea" });
    }
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: Task["status"],
  ) => {
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado");

      // No need to fetch if successful, state is already updated
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: "Error al actualizar el estado" });
      setTasks(previousTasks); // Revert on error
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
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
          <p className="text-gray-900 font-medium mb-2">Error al cargar las tareas</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => fetchTasks()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Tareas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestiona tus pendientes y proyectos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 flex">
              <button
                onClick={() => setViewMode("board")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "board"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
                title="Vista Tablero"
              >
                <ViewColumnsIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "calendar"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
                title="Vista Calendario"
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleCreateTask}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Tarea</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : viewMode === "board" ? (
            <TaskBoard
              tasks={tasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <TaskCalendarView
              tasks={tasks}
              onTaskClick={handleEditTask}
              onDateSelect={() => {
                // Optional: open modal with pre-selected date
                handleCreateTask();
              }}
            />
          )}
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        initialData={editingTask}
        isLoading={saving}
      />
    </DashboardLayout>
  );
}
