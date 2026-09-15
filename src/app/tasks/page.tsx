"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import PageTitle from "@/components/ui/PageTitle";
import ErrorState from "@/components/ui/ErrorState";
import { Task } from "@/lib/insforge";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskCalendarView } from "@/components/tasks/TaskCalendarView";
import { TaskModal } from "@/components/tasks/TaskModal";
import {
  PlusIcon,
  ViewColumnsIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { showToast } from "@/lib/toast";
import { getLoadErrorMessage } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useApiResource } from "@/hooks/use-api-resource";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<"board" | "calendar">("board");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    data,
    loading,
    error: loadError,
    refetch,
  } = useApiResource<Task[]>("/api/tasks");

  useEffect(() => {
    if (data) setTasks(data);
  }, [data]);

  const error = getLoadErrorMessage(loadError, {
    timeout: "La carga de tareas ha tardado demasiado.",
    request: "No se pudieron cargar las tareas.",
  });

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
      refetch(); // Reload tasks
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
        <ErrorState
          message={error}
          onRetry={() => refetch()}
          title="Error al cargar las tareas"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <PageTitle
            title="Mis Tareas"
            subtitle="Gestiona tus pendientes y proyectos"
          />

          <div className="flex items-center gap-3">
            <div className="bg-surface rounded-lg border border-line p-1 flex">
              <button
                onClick={() => setViewMode("board")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "board"
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-strong"
                }`}
                title="Vista Tablero"
              >
                <ViewColumnsIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "calendar"
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-strong"
                }`}
                title="Vista Calendario"
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
            </div>

            <Button
              onClick={handleCreateTask}
              className="gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Tarea</span>
            </Button>
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
