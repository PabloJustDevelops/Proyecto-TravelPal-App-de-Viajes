"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import NoteCard from "@/components/notes/NoteCard";
import NoteEditor from "@/components/notes/NoteEditor";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { selectClassName } from "@/components/ui/fieldStyles";
import { useAuth } from "@/contexts/AuthContext";
import { createInsforgeClient, Note, Trip } from "@/lib/insforge";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/utils";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useApiResource } from "@/hooks/use-api-resource";

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tripFilter, setTripFilter] = useState<string>("all");

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);

  const url = !authLoading && user?.id ? "/api/notes" : null;
  const {
    data,
    loading,
    error: loadError,
    refetch,
  } = useApiResource<{
    notes: (Note & { trip?: Trip })[];
    trips: Trip[];
  }>(url);

  const { notes, trips, filteredNotes } = useMemo(() => {
    const notesData = data?.notes ?? [];
    const tripsData = data?.trips ?? [];

    let filtered = notesData;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.trip?.title.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((note) => note.category === categoryFilter);
    }

    // Filter by trip
    if (tripFilter !== "all") {
      filtered = filtered.filter((note) => note.trip_id === tripFilter);
    }

    return { notes: notesData, trips: tripsData, filteredNotes: filtered };
  }, [data, searchTerm, categoryFilter, tripFilter]);

  const error = loadError
    ? "Error al cargar las notas. Por favor, inténtalo de nuevo."
    : null;

  const showSkeleton =
    authLoading || loading || (url !== null && data === null && !loadError);

  const handleSaveNote = async (noteData: Partial<Note>) => {
    setEditorLoading(true);

    try {
      if (editingNote) {
        // Update existing note
        // TODO: Implement PUT API
        const insforge = createInsforgeClient();
        const { error } = await insforge
          .database.from("notes")
          .update({
            title: noteData.title,
            content: noteData.content,
            category: noteData.category,
            trip_id: noteData.trip_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingNote.id);

        if (error) throw error;
      } else {
        // Create new note using API
        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: noteData.title,
                content: noteData.content,
                category: noteData.category,
                trip_id: noteData.trip_id || null
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Error al guardar la nota');
        }
      }

      refetch();
      handleCloseEditor();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Error al guardar la nota");
      logger.error("NotesPage: Error saving note", { error: message });
      // Show error to user?
      alert(message); // Simple alert for now or use a toast if available
    } finally {
      setEditorLoading(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
  };

  // Funciones auxiliares eliminadas - no se utilizan en este componente

  const getCategoryCounts = () => {
    return notes.reduce(
      (acc, note) => {
        const category = note.category || "general";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  };

  const categoryCounts = getCategoryCounts();

  if (showSkeleton) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar los datos
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">
            Inicia sesión para gestionar tus notas
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            La sección de notas requiere autenticación.
          </p>
          <Button
            className="mt-4"
            onClick={() => (window.location.href = "/signin")}
          >
            Ir a Login
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mis Notas
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Organiza y documenta toda la información de tus viajes
            </p>
          </div>
          <Button onClick={() => setShowEditor(true)} className="mt-4 sm:mt-0">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Nota
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Notas
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notes.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Itinerarios
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categoryCounts.itinerary || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <BuildingOffice2Icon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Alojamientos
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categoryCounts.accommodation || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Emergencias
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categoryCounts.emergency || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">Todas las categorías</option>
                <option value="general">General</option>
                <option value="itinerary">Itinerario</option>
                <option value="accommodation">Alojamiento</option>
                <option value="transport">Transporte</option>
                <option value="restaurant">Restaurante</option>
                <option value="activity">Actividad</option>
                <option value="shopping">Compras</option>
                <option value="emergency">Emergencia</option>
                <option value="contact">Contacto</option>
              </select>
            </div>

            {/* Trip Filter */}
            <div className="lg:w-48">
              <select
                value={tripFilter}
                onChange={(e) => setTripFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">Todos los viajes</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                showTripTitle
                onEdit={handleEditNote}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <DocumentTextIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {searchTerm || categoryFilter !== "all" || tripFilter !== "all"
                ? "No se encontraron notas"
                : "No tienes notas registradas"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || categoryFilter !== "all" || tripFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primera nota"}
            </p>
            {!searchTerm &&
              categoryFilter === "all" &&
              tripFilter === "all" && (
                <div className="mt-6">
                  <Button onClick={() => setShowEditor(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear Primera Nota
                  </Button>
                </div>
              )}
          </div>
        )}

        {/* Note Editor Modal */}
        <Modal
          isOpen={showEditor}
          onClose={handleCloseEditor}
          title={editingNote ? "Editar Nota" : "Nueva Nota"}
          size="xl"
        >
          <NoteEditor
            note={editingNote || undefined}
            trips={trips}
            onSave={handleSaveNote}
            onCancel={handleCloseEditor}
            loading={editorLoading}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
